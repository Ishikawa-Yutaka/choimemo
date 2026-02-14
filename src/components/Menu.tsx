/**
 * メニューコンポーネント
 *
 * ヘッダーの3点メニューアイコンをタップした時に表示されるメニュー
 * - メモ一覧リンク
 * - ログアウトボタン
 * - ダークモード/ライトモード切り替えボタン
 */

import React from 'react'
import {
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineArrowRightOnRectangle,
  HiOutlineTrash,
} from 'react-icons/hi2'
import './Menu.css'

/**
 * Menuコンポーネントのprops
 */
interface MenuProps {
  /** メニューを閉じる処理 */
  onClose: () => void
  /** ログアウトボタンがクリックされた時の処理 */
  onLogout: () => void
  /** メモ一覧リンクがクリックされた時の処理 */
  onMemoList: () => void
  /** ダークモード切り替えボタンがクリックされた時の処理 */
  onToggleTheme: () => void
  /** アカウント削除ボタンがクリックされた時の処理 */
  onDeleteAccount: () => void
  /** 現在のテーマ（'light' または 'dark'） */
  currentTheme: 'light' | 'dark'
}

/**
 * メニューを表示するコンポーネント
 *
 * @param props - メニューのprops
 * @returns メニュー画面のJSX要素
 */
const Menu: React.FC<MenuProps> = ({
  onClose,
  onLogout,
  onMemoList,
  onToggleTheme,
  onDeleteAccount,
  currentTheme,
}) => {
  return (
    <>
      {/* 背景オーバーレイ（タップするとメニューが閉じる） */}
      <div className="menu-overlay" onClick={onClose} />

      {/* メニュー本体 */}
      <div className="menu-container">
        <div className="menu-header">
          <h2 className="menu-title">メニュー</h2>
          <button className="menu-close-button" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        <div className="menu-items">
          {/* メモ一覧リンク */}
          <button className="menu-item" onClick={onMemoList}>
            <span className="menu-item-icon">
              <HiOutlineDocumentText />
            </span>
            <span className="menu-item-text">メモ一覧</span>
          </button>

          {/* ダークモード切り替え */}
          <button className="menu-item" onClick={onToggleTheme}>
            <span className="menu-item-icon">
              {currentTheme === 'light' ? <HiOutlineMoon /> : <HiOutlineSun />}
            </span>
            <span className="menu-item-text">
              {currentTheme === 'light'
                ? 'ダークモードに切り替え'
                : 'ライトモードに切り替え'}
            </span>
          </button>

          {/* ログアウトボタン */}
          <button className="menu-item" onClick={onLogout}>
            <span className="menu-item-icon">
              <HiOutlineArrowRightOnRectangle />
            </span>
            <span className="menu-item-text">ログアウト</span>
          </button>

          {/* アカウント削除ボタン */}
          <button className="menu-item menu-item-danger" onClick={onDeleteAccount}>
            <span className="menu-item-icon">
              <HiOutlineTrash />
            </span>
            <span className="menu-item-text">アカウント削除</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Menu
