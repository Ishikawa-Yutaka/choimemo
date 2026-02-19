/**
 * メモ一覧コンポーネント
 *
 * 作成したメモの一覧を表示します。
 * - 各メモの最初の行（10文字程度）を表示
 * - 5件以上ある場合は「さらに見る」ボタンで追加表示
 * - メモをタップすると、そのメモを開く
 * - 各メモに削除ボタンを設置
 */

import React, { useState } from 'react'
import { HiOutlineTrash } from 'react-icons/hi2' // ゴミ箱アイコン
import type { Memo } from '../types'
import './MemoList.css'

/**
 * MemoListコンポーネントのprops
 */
interface MemoListProps {
  /** メモの配列 */
  memos: Memo[]
  /** メモ一覧を閉じる処理 */
  onClose: () => void
  /** メモをクリックした時の処理 */
  onMemoClick: (index: number) => void
  /** メモを削除する処理 */
  onMemoDelete: (index: number) => void
}

/**
 * メモの内容から最初の行（10文字程度）を取得する関数
 *
 * @param content - メモの内容
 * @returns 最初の行の10文字（または空の場合は「（空のメモ）」）
 */
const getPreviewText = (content: string): string => {
  if (!content || content.trim() === '') {
    return '（空のメモ）'
  }

  // 改行で分割して最初の行を取得
  const firstLine = content.split('\n')[0]

  // 最初の行が10文字以上の場合は10文字に切り詰める
  if (firstLine.length > 10) {
    return firstLine.substring(0, 10) + '...'
  }

  return firstLine
}

/**
 * 日付をフォーマットする関数
 *
 * @param date - Date オブジェクト
 * @returns フォーマットされた日付文字列（例: "2026/02/13"）
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/**
 * メモ一覧を表示するコンポーネント
 *
 * @param props - MemoListのprops
 * @returns メモ一覧画面のJSX要素
 */
const MemoList: React.FC<MemoListProps> = ({
  memos,
  onClose,
  onMemoClick,
  onMemoDelete,
}) => {
  // 表示するメモの件数を管理（初期値は5件）
  const [visibleCount, setVisibleCount] = useState(5)

  /**
   * 「さらに見る」ボタンがクリックされた時の処理
   *
   * 表示件数を5件ずつ増やします
   */
  const handleShowMore = () => {
    setVisibleCount((prevCount) => prevCount + 5)
  }

  // 表示するメモの配列（visibleCount件まで）
  const visibleMemos = memos.slice(0, visibleCount)

  // まだ表示していないメモがあるかどうか
  const hasMore = visibleCount < memos.length

  /**
   * 削除ボタンがクリックされた時の処理
   *
   * @param event - クリックイベント
   * @param index - 削除するメモのインデックス
   */
  const handleDeleteClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    index: number
  ) => {
    // イベントの伝播を止める（メモ自体のクリックイベントが発火しないようにする）
    event.stopPropagation()

    // 親コンポーネントの削除処理を呼び出す
    onMemoDelete(index)
  }

  return (
    <>
      {/* 背景オーバーレイ（タップするとメモ一覧が閉じる） */}
      <div className="memo-list-overlay" onClick={onClose} />

      {/* メモ一覧本体 */}
      <div className="memo-list-container">
        <div className="memo-list-header">
          <h2 className="memo-list-title">メモ一覧</h2>
          <button className="memo-list-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="memo-list-content">
          {/* メモが1件もない場合 */}
          {memos.length === 0 ? (
            <p className="memo-list-empty">メモがありません</p>
          ) : (
            <>
              {/* メモアイテムのリスト */}
              {visibleMemos.map((memo, index) => (
                <div key={memo.id} className="memo-list-item-wrapper">
                  <button
                    className="memo-list-item"
                    onClick={() => {
                      onMemoClick(index)
                      onClose()
                    }}
                  >
                    <div className="memo-list-item-preview">
                      {getPreviewText(memo.content)}
                    </div>
                    <div className="memo-list-item-date">
                      {formatDate(memo.updated_at)}
                    </div>
                  </button>

                  {/* 削除ボタン */}
                  <button
                    className="memo-list-item-delete"
                    onClick={(e) => handleDeleteClick(e, index)}
                    aria-label="メモを削除"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              ))}

              {/* 「さらに見る」ボタン */}
              {hasMore && (
                <button className="memo-list-show-more" onClick={handleShowMore}>
                  さらに見る（残り{memos.length - visibleCount}件）
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default MemoList
