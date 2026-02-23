/**
 * ヘッダーコンポーネント
 *
 * アプリのトップに表示される黄色いヘッダーバー
 * - 左側: アプリ名「ちょいMEMO」
 * - 右側: ゴミ箱アイコン、メニューアイコン（3点リーダー）
 *
 * パフォーマンス最適化:
 * - React.memo でメモ化されているため、propsが変わらない限り再レンダリングされません
 * - メモを入力する度に再レンダリングされるのを防ぎます
 */

import React, { memo } from 'react'
import { HiOutlineTrash } from 'react-icons/hi2' // ゴミ箱アイコン（アウトライン版）
import { HiOutlineDotsVertical } from 'react-icons/hi' // 縦3点メニューアイコン
import './Header.css'

interface HeaderProps {
  onDelete?: () => void // ゴミ箱アイコンがクリックされた時の処理
  onMenuClick?: () => void // メニューアイコンがクリックされた時の処理
}

/**
 * ヘッダーコンポーネント（メモ化版）
 *
 * React.memo でラップすることで、onDelete と onMenuClick が同じ参照を保っている限り
 * 親コンポーネント（MemoPage）が再レンダリングされても、このコンポーネントは
 * 再レンダリングされません。
 */
const Header: React.FC<HeaderProps> = memo(({ onDelete, onMenuClick }) => {
  return (
    <header className="header">
      {/* アプリ名 */}
      <h1 className="header-title">ちょいMEMO</h1>

      {/* 右側のアクションボタン群 */}
      <div className="header-actions">
        {/* ゴミ箱アイコン（react-iconsを使用） */}
        <button
          className="header-button"
          onClick={onDelete}
          aria-label="メモを削除"
        >
          <HiOutlineTrash />
        </button>

        {/* メニューアイコン（3点リーダー、react-iconsを使用） */}
        <button
          className="header-button"
          onClick={onMenuClick}
          aria-label="メニューを開く"
        >
          <HiOutlineDotsVertical />
        </button>
      </div>
    </header>
  )
})

// React DevToolsでコンポーネント名を表示するために設定
Header.displayName = 'Header'

export default Header
