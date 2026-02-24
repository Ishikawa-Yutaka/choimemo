/**
 * useSwipeNavigation.ts のユニットテスト
 *
 * このファイルでは、スワイプナビゲーションのカスタムフックのテストを行います。
 * タッチスワイプ、マウスドラッグ、キーボード操作の3つの操作方法をテストします。
 *
 * テスト対象:
 * - タッチスワイプ（スマホ・タブレット）
 * - マウスドラッグ（PC）
 * - キーボード矢印キー（PC）
 * - disabled状態
 * - 境界条件（最初・最後のメモ）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipeNavigation } from './useSwipeNavigation'

describe('useSwipeNavigation', () => {
  /**
   * 各テストの前に実行される処理
   */
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * goToPrevious / goToNext のテスト
   */
  describe('goToPrevious / goToNext', () => {
    it('goToPrevious() で前のメモに移動できること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // 実行
      act(() => {
        result.current.goToPrevious()
      })

      // 検証: インデックスが1減る（2 → 1）
      expect(onIndexChange).toHaveBeenCalledWith(1)
    })

    it('goToNext() で次のメモに移動できること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // 実行
      act(() => {
        result.current.goToNext()
      })

      // 検証: インデックスが1増える（2 → 3）
      expect(onIndexChange).toHaveBeenCalledWith(3)
    })

    it('最初のメモでgoToPrevious()しても移動しないこと', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 0,
          totalCount: 5,
          onIndexChange,
        })
      )

      // 実行
      act(() => {
        result.current.goToPrevious()
      })

      // 検証: 移動しない（onIndexChangeが呼ばれない）
      expect(onIndexChange).not.toHaveBeenCalled()
    })

    it('最後のメモでgoToNext()しても移動しないこと', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 4,
          totalCount: 5,
          onIndexChange,
        })
      )

      // 実行
      act(() => {
        result.current.goToNext()
      })

      // 検証: 移動しない（onIndexChangeが呼ばれない）
      expect(onIndexChange).not.toHaveBeenCalled()
    })
  })

  /**
   * canGoPrevious / canGoNext のテスト
   */
  describe('canGoPrevious / canGoNext', () => {
    it('最初のメモでは canGoPrevious が false', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 0,
          totalCount: 5,
          onIndexChange: vi.fn(),
        })
      )

      expect(result.current.canGoPrevious).toBe(false)
      expect(result.current.canGoNext).toBe(true)
    })

    it('最後のメモでは canGoNext が false', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 4,
          totalCount: 5,
          onIndexChange: vi.fn(),
        })
      )

      expect(result.current.canGoPrevious).toBe(true)
      expect(result.current.canGoNext).toBe(false)
    })

    it('中間のメモでは両方 true', () => {
      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange: vi.fn(),
        })
      )

      expect(result.current.canGoPrevious).toBe(true)
      expect(result.current.canGoNext).toBe(true)
    })
  })

  /**
   * タッチスワイプのテスト
   */
  describe('タッチスワイプ', () => {
    it('右スワイプで前のメモに移動すること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // タッチ開始（X座標100, Y座標200で開始）
      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 200 }],
        } as unknown as React.TouchEvent)
      })

      // タッチ終了（X座標200で終了 = 右に100px移動、Y座標は変化なし = 横スワイプ）
      act(() => {
        result.current.onTouchEnd({
          changedTouches: [{ clientX: 200, clientY: 200 }],
          target: document.createElement('div'),
        } as unknown as React.TouchEvent)
      })

      // 検証: 前のメモへ移動（2 → 1）
      expect(onIndexChange).toHaveBeenCalledWith(1)
    })

    it('左スワイプで次のメモに移動すること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // タッチ開始（X座標200, Y座標200で開始）
      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 200, clientY: 200 }],
        } as unknown as React.TouchEvent)
      })

      // タッチ終了（X座標100で終了 = 左に100px移動、Y座標は変化なし = 横スワイプ）
      act(() => {
        result.current.onTouchEnd({
          changedTouches: [{ clientX: 100, clientY: 200 }],
          target: document.createElement('div'),
        } as unknown as React.TouchEvent)
      })

      // 検証: 次のメモへ移動（2 → 3）
      expect(onIndexChange).toHaveBeenCalledWith(3)
    })

    it('スワイプ距離が短い場合は移動しないこと', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // タッチ開始（X座標100, Y座標200で開始）
      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 200 }],
        } as unknown as React.TouchEvent)
      })

      // タッチ終了（X座標120で終了 = 右に20px移動、最低距離30pxに満たない）
      act(() => {
        result.current.onTouchEnd({
          changedTouches: [{ clientX: 120, clientY: 200 }],
          target: document.createElement('div'),
        } as unknown as React.TouchEvent)
      })

      // 検証: 移動しない
      expect(onIndexChange).not.toHaveBeenCalled()
    })
  })

  /**
   * マウスドラッグのテスト
   */
  describe('マウスドラッグ', () => {
    it('右ドラッグで前のメモに移動すること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // マウスダウン（X座標100で開始）
      act(() => {
        result.current.onMouseDown({
          clientX: 100,
        } as React.MouseEvent)
      })

      // マウスアップ（X座標200で終了 = 右に100px移動）
      act(() => {
        result.current.onMouseUp({
          clientX: 200,
        } as React.MouseEvent)
      })

      // 検証: 前のメモへ移動（2 → 1）
      expect(onIndexChange).toHaveBeenCalledWith(1)
    })

    it('左ドラッグで次のメモに移動すること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // マウスダウン（X座標200で開始）
      act(() => {
        result.current.onMouseDown({
          clientX: 200,
        } as React.MouseEvent)
      })

      // マウスアップ（X座標100で終了 = 左に100px移動）
      act(() => {
        result.current.onMouseUp({
          clientX: 100,
        } as React.MouseEvent)
      })

      // 検証: 次のメモへ移動（2 → 3）
      expect(onIndexChange).toHaveBeenCalledWith(3)
    })

    it('マウスダウンしていない状態でマウスアップしても移動しないこと', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // マウスダウンせずに、いきなりマウスアップ
      act(() => {
        result.current.onMouseUp({
          clientX: 200,
        } as React.MouseEvent)
      })

      // 検証: 移動しない
      expect(onIndexChange).not.toHaveBeenCalled()
    })

    it('マウスが領域外に出たら、ドラッグ状態がリセットされること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // マウスダウン
      act(() => {
        result.current.onMouseDown({
          clientX: 100,
        } as React.MouseEvent)
      })

      // マウスが領域外に出る
      act(() => {
        result.current.onMouseLeave()
      })

      // その後マウスアップしても移動しない
      act(() => {
        result.current.onMouseUp({
          clientX: 200,
        } as React.MouseEvent)
      })

      // 検証: 移動しない
      expect(onIndexChange).not.toHaveBeenCalled()
    })
  })

  /**
   * キーボード操作のテスト
   */
  describe('キーボード操作', () => {
    it('左矢印キーで前のメモに移動すること', () => {
      const onIndexChange = vi.fn()

      renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // 左矢印キーを押す
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
        window.dispatchEvent(event)
      })

      // 検証: 前のメモへ移動（2 → 1）
      expect(onIndexChange).toHaveBeenCalledWith(1)
    })

    it('右矢印キーで次のメモに移動すること', () => {
      const onIndexChange = vi.fn()

      renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // 右矢印キーを押す
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
        window.dispatchEvent(event)
      })

      // 検証: 次のメモへ移動（2 → 3）
      expect(onIndexChange).toHaveBeenCalledWith(3)
    })

    it('フックがアンマウントされたら、キーボードイベントリスナーが削除されること', () => {
      const onIndexChange = vi.fn()
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
        })
      )

      // アンマウント
      unmount()

      // 検証: removeEventListenerが呼ばれる
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })
  })

  /**
   * disabled状態のテスト
   */
  describe('disabled状態', () => {
    it('disabled=true の場合、goToPrevious() が何もしないこと', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
          disabled: true,
        })
      )

      act(() => {
        result.current.goToPrevious()
      })

      expect(onIndexChange).not.toHaveBeenCalled()
    })

    it('disabled=true の場合、goToNext() が何もしないこと', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
          disabled: true,
        })
      )

      act(() => {
        result.current.goToNext()
      })

      expect(onIndexChange).not.toHaveBeenCalled()
    })

    it('disabled=true の場合、タッチスワイプが無効になること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
          disabled: true,
        })
      )

      act(() => {
        result.current.onTouchStart({
          touches: [{ clientX: 100, clientY: 200 }],
        } as unknown as React.TouchEvent)
      })

      act(() => {
        result.current.onTouchEnd({
          changedTouches: [{ clientX: 200, clientY: 200 }],
          target: document.createElement('div'),
        } as unknown as React.TouchEvent)
      })

      expect(onIndexChange).not.toHaveBeenCalled()
    })

    it('disabled=true の場合、マウスドラッグが無効になること', () => {
      const onIndexChange = vi.fn()

      const { result } = renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
          disabled: true,
        })
      )

      act(() => {
        result.current.onMouseDown({
          clientX: 100,
        } as React.MouseEvent)
      })

      act(() => {
        result.current.onMouseUp({
          clientX: 200,
        } as React.MouseEvent)
      })

      expect(onIndexChange).not.toHaveBeenCalled()
    })

    it('disabled=true の場合、キーボード操作が無効になること', () => {
      const onIndexChange = vi.fn()

      renderHook(() =>
        useSwipeNavigation({
          currentIndex: 2,
          totalCount: 5,
          onIndexChange,
          disabled: true,
        })
      )

      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
        window.dispatchEvent(event)
      })

      expect(onIndexChange).not.toHaveBeenCalled()
    })
  })
})
