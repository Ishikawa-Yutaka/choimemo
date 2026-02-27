/**
 * Firebase メール操作の処理ページ
 *
 * Firebase のメール（確認メール・パスワードリセットメール）のリンクをクリックすると
 * このページに遷移します。
 *
 * URLの形式:
 * https://choimemo.com/__/auth/action?mode=verifyEmail&oobCode=xxx
 *
 * URLパラメータ:
 * - mode      : 操作の種類（verifyEmail / resetPassword など）
 * - oobCode   : Firebaseが発行したワンタイムコード（1回限り有効）
 *
 * 対応する操作:
 * - verifyEmail    : メールアドレスの確認（アカウント作成完了）
 * - resetPassword  : パスワードのリセット（新しいパスワードを設定）
 */

import React, { useEffect, useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { z } from 'zod'
import PasswordInput from '../components/PasswordInput'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  getAuthErrorMessage,
  type FirebaseAuthError,
} from '../lib/errorHandlers'
import logo from '../assets/logo.png'
import './AuthActionPage.css'

/**
 * 処理の状態を表す型
 *
 * - loading    : 処理中（oobCode の検証中）
 * - success    : 処理成功（メール確認完了）
 * - error      : 処理失敗
 * - resetForm  : パスワードリセットフォームを表示
 * - resetDone  : パスワードリセット完了
 */
type Status = 'loading' | 'success' | 'error' | 'resetForm' | 'resetDone'

/**
 * パスワードリセットのバリデーションスキーマ（Zod）
 *
 * - パスワード: 6文字以上（Firebase の最低要件）
 * - 確認用パスワード: 一致するかチェック
 */
