/**
 * フローティング追加ボタンコンポーネント
 *
 * 画面右下に固定表示される丸い「+」ボタン
 * 新しいメモを作成する時に使用
 *
 * パフォーマンス最適化:
 * - React.memo でメモ化されているため、onClickが変わらない限り再レンダリングされません
 * - メモを入力する度に再レンダリングされるのを防ぎます
 */

import React, { memo } from 'react'
import { HiPlus } from 'react-icons/hi2' // プラスアイコン
import './FloatingButton.css'

interface FloatingButtonProps {
  onClick: () => void // ボタンがクリックされた時の処理
}

/**
 * フローティング追加ボタンコンポーネント（メモ化版）
 *
 * React.memo でラップすることで、onClick が同じ参照を保っている限り
 * 親コンポーネント（MemoPage）が再レンダリングされても、このコンポーネントは
 * 再レンダリングされません。
 */
const FloatingButton: React.FC<FloatingButtonProps> = memo(({ onClick }) => {
  return (
    <button
      className="floating-button"
      onClick={onClick}
      aria-label="新しいメモを作成"
    >
      {/* プラスアイコン（react-iconsを使用） */}
      <HiPlus className="floating-button-icon" />
    </button>
  )
})

// React DevToolsでコンポーネント名を表示するために設定
FloatingButton.displayName = 'FloatingButton'

export default FloatingButton
