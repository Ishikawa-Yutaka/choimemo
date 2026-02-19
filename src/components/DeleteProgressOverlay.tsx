/**
 * アカウント削除中のプログレスオーバーレイコンポーネント
 *
 * アカウント削除処理中に画面全体を覆うオーバーレイを表示します。
 * - 削除の進捗をプログレスバーで表示
 * - 現在の処理状況をメッセージで表示
 * - ブラウザを閉じないよう警告メッセージを表示
 *
 * 使用例:
 * <DeleteProgressOverlay progress={50} message="メモを削除中..." />
 */

import React from 'react'
import './DeleteProgressOverlay.css'

/**
 * DeleteProgressOverlayコンポーネントのprops
 */
interface DeleteProgressOverlayProps {
  /** 削除の進捗（0〜100のパーセント値） */
  progress: number
  /** 現在の処理状況を示すメッセージ */
  message: string
}

/**
 * アカウント削除中のプログレスオーバーレイを表示するコンポーネント
 *
 * @param props.progress - 削除の進捗（0〜100）
 * @param props.message - 現在の処理状況メッセージ
 * @returns プログレスオーバーレイのJSX要素
 */
const DeleteProgressOverlay: React.FC<DeleteProgressOverlayProps> = ({
  progress,
  message,
}) => {
  return (
    // 画面全体を覆うオーバーレイ（ユーザーの操作をブロック）
    <div className="delete-progress-overlay">

      {/* 中央のカード */}
      <div className="delete-progress-card">

        {/* タイトル */}
        <h2 className="delete-progress-title">アカウントを削除しています</h2>

        {/* 現在の処理状況メッセージ */}
        <p className="delete-progress-message">{message}</p>

        {/* プログレスバー外枠 */}
        <div className="delete-progress-bar-track">
          {/* プログレスバー（progressの値に応じて幅が変わる） */}
          <div
            className="delete-progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* パーセント表示 */}
        <p className="delete-progress-percent">{progress}%</p>

        {/* 警告メッセージ（ブラウザを閉じないよう促す） */}
        <p className="delete-progress-warning">
          ブラウザを閉じないでください
        </p>
      </div>
    </div>
  )
}

export default DeleteProgressOverlay
