import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './styles/index.css'

/**
 * アプリのエントリーポイント
 *
 * index.html の <div id="root"> に対して React アプリをマウントします。
 * ルーティングや画面構成は App コンポーネント側で行います。
 *
 * AuthProvider:
 * アプリ全体を AuthProvider で包むことで、どのコンポーネントからでも
 * useAuth() フックで認証状態（ログインユーザー情報）にアクセスできます。
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