const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
    confirmPassword: z.string().min(1, '確認用パスワードを入力してください'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

/**
 * Firebase メール操作を処理するコンポーネント
 *
 * @returns 処理結果を表示するJSX要素
 */
const AuthActionPage: React.FC = () => {
  // URLのクエリパラメータを取得するフック
  // 例: ?mode=verifyEmail&oobCode=xxx から mode と oobCode を取得
  const [searchParams] = useSearchParams()

  // AuthContext から認証状態を取得
  // authLoading: Firebase Auth の初期化が完了したかどうか（true = まだ初期化中）
  // user: ログイン中のユーザー（初期化完了前は null）
  // refreshUser: reload() 後に React の State を更新するために使用
  const { user, loading: authLoading, refreshUser } = useAuth()

  // ページ遷移に使用（replace: true で履歴を残さない）
  const navigate = useNavigate()

  // 処理の状態を管理（loading → success / error / resetForm）
  const [status, setStatus] = useState<Status>('loading')

  // エラーメッセージを管理
  const [errorMessage, setErrorMessage] = useState('')

  // applyActionCode の二重実行を防ぐためのRef
  // useEffect は依存配列の変化で再実行されるが、
  // 非同期処理中に再実行されると同じ oobCode で二重呼び出しになる。
  // Ref は React のレンダリングサイクルに依存しないため、
  // 即座にフラグを立てて二重実行を確実に防げる。
  const actionStartedRef = useRef(false)

  // --- パスワードリセット用のState ---
  const [oobCode, setOobCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  useEffect(() => {
    /**
     * Firebase Auth の初期化完了を待ってからアクションを実行する
     *
     * 【なぜ待つ必要があるか】
     * ページ読み込み直後は Firebase Auth がまだ初期化中で、
     * auth.currentUser が null になっている。
     * この状態で applyActionCode → refreshUser() を実行すると、
     * refreshUser() 内の auth.currentUser が null のため空振りし、
     * emailVerified がクライアント側で更新されない。
     *
     * authLoading が false になるのを待つことで、
     * auth.currentUser が確実に利用可能な状態でアクションを実行できる。
     */
    if (authLoading) return

    /**
     * URLパラメータを取得して処理を実行
     *
     * mode    : 操作の種類（verifyEmail / resetPassword）
     * oobCode : Firebaseが発行したワンタイムコード
     */
    const mode = searchParams.get('mode')
    const code = searchParams.get('oobCode')

    // 既にメール確認済みのユーザーが verifyEmail モードでアクセスした場合
    // （ブラウザの戻るジェスチャー等で再アクセスされるケース）
    // エラーを表示せずメモページにリダイレクト
    if (mode === 'verifyEmail' && user?.emailVerified) {
      navigate('/', { replace: true })
      return
    }

    // oobCode がない場合は不正なURLなのでエラー
    if (!code) {
      setStatus('error')
      setErrorMessage('無効なリンクです。')
      return
    }

    // 既に処理を開始している場合は再実行しない
    // Ref を使うことで、React の State 更新タイミングに依存せず
    // 確実に二重実行を防止する（status は非同期処理中にまだ 'loading' のままの場合がある）
    if (status !== 'loading' || actionStartedRef.current) return
    actionStartedRef.current = true

    const handleAction = async () => {
      try {
        if (mode === 'verifyEmail') {
          /**
           * applyActionCode() : oobCode をFirebaseサーバーに送って検証
           *
           * Firebaseサーバー側で以下を確認:
           * - oobCode が存在するか
           * - 有効期限内か（24時間）
           * - 使用済みでないか
           *
           * 確認OKなら Firebase サーバー上の emailVerified が true になる
           */
          await applyActionCode(auth, code)

          /**
           * メール確認成功後の遷移
           *
           * window.location.replace() でフルリロード遷移する。
           * React Router の navigate() ではなくフルリロードを使う理由:
           *
           * navigate() → React の状態更新（emailVerified = true）が
           * 処理される前に ProtectedRoute が描画され、古い状態を参照してしまう。
           * フルリロードなら Firebase Auth が最初から初期化し直すため、
           * 最新の emailVerified = true が確実に反映される。
           */
          if (auth.currentUser) {
            // reload() でサーバーから最新のユーザー情報を取得する。
            //
            // 【なぜ reload() が必要か】
            // applyActionCode() はサーバー上の emailVerified を true にするが、
            // クライアント側の User オブジェクトと IndexedDB の永続化データは
            // 自動では更新されない。
            // reload() を呼ぶことで:
            // 1. auth.currentUser.emailVerified が true に更新される
            // 2. IndexedDB に永続化されたユーザー情報も最新になる
            //
            // 【getIdToken(true) だけでは不十分な理由】
            // getIdToken(true) は ID トークン（JWT）を更新するが、
            // IndexedDB のユーザープロフィール（emailVerified 等）は更新しない。
            // フルリロード後、Firebase は IndexedDB からユーザーを復元するため、
            // reload() で IndexedDB のデータを更新しておく必要がある。
            await auth.currentUser.reload()
            await auth.currentUser.getIdToken(true)
            window.location.replace('/')
          } else {
            // 未ログイン（別ブラウザで開いた等）: 成功ページを表示
            setStatus('success')
          }
          return
        } else if (mode === 'resetPassword') {
          /**
           * verifyPasswordResetCode() : oobCode が有効かどうかを検証
           *
           * リンクが期限切れや使用済みでないか確認する。
           * 有効であれば、パスワード入力フォームを表示する。
           */
          await verifyPasswordResetCode(auth, code)

          // oobCode を保存して、フォーム送信時に使えるようにする
          setOobCode(code)

          // パスワードリセットフォームを表示
          setStatus('resetForm')
        } else {
          // 未対応の mode の場合はエラー
          setStatus('error')
          setErrorMessage('このリンクには対応していません。')
        }
      } catch (error) {
        setStatus('error')

        // Firebase のエラーオブジェクトを型安全に扱う
        const err = error as FirebaseAuthError

        // 集約したエラーハンドラーを使用してメッセージを取得
        const errorMessage = getAuthErrorMessage(err)
        setErrorMessage(errorMessage)
      }
    }

    handleAction()
  }, [searchParams, refreshUser, navigate, user, authLoading, status]) // status を追加して二重実行を防止

  /**
   * パスワードリセットフォームの送信処理
   *
   * @param event - フォーム送信イベント
   */
  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // デフォルトのフォーム送信（ページリロード）を防ぐ
    event.preventDefault()

    // Zodでバリデーション
    const result = resetPasswordSchema.safeParse({
      password: newPassword,
      confirmPassword,
    })

    if (!result.success) {
      // バリデーションエラーがある場合はエラーメッセージを表示
      const formErrors = result.error.flatten().fieldErrors
      setFieldErrors({
        password: formErrors.password?.[0],
        confirmPassword: formErrors.confirmPassword?.[0],
      })
      return
    }

    // バリデーション通過、エラーをクリア
    setFieldErrors({})
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      /**
       * confirmPasswordReset() : 新しいパスワードをFirebaseに送信して確定
       *
       * oobCode（ワンタイムコード）と新しいパスワードを渡して
       * パスワードをリセットする
       */
      await confirmPasswordReset(auth, oobCode, newPassword)

      // パスワードリセット完了
      setStatus('resetDone')
    } catch (error) {
      // Firebase のエラーオブジェクトを型安全に扱う
      const err = error as FirebaseAuthError
      const message = getAuthErrorMessage(err)
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 処理中はローディングスピナーを表示
  if (status === 'loading') {
    return <LoadingSpinner />
  }

  // パスワードリセットフォーム
  if (status === 'resetForm') {
    return (
      <div className="auth-action-container">
        <img src={logo} alt="ちょいMEMO" className="auth-action-logo" />
        <h1 className="auth-action-title">新しいパスワードを設定</h1>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="auth-action-error">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* パスワードリセットフォーム */}
        <form onSubmit={handleResetSubmit} className="auth-action-form">
          {/* 新しいパスワード入力 */}
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="6文字以上"
            autoComplete="new-password"
            classPrefix="auth-action"
            label="新しいパスワード"
            error={fieldErrors.password}
          />

          {/* 確認用パスワード入力 */}
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="もう一度入力"
            autoComplete="new-password"
            classPrefix="auth-action"
            label="新しいパスワード（確認）"
            error={fieldErrors.confirmPassword}
          />

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-action-button"
          >
            {isSubmitting ? '設定中...' : 'パスワードを変更する'}
          </button>
        </form>
      </div>
    )
  }

  // パスワードリセット完了
  if (status === 'resetDone') {
    return (
      <div className="auth-action-container">
        <img src={logo} alt="ちょいMEMO" className="auth-action-logo" />
        <h1 className="auth-action-title">パスワードを変更しました</h1>

        {/* 成功メッセージ */}
        <div className="auth-action-success">
          <p>パスワードの変更が完了しました。</p>
          <p>新しいパスワードでログインしてください。</p>
        </div>

        {/* ログインページへのボタン */}
        <Link to="/login" className="auth-action-button">
          ログインページへ
        </Link>
      </div>
    )
  }

  // 成功時の表示（メール確認完了）
  // ログイン中の場合は自動遷移useEffectによりメモページへ遷移するため、
  // この画面が表示されるのは未ログイン時（別ブラウザで開いた場合など）のみ
  if (status === 'success') {
    return (
      <div className="auth-action-container">
        <img src={logo} alt="ちょいMEMO" className="auth-action-logo" />
        <h1 className="auth-action-title">メールアドレスを確認しました！</h1>

        {/* 成功メッセージ */}
        <div className="auth-action-success">
          <p>メールアドレスの確認が完了しました。</p>
          <p>ログインしてちょいMEMOをお使いください。</p>
        </div>

        {/* ログインページへのボタン */}
        <Link to="/login" className="auth-action-button">
          ログインページへ
        </Link>
      </div>
    )
  }

  // エラー時の表示
  return (
    <div className="auth-action-container">
      <img src={logo} alt="ちょいMEMO" className="auth-action-logo" />
      <h1 className="auth-action-title">エラーが発生しました</h1>

      {/* エラーメッセージ */}
      <div className="auth-action-error">
        <p>{errorMessage}</p>
      </div>

      {/* メール再送信ページへのリンク */}
      <Link to="/verify-email" className="auth-action-button">
        確認メールを再送信する
      </Link>

      <p className="auth-action-footer">
        <Link to="/login">ログインページへ戻る</Link>
      </p>
    </div>
  )
}

export default AuthActionPage
