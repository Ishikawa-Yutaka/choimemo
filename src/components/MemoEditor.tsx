/**
 * メモ編集コンポーネント
 *
 * メモの入力エリアを表示するコンポーネント
 * - 右上に日付表示
 * - プレースホルダー「ここにメモを書く」
 * - 画面全体を使った大きなテキストエリア
 *
 * カーソル飛び対策:
 * - textarea を「非制御コンポーネント」として実装（value ではなく defaultValue を使用）
 * - React が textarea の値を直接管理しないため、再レンダリング時にカーソル位置が飛ばない
 * - メモの切り替えは、親コンポーネントで key={memoId} を指定して
 *   コンポーネントを再マウントすることで対応
 */

import React, { memo } from 'react'
import './MemoEditor.css'

interface MemoEditorProps {
  content: string // メモの初期内容（defaultValueとして使用）
  date: string // 表示する日付（例: "2026/01/25"）
  placeholder?: string // プレースホルダーテキスト
  onChange: (content: string) => void // メモが変更された時の処理
}

/**
 * メモ編集コンポーネント（非制御 textarea 版）
 *
 * textarea に value ではなく defaultValue を使うことで、
 * React が textarea の値を管理しない「非制御コンポーネント」にしている。
 * これにより、親が再レンダリングされてもカーソル位置に影響しない。
 *
 * メモを切り替える場合は、親で key={currentMemo.id} を指定して
 * コンポーネントを再マウントする（defaultValue が新しいメモの内容で初期化される）。
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

        {/* メモ入力エリア（非制御コンポーネント） */}
        {/* defaultValue: マウント時に一度だけ初期値を設定する */}
        {/* value と違い、再レンダリング時にReactが値を上書きしないのでカーソルが飛ばない */}
        <textarea
          className="memo-textarea"
          defaultValue={content}
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
