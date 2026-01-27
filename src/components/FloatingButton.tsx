/**
 * フローティング追加ボタンコンポーネント
 *
 * 画面右下に固定表示される丸い「+」ボタン
 * 新しいメモを作成する時に使用
 */

import React from 'react'
import { HiPlus } from 'react-icons/hi2' // プラスアイコン
import './FloatingButton.css'

interface FloatingButtonProps {
  onClick: () => void // ボタンがクリックされた時の処理
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick }) => {
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
}

export default FloatingButton
