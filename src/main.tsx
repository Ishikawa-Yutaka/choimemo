import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

/**
 * アプリのエントリーポイント
 *
 * index.html の <div id="root"> に対して React アプリをマウントします。
 * ルーティングや画面構成は App コンポーネント側で行います。
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
