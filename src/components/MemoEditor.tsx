/**
 * メモ編集コンポーネント
 *
 * メモの入力エリアを表示するコンポーネント
 * - 右上に日付表示
 * - プレースホルダー「ここにメモを書く」
 * - 画面全体を使った大きなテキストエリア
 *
 * パフォーマンス最適化:
 * - React.memo でメモ化されているため、content、date、onChangeが変わらない限り再レンダリングされません
 * - ただし、このコンポーネントはユーザー入力で頻繁に更新されるため、
 *   実際にはほぼ毎回再レンダリングされます（これは正常な動作です）
 */

import React, { memo } from 'react'
import './MemoEditor.css'

interface MemoEditorProps {
  content: string // メモの内容
  date: string // 表示する日付（例: "2026/01/25"）
  placeholder?: string // プレースホルダーテキスト
  onChange: (content: string) => void // メモが変更された時の処理
}

/**
 * メモ編集コンポーネント（メモ化版）
 *
 * React.memo でラップすることで、content、date、onChange が同じ値を保っている限り
 * 親コンポーネント（MemoPage）が再レンダリングされても、このコンポーネントは
 * 再レンダリングされません。
 *
 * 注: メモを入力すると content が変わるため、このコンポーネントは再レンダリングされます。
 * これは正常な動作です。最適化の主な目的は、onChange や date が変わらない限り、
 * 不要な再レンダリングを防ぐことです。
 */
const MemoEditor: React.FC<MemoEditorProps> = memo(
  ({ content, date, placeholder = 'ここにメモを書く', onChange }) => {
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
)

// React DevToolsでコンポーネント名を表示するために設定
MemoEditor.displayName = 'MemoEditor'

export default MemoEditor
