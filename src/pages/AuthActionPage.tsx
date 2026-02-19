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
import { applyActionCode, reload } from 'firebase/auth'
import { auth } from '../lib/firebase'

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
           * reload() : ローカルの currentUser を最新状態に更新
           *
           * applyActionCode() だけでは、ブラウザが持っている
           * auth.currentUser の emailVerified はまだ false のまま。
           * reload() を呼ぶことで Firebase サーバーから最新情報を取得し、
           * emailVerified が true に更新される。
           * これにより「ちょいMEMOを始める」→ / へ遷移できる。
           */
          if (auth.currentUser) {
            await reload(auth.currentUser)
          }

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
  }, [searchParams]) // searchParams が変わった時だけ実行

  // 処理中の表示
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 18, color: '#666' }}>
        処理中...
      </div>
    )
  }

  // 成功時の表示
  if (status === 'success') {
    return (
      <div style={{ padding: '24px', maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '16px' }}>アカウントが作成されました！</h1>

        {/* 成功メッセージ */}
        <div
          style={{
            padding: '16px',
            borderRadius: 8,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            marginBottom: '24px',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: 14, color: '#166534', fontWeight: 600 }}>
            メールアドレスの確認が完了しました
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#15803d' }}>
            ちょいMEMOをお使いいただけます。
          </p>
        </div>

        {/* メモページへのボタン（メール確認済みなのでそのまま遷移できる） */}
        <Link
          to="/"
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 0',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#facc15',
            color: '#222',
            textAlign: 'center',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          ちょいMEMOを始める
        </Link>
      </div>
    )
  }

  // エラー時の表示
  return (
    <div style={{ padding: '24px', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '16px' }}>エラーが発生しました</h1>

      {/* エラーメッセージ */}
      <div
        style={{
          padding: '12px',
          borderRadius: 8,
          backgroundColor: '#ffe5e5',
          color: '#b00020',
          fontSize: 14,
          marginBottom: '24px',
        }}
      >
        {errorMessage}
      </div>

      {/* メール再送信ページへのリンク */}
      <Link
        to="/verify-email"
        style={{
          display: 'block',
          width: '100%',
          padding: '10px 0',
          fontSize: 15,
          fontWeight: 600,
          borderRadius: 9999,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: '#facc15',
          color: '#222',
          textAlign: 'center',
          textDecoration: 'none',
          boxSizing: 'border-box',
          marginBottom: '12px',
        }}
      >
        確認メールを再送信する
      </Link>

      <p style={{ fontSize: 13, textAlign: 'center' }}>
        <Link to="/login">ログインページへ戻る</Link>
      </p>
    </div>
  )
}

export default AuthActionPage
