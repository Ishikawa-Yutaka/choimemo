/**
 * スワイプナビゲーションのカスタムフック
 *
 * タッチスワイプ（スマホ・タブレット）とマウスドラッグ（PC）の両方に対応した
 * メモ間のナビゲーション機能を提供します。
 */

import { useRef, useEffect, useCallback } from 'react'

/**
 * イベントのターゲットがテキスト入力要素かどうかを判定する関数
 *
 * テキスト選択のためのドラッグ操作がスワイプと誤認されるのを防ぐために使用。
 * textarea や input 内でのドラッグ・タッチはスワイプとして処理しない。
 *
 * @param target - 判定したい要素（event.target や document.activeElement）
 * @returns テキスト入力要素（textarea, input）の場合は true
 */
const isTextInputElement = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return tagName === 'textarea' || tagName === 'input'
}

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

  // タッチスワイプの開始位置（Y座標、縦スクロールとの区別に使用）
  const touchStartYRef = useRef<number>(0)

  // タッチスワイプの開始時刻（素早いスワイプかどうかの判定に使用）
  const touchStartTimeRef = useRef<number>(0)

  // マウスドラッグの開始位置（X座標）
  const mouseStartXRef = useRef<number>(0)

  // マウスドラッグ中かどうか
  const isDraggingRef = useRef<boolean>(false)

  // タッチスワイプの最低距離（px）- 少しのスワイプで反応するように短めに設定
  const TOUCH_MIN_SWIPE_DISTANCE = 30

  // マウスドラッグの最低距離（px）
  const MOUSE_MIN_SWIPE_DISTANCE = 50

  // テキストエリア上でスワイプと判定する最大時間（ミリ秒）
  // これより速いジェスチャーはスワイプ、遅いものはテキスト選択と判定
  const SWIPE_MAX_DURATION = 300

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
   *
   * 開始位置と時刻を記録する。テキストエリア上でも記録する（終了時に判定するため）。
   */
  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled) return

    touchStartXRef.current = event.touches[0].clientX
    touchStartYRef.current = event.touches[0].clientY
    touchStartTimeRef.current = Date.now()
  }

  /**
   * タッチ終了時の処理（スマホ・タブレット）
   *
   * スワイプかテキスト選択かを以下の条件で判定する:
   * - 横方向の移動が縦方向より大きい（横スワイプである）
   * - 横方向の移動がしきい値以上（誤タップ防止）
   * - テキストエリア上の場合: 素早いジェスチャーのみスワイプと判定
   *   （ゆっくりのドラッグはテキスト選択と判定）
   */
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (disabled) return

    const touchEndX = event.changedTouches[0].clientX
    const touchEndY = event.changedTouches[0].clientY
    const diffX = touchEndX - touchStartXRef.current
    const diffY = touchEndY - touchStartYRef.current
    const duration = Date.now() - touchStartTimeRef.current

    const absDiffX = Math.abs(diffX)
    const absDiffY = Math.abs(diffY)

    // 横方向の移動が縦方向より大きいかどうか（縦スクロールとの区別）
    const isHorizontal = absDiffX > absDiffY

    // テキスト入力要素上では、素早いジェスチャーのみスワイプとして扱う
    // ゆっくりのドラッグはテキスト選択と判定して無視
    const isOnTextInput = isTextInputElement(event.target)
    const isFastGesture = duration < SWIPE_MAX_DURATION

    if (isOnTextInput && !isFastGesture) return

    // スワイプ判定: 横方向かつしきい値以上の移動
    if (isHorizontal && absDiffX > TOUCH_MIN_SWIPE_DISTANCE) {
      if (diffX > 0) {
        // 右スワイプ → 前のメモへ
        goToPrevious()
      } else {
        // 左スワイプ → 次のメモへ
        goToNext()
      }
    }
  }

  /**
   * マウスドラッグ開始時の処理（PC）
   *
   * テキスト入力要素（textarea, input）内でのドラッグはスワイプとして扱わない。
   * テキスト選択のドラッグがスワイプと誤認されるのを防ぐため。
   */
  const handleMouseDown = (event: React.MouseEvent) => {
    if (disabled) return

    // テキスト入力要素内でのドラッグはスワイプ無効
    if (isTextInputElement(event.target)) return

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

    if (diffX > MOUSE_MIN_SWIPE_DISTANCE) {
      // 右ドラッグ → 前のメモへ
      goToPrevious()
    } else if (diffX < -MOUSE_MIN_SWIPE_DISTANCE) {
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

      // テキスト入力中は矢印キーでメモ切り替えしない（カーソル移動を優先）
      if (isTextInputElement(document.activeElement)) return

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
