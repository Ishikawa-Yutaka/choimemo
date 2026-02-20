/**
 * ログインページコンポーネント
 *
 * メールアドレスとパスワードでログインする画面です。
 * Firebase Authentication の `signInWithEmailAndPassword` を使用して、
 * 認証に成功したらメインのメモページ（/）に遷移します。
 */

import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { z } from 'zod'
import GoogleLoginButton from '../components/GoogleLoginButton'
import './LoginPage.css'

/**
 * ログインフォームの入力値を検証するためのZodスキーマ
 *
 * - email: 空ではない + メールアドレス形式
 * - password: 空ではない
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

/**
 * ログインページを表示するコンポーネント
 *
 * @returns ログイン画面のJSX要素
 */
const LoginPage: React.FC = () => {
  // フォーム入力値（メールアドレス・パスワード）を管理するState
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // ログイン処理中かどうか（多重送信防止・ボタン無効化に使用）
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 各フィールドごとのバリデーションエラー（Zod用）
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  // 画面に表示するエラーメッセージ（日本語）
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Firebase から返ってきたエラーコード（開発用に小さく表示）
  const [errorCode, setErrorCode] = useState<string | null>(null)

  // ログイン成功時にページ遷移するためのフック
  const navigate = useNavigate()

  /**
   * ログインフォーム送信時の処理
   *
   * @param event - フォーム送信イベント
   *
   * 使用例:
   * ```tsx
   * <form onSubmit={handleSubmit}>...</form>
   * ```
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault() // 画面のリロード（デフォルトのフォーム送信）を防ぐ

    try {
      // まずはZodで入力値の検証を行う
      const result = loginSchema.safeParse({ email, password })

      if (!result.success) {
        /**
         * result.error.flatten() を使うと、
         * フォーム全体のエラーとフィールドごとのエラーを
         * わかりやすい形に変換してくれます。
         */
        const formErrors = result.error.flatten().fieldErrors

        // Zodのエラー情報から、各フィールドごとのメッセージをStateにセット
        setFieldErrors({
          email: formErrors.email?.[0],
          password: formErrors.password?.[0],
        })

        // フォームバリデーションエラーなので、Firebaseには問い合わせずここで終了
        return
      }

      // バリデーションを通過したので、過去のフィールドエラーはクリア
      setFieldErrors({})

      // 送信中に再度押されないようにフラグを立てる
      setIsSubmitting(true)
      setErrorMessage(null)
      setErrorCode(null)

      // Firebase Authentication を使ってメールアドレスとパスワードでログイン
      await signInWithEmailAndPassword(auth, email, password)

      // ログインに成功したらメモページ（/）へ遷移
      navigate('/', { replace: true })
    } catch (error) {
      // エラーオブジェクトを any として受け取り、コードとメッセージを安全に参照
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any

      // Firebaseのエラーコードを画面下部に小さく表示するために保持
      setErrorCode(err.code ?? null)

      // エラーコードごとに日本語メッセージを出し分け
      // よく使うものだけ個別対応し、それ以外は共通メッセージにする
      switch (err.code) {
        case 'auth/invalid-email':
          setErrorMessage('メールアドレスの形式が正しくありません。')
          break
        case 'auth/user-disabled':
          setErrorMessage('このアカウントは無効化されています。')
          break
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setErrorMessage(
            'メールアドレスまたはパスワードが正しくありません。'
          )
          break
        default:
          setErrorMessage('ログインに失敗しました。時間をおいて再度お試しください。')
          break
      }
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="login-container">
      <h1 className="login-title">ログイン</h1>

      {/* エラーメッセージ（日本語） */}
      {errorMessage && (
        <div className="login-error">
          {errorMessage}
          {errorCode && (
            <div className="login-error-code">
              エラーコード: <code>{errorCode}</code>
            </div>
          )}
        </div>
      )}

      {/* ログインフォーム */}
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="email" className="login-label">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="login-input"
          />
          {/* メールアドレス入力欄の直下に、Zodのバリデーションエラーを表示 */}
          {fieldErrors.email && (
            <div className="login-field-error">
              {fieldErrors.email}
            </div>
          )}
        </div>

        <div className="login-field">
          <label htmlFor="password" className="login-label">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="login-input"
          />
          {/* パスワード入力欄の直下に、Zodのバリデーションエラーを表示 */}
          {fieldErrors.password && (
            <div className="login-field-error">
              {fieldErrors.password}
            </div>
          )}
        </div>

        {/* パスワードリセットリンク（パスワードを忘れた場合） */}
        <div className="login-forgot-password">
          <Link to="/forgot-password">
            パスワードをお忘れですか？
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="login-button"
        >
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      {/* または区切り線 */}
      <div className="login-divider">
        <div className="login-divider-line" />
        <span className="login-divider-text">または</span>
        <div className="login-divider-line" />
      </div>

      {/* Google ログインボタン */}
      <GoogleLoginButton
        onError={(message, code) => {
          setErrorMessage(message)
          setErrorCode(code)
        }}
      />

      {/* サインアップへのリンク */}
      <p className="login-signup-link">
        アカウントをお持ちでない方は{' '}
        <Link to="/signup">こちらから新規登録</Link>
      </p>
    </div>
  )
}

export default LoginPage

