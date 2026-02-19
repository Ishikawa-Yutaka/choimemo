/**
 * アプリのメインコンポーネント
 *
 * このコンポーネントがアプリ全体のルーティング（画面遷移）を管理します。
 * - /signup : アカウント作成ページ
 * - /login  : ログインページ
 * - /       : メモ編集ページ（メイン画面）
 */

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import MemoPage from './pages/MemoPage'
import ProtectedRoute from './components/ProtectedRoute'

// Firebase SDK を初期化（インポートするだけで初期化される）
import './lib/firebase'

/**
 * アプリ全体のルーティングを定義するコンポーネント
 *
 * @returns ルーティング設定済みのアプリ全体のJSX要素
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
      <Routes>
        {/* アカウント作成ページ */}
        <Route path="/signup" element={<SignupPage />} />

        {/* ログインページ */}
        <Route path="/login" element={<LoginPage />} />

        {/* パスワードリセットページ */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* メール確認待ちページ */}
        <Route path="/verify-email" element={<EmailVerificationPage />} />

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
    </BrowserRouter>
  )
}

export default App
