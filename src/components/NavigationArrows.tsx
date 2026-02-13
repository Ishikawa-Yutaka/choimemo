/**
 * ナビゲーション矢印コンポーネント
 *
 * PC用のメモ切り替え矢印ボタンです。
 * 画面の左右に表示され、クリックで前後のメモに移動できます。
 * タッチデバイス（スマホ・タブレット）では非表示になります。
 */

import React from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
import './NavigationArrows.css'

/**
 * NavigationArrowsコンポーネントのprops
 */
interface NavigationArrowsProps {
  /** 前のメモへ移動する関数 */
  onPrevious: () => void
  /** 次のメモへ移動する関数 */
  onNext: () => void
  /** 前のメモへ移動できるか */
  canGoPrevious: boolean
  /** 次のメモへ移動できるか */
  canGoNext: boolean
}

/**
 * ナビゲーション矢印を表示するコンポーネント
 *
 * @param props - NavigationArrowsのprops
 * @returns 矢印ボタンのJSX要素
 *
 * 使用例:
 * ```tsx
 * <NavigationArrows
 *   onPrevious={goToPrevious}
 *   onNext={goToNext}
 *   canGoPrevious={currentIndex > 0}
 *   canGoNext={currentIndex < memos.length - 1}
 * />
 * ```
 */
const NavigationArrows: React.FC<NavigationArrowsProps> = ({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}) => {
  return (
    <>
      {/* 左矢印（前のメモへ） */}
      <button
        className={`nav-arrow nav-arrow-left ${!canGoPrevious ? 'nav-arrow-disabled' : ''}`}
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="前のメモへ"
      >
        <HiChevronLeft />
      </button>

      {/* 右矢印（次のメモへ） */}
      <button
        className={`nav-arrow nav-arrow-right ${!canGoNext ? 'nav-arrow-disabled' : ''}`}
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="次のメモへ"
      >
        <HiChevronRight />
      </button>
    </>
  )
}

export default NavigationArrows
