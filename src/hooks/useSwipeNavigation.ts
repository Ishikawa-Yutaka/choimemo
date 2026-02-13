/**
 * スワイプナビゲーションのカスタムフック
 *
 * タッチスワイプ（スマホ・タブレット）とマウスドラッグ（PC）の両方に対応した
 * メモ間のナビゲーション機能を提供します。
 */

import { useRef, useEffect, useCallback } from 'react'

/**
 * useSwipeNavigationフックの引数
 */
interface UseSwipeNavigationProps {
  /** 現在表示中のメモのインデックス */
  currentIndex: number
  /** メモの総数 */
  totalCount: number
  /** インデックスを変更する関数 */
  onIndexChange: (newIndex: number) => void
  /** ナビゲーションを無効化するかどうか（メニューやダイアログが開いている時など） */
  disabled?: boolean
}

/**
 * スワイプナビゲーションのカスタムフック
 *
 * @param props - フックの引数
 * @returns イベントハンドラーのオブジェクト
 *
 * 使用例:
 * ```tsx
 * const swipeHandlers = useSwipeNavigation({
 *   currentIndex,
 *   totalCount: memos.length,
 *   onIndexChange: setCurrentIndex,
 *   disabled: isMenuOpen || isMemoListOpen,
 * })
 *
 * <div {...swipeHandlers}>
 *   コンテンツ
 * </div>
 * ```
 */
export function useSwipeNavigation({
  currentIndex,
  totalCount,
  onIndexChange,
  disabled = false,
}: UseSwipeNavigationProps) {
  // タッチスワイプの開始位置（X座標）
  const touchStartXRef = useRef<number>(0)

  // マウスドラッグの開始位置（X座標）
  const mouseStartXRef = useRef<number>(0)

  // マウスドラッグ中かどうか
  const isDraggingRef = useRef<boolean>(false)

  // 最低限のスワイプ距離（px）
  const MIN_SWIPE_DISTANCE = 50

  /**
   * 前のメモへ移動
   */
  const goToPrevious = useCallback(() => {
    if (disabled) return
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }, [currentIndex, disabled, onIndexChange])

  /**
   * 次のメモへ移動
   */
  const goToNext = useCallback(() => {
    if (disabled) return
    if (currentIndex < totalCount - 1) {
      onIndexChange(currentIndex + 1)
    }
  }, [currentIndex, totalCount, disabled, onIndexChange])

  /**
   * タッチ開始時の処理（スマホ・タブレット）
   */
  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled) return
    touchStartXRef.current = event.touches[0].clientX
  }

  /**
   * タッチ終了時の処理（スマホ・タブレット）
   */
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (disabled) return

    const touchEndX = event.changedTouches[0].clientX
    const diffX = touchEndX - touchStartXRef.current

    if (diffX > MIN_SWIPE_DISTANCE) {
      // 右スワイプ → 前のメモへ
      goToPrevious()
    } else if (diffX < -MIN_SWIPE_DISTANCE) {
      // 左スワイプ → 次のメモへ
      goToNext()
    }
  }

  /**
   * マウスドラッグ開始時の処理（PC）
   */
  const handleMouseDown = (event: React.MouseEvent) => {
    if (disabled) return
    isDraggingRef.current = true
    mouseStartXRef.current = event.clientX
  }

  /**
   * マウスドラッグ終了時の処理（PC）
   */
  const handleMouseUp = (event: React.MouseEvent) => {
    if (disabled || !isDraggingRef.current) return

    const mouseEndX = event.clientX
    const diffX = mouseEndX - mouseStartXRef.current

    if (diffX > MIN_SWIPE_DISTANCE) {
      // 右ドラッグ → 前のメモへ
      goToPrevious()
    } else if (diffX < -MIN_SWIPE_DISTANCE) {
      // 左ドラッグ → 次のメモへ
      goToNext()
    }

    isDraggingRef.current = false
  }

  /**
   * マウスが領域外に出た時の処理（PC）
   */
  const handleMouseLeave = () => {
    isDraggingRef.current = false
  }

  /**
   * キーボードの矢印キーでメモを切り替える（PC）
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return

      if (e.key === 'ArrowLeft') {
        // 左矢印キー → 前のメモへ
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        // 右矢印キー → 次のメモへ
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [goToPrevious, goToNext, disabled])

  return {
    // タッチイベントハンドラー（スマホ・タブレット）
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,

    // マウスイベントハンドラー（PC）
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,

    // 直接呼び出す関数（矢印ボタン用）
    goToPrevious,
    goToNext,

    // 状態
    canGoPrevious: currentIndex > 0,
    canGoNext: currentIndex < totalCount - 1,
  }
}
