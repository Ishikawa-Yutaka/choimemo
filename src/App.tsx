/**
 * アプリのメインコンポーネント
 *
 * このコンポーネントがアプリ全体のルーティング（画面遷移）を管理します。
 * - /signup : アカウント作成ページ
 * - /login  : ログインページ
 * - /       : メモ編集ページ（メイン画面）
 *
 * パフォーマンス最適化:
 * - React.lazy でページコンポーネントを遅延ロード
 * - 初期バンドルサイズを削減し、必要なページのみ動的に読み込む
 */

import React, { lazy, Suspense, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Firebase SDK を初期化（インポートするだけで初期化される）
import './lib/firebase'

/**
 * ページコンポーネントを遅延ロード（コード分割）
 *
 * React.lazy を使用することで、各ページは初回アクセス時に動的に読み込まれます。
 * これにより初期バンドルサイズが大幅に削減され、ページの読み込み速度が向上します。
 *
 * 例: ログインページにアクセスするまで、メモページのコードはダウンロードされません
 */
const SignupPage = lazy(() => import('./pages/SignupPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'))
const AuthActionPage = lazy(() => import('./pages/AuthActionPage'))
const MemoPage = lazy(() => import('./pages/MemoPage'))

/**
 * ページ遷移時にビューポート（スクロール位置）をリセットするコンポーネント
 *
 * MemoPageは position: fixed で画面全体を固定しているため、
 * MemoPageからログインページ等に遷移した際に、ビューポートの位置が
 * ずれたまま残り、上部のロゴやタイトルが隠れる問題を防ぐ。
 *
 * useLocation を使って現在のURLを監視し、
 * URLが変わるたびにスクロール位置を (0, 0) にリセットする。
 */
const ScrollReset: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return null
}

/**
 * アプリ全体のルーティングを定義するコンポーネント
 *
 * @returns ルーティング設定済みのアプリ全体のJSX要素
 *
 * Suspense の役割:
 * - React.lazy でロードされるコンポーネントを囲む必要があります
 * - コンポーネントの読み込み中は fallback に指定したコンポーネントを表示します
 * - 読み込みが完了すると、実際のページコンポーネントに切り替わります
 *
 * 使用例:
 * ```tsx
 * // main.tsx からは <App /> をそのままレンダリングするだけでOK
 * ReactDOM.createRoot(root).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>,
 * )
 * ```
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* ページ遷移時にスクロール位置をリセット */}
      <ScrollReset />
      {/* Suspense で全ルートを囲む（遅延ロードされるページの読み込み中の表示を管理） */}
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* アカウント作成ページ */}
          <Route path="/signup" element={<SignupPage />} />

          {/* ログインページ */}
          <Route path="/login" element={<LoginPage />} />

          {/* パスワードリセットページ */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* メール確認待ちページ */}
          <Route path="/verify-email" element={<EmailVerificationPage />} />

          {/* Firebaseメールリンクの処理ページ（確認メール・パスワードリセットのリンク先） */}
          <Route path="/__/auth/action" element={<AuthActionPage />} />

          {/* メインのメモ編集ページ（ログイン必須） */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MemoPage />
              </ProtectedRoute>
            }
          />

          {/* 定義されていないURLにアクセスされた場合はトップページにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
