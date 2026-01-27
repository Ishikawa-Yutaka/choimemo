/**
 * メモ編集コンポーネント
 *
 * メモの入力エリアを表示するコンポーネント
 * - 右上に日付表示
 * - プレースホルダー「ここにメモを書く」
 * - 画面全体を使った大きなテキストエリア
 */

import React from 'react'
import './MemoEditor.css'

interface MemoEditorProps {
  content: string // メモの内容
  date: string // 表示する日付（例: "2026/01/25"）
  placeholder?: string // プレースホルダーテキスト
  onChange: (content: string) => void // メモが変更された時の処理
}

const MemoEditor: React.FC<MemoEditorProps> = ({
  content,
  date,
  placeholder = 'ここにメモを書く',
  onChange,
}) => {
  /**
   * テキストエリアの内容が変更された時の処理
   * @param e - イベントオブジェクト
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 親コンポーネントに新しい内容を通知
    onChange(e.target.value)
  }

  return (
    <div className="memo-editor">
      {/* 日付表示（右上） */}
      <div className="memo-date">{date}</div>

      {/* メモ入力エリア */}
      <textarea
        className="memo-textarea"
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="メモ入力エリア"
      />
    </div>
  )
}

export default MemoEditor
