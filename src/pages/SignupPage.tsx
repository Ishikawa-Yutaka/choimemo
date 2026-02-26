/**
 * サインアップページコンポーネント
 *
 * メールアドレスとパスワードで新規アカウントを作成する画面です。
 * Firebase Authentication の `createUserWithEmailAndPassword` を使用して、
 * 登録に成功したらそのままログイン状態としてメモページ（/）に遷移します。
 */

import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { z } from 'zod'
import GoogleLoginButton from '../components/GoogleLoginButton'
import PasswordInput from '../components/PasswordInput'
import {
  getAuthErrorMessage,
  type FirebaseAuthError,
} from '../lib/errorHandlers'
import logo from '../assets/logo.png'
import './SignupPage.css'

/**
 * サインアップフォームの入力値を検証するためのZodスキーマ
 *
 * - email: 空ではない + メールアドレス形式
 * - password: 6文字以上 + 英字を含む + 数字を含む
 */
const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
  password: z
    .string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .regex(/[a-zA-Z]/, 'パスワードには英字を含めてください')
    .regex(/[0-9]/, 'パスワードには数字を含めてください'),
})

/**
 * サインアップページを表示するコンポーネント
 *
 * @returns サインアップ画面のJSX要素
 */
const SignupPage: React.FC = () => {
  // フォーム入力値（メールアドレス・パスワード）を管理するState
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // サインアップ処理中かどうか
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 各フィールドごとのバリデーションエラー（Zod用）
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  // 日本語で表示するエラーメッセージ
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Firebaseから返ってきたエラーコード（開発用）
  const [errorCode, setErrorCode] = useState<string | null>(null)

  // 登録成功後にページ遷移するためのフック
  const navigate = useNavigate()

  /**
   * サインアップフォーム送信時の処理
   *
   * @param event - フォーム送信イベント
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      // まずはZodで入力値の検証を行う
      const result = signupSchema.safeParse({ email, password })

      if (!result.success) {
        /**
         * flatten() でフィールドごとのエラー配列を取得し、
         * 先頭のメッセージだけを画面に表示します。
         */
        const formErrors = result.error.flatten().fieldErrors
        setFieldErrors({
          email: formErrors.email?.[0],
          password: formErrors.password?.[0],
        })

        // クライアント側のバリデーションエラーなので、Firebaseには問い合わせない
        return
      }

      // バリデーションを通過したので、過去のフィールドエラーをクリア
      setFieldErrors({})

      setIsSubmitting(true)
      setErrorMessage(null)
      setErrorCode(null)

      // Firebase Authentication を使って新規ユーザーを作成
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      // 作成したユーザーに確認メールを送信
      // ユーザーがメールのリンクをクリックすることで、メールアドレスが確認済みになる
      await sendEmailVerification(userCredential.user)

      // メール確認待ち画面へ遷移（メモページへはまだ行けない）
      navigate('/verify-email', { replace: true })
    } catch (error) {
      // Firebase のエラーオブジェクトを型安全に扱う
      const err = error as FirebaseAuthError
      setErrorCode(err.code ?? null)

      // 集約したエラーハンドラーを使用してメッセージを取得
      const message = getAuthErrorMessage(err)
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="signup-container">
      {/* アプリロゴ */}
      <img src={logo} alt="ちょいMEMO" className="signup-logo" />
      <h1 className="signup-title">アカウント作成</h1>

      {/* エラーメッセージ（日本語） */}
      {errorMessage && (
        <div className="signup-error">
          {errorMessage}
          {errorCode && (
            <div className="signup-error-code">
              エラーコード: <code>{errorCode}</code>
            </div>
          )}
        </div>
      )}

      {/* サインアップフォーム */}
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="signup-field">
          <label htmlFor="email" className="signup-label">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="example@email.com"
            className="signup-input"
          />
          {/* メールアドレス入力欄の直下に、Zodのバリデーションエラーを表示 */}
          {fieldErrors.email && (
            <div className="signup-field-error">{fieldErrors.email}</div>
          )}
        </div>

        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="英数字を含む6文字以上"
          classPrefix="signup"
          error={fieldErrors.password}
        />

        <button type="submit" disabled={isSubmitting} className="signup-button">
          {isSubmitting ? '作成中...' : 'アカウントを作成'}
        </button>
      </form>

      {/* または区切り線 */}
      <div className="signup-divider">
        <div className="signup-divider-line" />
        <span className="signup-divider-text">または</span>
        <div className="signup-divider-line" />
      </div>

      {/* Google ログインボタン */}
      <GoogleLoginButton
        onError={(message, code) => {
          setErrorMessage(message)
          setErrorCode(code)
        }}
      />

      {/* ログインページへのリンク */}
      <p className="signup-login-link">
        すでにアカウントをお持ちの方は{' '}
        <Link to="/login">ログインはこちら</Link>
      </p>
    </div>
  )
}

export default SignupPage
