/**
 * ログイン必須のルート（ページ）を保護するコンポーネント
 *
 * このコンポーネントで囲まれたページは、ログインしていないユーザーには表示されません。
 * 未ログインユーザーは自動的に /login ページにリダイレクトされます。
 *
 * これがReactにおける「ミドルウェア」のような役割を果たします。
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * ProtectedRoute コンポーネントのProps
 *
 * @property children - 保護したいページコンポーネント
 */
interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ログイン状態をチェックして、ページへのアクセスを制御するコンポーネント
 *
 * @param children - 保護したいページコンポーネント
 * @returns ログイン状態に応じて、ページまたはリダイレクトを返す
 *
 * 使用例:
 * ```tsx
 * <Route
 *   path="/"
 *   element={
 *     <ProtectedRoute>
 *       <MemoPage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // useAuth フックで現在の認証状態を取得
  const { user, loading } = useAuth()

  // useLocation でアクセスしようとしているページのURLを取得
  // ログイン後、元のページに戻すために使用
  const location = useLocation()

  /**
   * 認証状態の確認中（loading = true）の場合
   *
   * Firebase が認証情報を確認している最中なので、
   * 「読み込み中」画面を表示して待ちます。
   * これをしないと、一瞬だけログインページが表示されてしまいます。
   */
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        読み込み中...
      </div>
    )
  }

  /**
   * 未ログイン（user = null）の場合
   *
   * ログインページにリダイレクトします。
   * state に現在のURLを保存しておくことで、
   * ログイン後に元のページに戻すことができます。
   */
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  /**
   * ログイン済みの場合
   *
   * children（保護されたページコンポーネント）をそのまま表示します。
   */
  return <>{children}</>
}

export default ProtectedRoute
