/**
 * ローディングスピナーコンポーネント
 *
 * データ読み込み中や処理中に表示する回転するスピナーアニメーションです。
 * アプリ全体で統一されたローディング表示を提供します。
 */

import React from 'react'

/**
 * ローディングスピナーコンポーネント
 *
 * フルスクリーンで中央に表示される回転するスピナーアニメーションです。
 * ページ全体のローディング状態を表示するために使用します。
 *
 * @returns ローディングスピナーのJSX要素
 *
 * 使用例:
 * ```tsx
 * {loading && <LoadingSpinner />}
 * ```
 */
const LoadingSpinner: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 回転するスピナー */}
      <div
        style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #f4e6b8', // アプリのテーマカラー（黄色）
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />

      {/* スピナーのアニメーション定義 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default LoadingSpinner
