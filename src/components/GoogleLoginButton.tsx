/**
 * Google ログインボタンコンポーネント
 *
 * Firebase Authentication の Google 認証を使用してログインするボタンです。
 * LoginPage と SignupPage の両方で共通利用できます。
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'

/**
 * GoogleLoginButtonのProps型定義
 */
interface GoogleLoginButtonProps {
  /**
   * エラーが発生したときに呼ばれるコールバック関数
   *
   * @param errorMessage - ユーザーに表示する日本語エラーメッセージ
   * @param errorCode - Firebase のエラーコード（開発用）
   */
  onError?: (errorMessage: string, errorCode: string | null) => void
}

/**
 * Google ログインボタンコンポーネント
 *
 * ボタンをクリックすると Google 認証のポップアップが開きます。
 * ログイン成功時は自動でメモページ（/）に遷移します。
 *
 * @param props - GoogleLoginButtonのprops
 * @returns Google ログインボタンのJSX要素
 *
 * 使用例:
 * ```tsx
 * <GoogleLoginButton
 *   onError={(message, code) => {
 *     setErrorMessage(message)
 *     setErrorCode(code)
 *   }}
 * />
 * ```
 */
const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onError }) => {
  // ログイン処理中かどうか（ボタンの無効化に使用）
  const [isLoading, setIsLoading] = useState(false)

  // ログイン成功時にページ遷移するためのフック
  const navigate = useNavigate()

  /**
   * Google でログインする処理
   *
   * Firebase の signInWithPopup を使って Google アカウントでログインします。
   * ポップアップウィンドウが開き、Google アカウント選択画面が表示されます。
   */
  const handleGoogleLogin = async () => {
    try {
      // ローディング状態にする
      setIsLoading(true)

      // Google 認証プロバイダーを作成
      const provider = new GoogleAuthProvider()

      // ポップアップで Google ログインを実行
      // ユーザーが Google アカウントを選択すると、Firebase に自動登録される
      await signInWithPopup(auth, provider)

      // ログイン成功したらメモページ（/）へ遷移
      navigate('/', { replace: true })
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any

      const errorCode = err.code ?? null
      let errorMessage = 'Google ログインに失敗しました。時間をおいて再度お試しください。'

      // Google ログイン特有のエラーメッセージ
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'ログインがキャンセルされました。'
          break
        case 'auth/popup-blocked':
          errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。'
          break
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'このメールアドレスは既に別の方法で登録されています。'
          break
      }

      // 親コンポーネントにエラーを通知
      if (onError) {
        onError(errorMessage, errorCode)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      style={{
        width: '100%',
        padding: '10px 0',
        fontSize: 15,
        fontWeight: 600,
        borderRadius: 9999,
        border: '1px solid #ddd',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        backgroundColor: isLoading ? '#f5f5f5' : '#fff',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      {/* Google ロゴ（簡易版：色付き "G" 文字） */}
      <span
        style={{
          fontWeight: 700,
          fontSize: 18,
          background: 'linear-gradient(90deg, #4285F4, #EA4335, #FBBC05, #34A853)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        G
      </span>
      <span>{isLoading ? 'ログイン中...' : 'Google でログイン'}</span>
    </button>
  )
}

export default GoogleLoginButton
