/**
 * Firebase メール操作の処理ページ
 *
 * Firebase のメール（確認メール・パスワードリセットメール）のリンクをクリックすると
 * このページに遷移します。
 *
 * URLの形式:
 * https://choimemo.vercel.app/__/auth/action?mode=verifyEmail&oobCode=xxx
 *
 * URLパラメータ:
 * - mode      : 操作の種類（verifyEmail / resetPassword など）
 * - oobCode   : Firebaseが発行したワンタイムコード（1回限り有効）
 *
 * 対応する操作:
 * - verifyEmail  : メールアドレスの確認（アカウント作成完了）
 */

import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { applyActionCode } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import './AuthActionPage.css'

/**
 * 処理の状態を表す型
 *
 * - loading  : 処理中
 * - success  : 処理成功
 * - error    : 処理失敗
 */
type Status = 'loading' | 'success' | 'error'

/**
 * Firebase メール操作を処理するコンポーネント
 *
 * @returns 処理結果を表示するJSX要素
 */
const AuthActionPage: React.FC = () => {
  // URLのクエリパラメータを取得するフック
  // 例: ?mode=verifyEmail&oobCode=xxx から mode と oobCode を取得
  const [searchParams] = useSearchParams()

  // AuthContext の refreshUser を取得
  // reload() 後に React の State を更新するために使用
  const { refreshUser } = useAuth()

  // 処理の状態を管理（loading → success または error）
  const [status, setStatus] = useState<Status>('loading')

  // エラーメッセージを管理
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    /**
     * URLパラメータを取得して処理を実行
     *
     * mode    : 操作の種類（verifyEmail など）
     * oobCode : Firebaseが発行したワンタイムコード
     */
    const mode = searchParams.get('mode')
    const oobCode = searchParams.get('oobCode')

    // oobCode がない場合は不正なURLなのでエラー
    if (!oobCode) {
      setStatus('error')
      setErrorMessage('無効なリンクです。')
      return
    }

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
          await applyActionCode(auth, oobCode)

          /**
           * refreshUser() : Firebase から最新情報を取得し React の State も更新
           *
           * applyActionCode() だけでは emailVerified はまだ false のまま。
           * refreshUser() は reload() + setUser() を行うことで、
           * ProtectedRoute が emailVerified: true を認識できるようになる。
           */
          await refreshUser()

          setStatus('success')
        } else {
          // 未対応の mode の場合はエラー
          setStatus('error')
          setErrorMessage('このリンクには対応していません。')
        }
      } catch (error: any) {
        setStatus('error')

        // エラーコードごとに日本語メッセージを出し分け
        switch (error.code) {
          case 'auth/expired-action-code':
            setErrorMessage('リンクの有効期限が切れています。再度メールを送信してください。')
            break
          case 'auth/invalid-action-code':
            setErrorMessage('リンクがすでに使用済みか、無効です。再度メールを送信してください。')
            break
          default:
            setErrorMessage('処理に失敗しました。もう一度お試しください。')
            break
        }
      }
    }

    handleAction()
  }, [searchParams, refreshUser]) // searchParams または refreshUser が変わった時に実行

  // 処理中の表示
  if (status === 'loading') {
    return (
      <div className="auth-action-loading">
        処理中...
      </div>
    )
  }

  // 成功時の表示
  if (status === 'success') {
    return (
      <div className="auth-action-container">
        <h1 className="auth-action-title">アカウントが作成されました！</h1>

        {/* 成功メッセージ */}
        <div className="auth-action-success">
          <p>
            メールアドレスの確認が完了しました
          </p>
          <p>
            ちょいMEMOをお使いいただけます。
          </p>
        </div>

        {/* メモページへのボタン（メール確認済みなのでそのまま遷移できる） */}
        <Link
          to="/"
          className="auth-action-button"
        >
          ちょいMEMOを始める
        </Link>
      </div>
    )
  }

  // エラー時の表示
  return (
    <div className="auth-action-container">
      <h1 className="auth-action-title">エラーが発生しました</h1>

      {/* エラーメッセージ */}
      <div className="auth-action-error">
        <p>
          {errorMessage}
        </p>
      </div>

      {/* メール再送信ページへのリンク */}
      <Link
        to="/verify-email"
        className="auth-action-button"
      >
        確認メールを再送信する
      </Link>

      <p className="auth-action-footer">
        <Link to="/login">ログインページへ戻る</Link>
      </p>
    </div>
  )
}

export default AuthActionPage
