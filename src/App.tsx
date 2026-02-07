/**
 * アプリのメインコンポーネント
 *
 * このコンポーネントがアプリ全体の構造を管理します
 * - ヘッダー（上部）
 * - メモエディター（中央）
 * - フローティングボタン（右下）
 */

import { useState } from 'react'
import Header from './components/Header'
import MemoEditor from './components/MemoEditor'
import FloatingButton from './components/FloatingButton'
import './App.css'

// Firebase SDK を初期化（インポートするだけで初期化される）
import './lib/firebase'

function App() {
  // メモの内容を管理するState
  // useState: Reactでデータを保持するための機能
  const [memoContent, setMemoContent] = useState('')

  /**
   * 現在の日付を "YYYY/MM/DD" 形式で取得する関数
   * @returns フォーマットされた日付文字列（例: "2026/01/25"）
   */
  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0') // 月は0始まりなので+1
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  /**
   * メモの内容が変更された時の処理
   * @param newContent - 新しいメモの内容
   */
  const handleMemoChange = (newContent: string) => {
    setMemoContent(newContent)
    // TODO: ここで自動保存処理を実装する予定（デバウンス処理）
  }

  /**
   * ゴミ箱ボタンがクリックされた時の処理
   */
  const handleDelete = () => {
    // TODO: メモ削除の確認ダイアログを表示
    console.log('削除ボタンがクリックされました')
  }

  /**
   * メニューボタンがクリックされた時の処理
   */
  const handleMenuClick = () => {
    // TODO: メニューを表示（ログアウトなど）
    console.log('メニューボタンがクリックされました')
  }

  /**
   * 新規メモボタンがクリックされた時の処理
   */
  const handleNewMemo = () => {
    // TODO: 新しいメモを作成
    console.log('新規メモボタンがクリックされました')
  }

  return (
    <div className="app">
      {/* ヘッダー */}
      <Header onDelete={handleDelete} onMenuClick={handleMenuClick} />

      {/* メモエディター */}
      <MemoEditor
        content={memoContent}
        date={getCurrentDate()}
        onChange={handleMemoChange}
      />

      {/* フローティング追加ボタン */}
      <FloatingButton onClick={handleNewMemo} />
    </div>
  )
}

export default App
