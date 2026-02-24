/**
 * useMemoEditing.ts のユニットテスト
 *
 * このファイルでは、メモ編集と自動保存のカスタムフックのテストを行います。
 * デバウンス処理や、ローカルState更新とFirestore保存の動作を検証します。
 *
 * テスト対象:
 * - handleMemoChange(): メモ内容変更ハンドラー
 * - デバウンス機能（500ms遅延保存）
 * - ローカルStateの即座更新
 * - Firestoreへの遅延保存
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMemoEditing } from './useMemoEditing'
import * as database from '../lib/database'
import type { Memo } from '../types'

/**
 * database モジュールの updateMemo をモック化
 */
vi.mock('../lib/database', () => ({
  updateMemo: vi.fn(),
}))

/**
 * テスト用のモックメモデータ
 */
const createMockMemo = (id: string, content: string): Memo => ({
  id,
  content,
  created_at: new Date('2026-02-23T10:00:00'),
  updated_at: new Date('2026-02-23T10:00:00'),
})

describe('useMemoEditing', () => {
  /**
   * 各テストの前に実行される処理
   */
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // タイマーを偽物（フェイク）に置き換え、テスト内で時間を制御可能にする
    vi.useFakeTimers()
  })

  /**
   * 各テストの後に実行される処理
   */
  afterEach(() => {
    vi.restoreAllMocks()
    // タイマーを本物に戻す
    vi.useRealTimers()
  })

  /**
   * handleMemoChange() の基本動作テスト
   */
  describe('handleMemoChange', () => {
    it('メモ内容を変更すると、ローカルStateが即座に更新されること', () => {
      // 準備
      const mockMemos = [
        createMockMemo('memo1', '元のメモ'),
        createMockMemo('memo2', 'メモ2'),
      ]
      const setMemos = vi.fn()

      const { result } = renderHook(() =>
        useMemoEditing({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
        })
      )

      // 実行: メモ内容を変更
      act(() => {
        result.current.handleMemoChange('新しい内容')
      })

      // 検証: setMemos が即座に呼ばれる（ローカルStateの更新）
      expect(setMemos).toHaveBeenCalledTimes(1)

      // setMemos に渡された関数を実行して、新しいメモ配列を取得
      const updateFunction = setMemos.mock.calls[0][0]
      const newMemos = updateFunction(mockMemos)

      // 0番目のメモが更新されているか確認
      expect(newMemos[0].content).toBe('新しい内容')
      expect(newMemos[1].content).toBe('メモ2') // 他のメモは変わらない
    })

    it('メモ内容を変更して500ms経過後、Firestoreに自動保存されること', async () => {
      // 準備
      const mockMemos = [createMockMemo('memo1', '元のメモ')]
      const setMemos = vi.fn()

      vi.mocked(database.updateMemo).mockResolvedValue()

      const { result } = renderHook(() =>
        useMemoEditing({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
        })
      )

      // 実行: メモ内容を変更
      act(() => {
        result.current.handleMemoChange('新しい内容')
      })

      // この時点ではまだ保存されていない
      expect(database.updateMemo).not.toHaveBeenCalled()

      // 500ms経過させる
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      // 検証: 500ms後にFirestoreに保存される
      expect(database.updateMemo).toHaveBeenCalledWith('user123', 'memo1', {
        content: '新しい内容',
      })
      expect(database.updateMemo).toHaveBeenCalledTimes(1)
      expect(console.log).toHaveBeenCalledWith('メモを自動保存しました')
    })

    it('デバウンス機能: 連続入力時は最後の入力だけが保存されること', async () => {
      // 準備
      const mockMemos = [createMockMemo('memo1', '')]
      const setMemos = vi.fn()

      vi.mocked(database.updateMemo).mockResolvedValue()

      const { result } = renderHook(() =>
        useMemoEditing({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
        })
      )

      // 実行: 連続して3回入力（「こ」→「こん」→「こんにちは」）
      act(() => {
        result.current.handleMemoChange('こ')
      })

      // 100ms経過（まだ500ms未満なので保存されない）
      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      act(() => {
        result.current.handleMemoChange('こん')
      })

      // さらに100ms経過（合計200ms）
      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      act(() => {
        result.current.handleMemoChange('こんにちは')
      })

      // この時点ではまだ保存されていない
      expect(database.updateMemo).not.toHaveBeenCalled()

      // 最後の入力から500ms経過
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      // 検証: 最後の入力「こんにちは」だけが保存される
      expect(database.updateMemo).toHaveBeenCalledTimes(1)
      expect(database.updateMemo).toHaveBeenCalledWith('user123', 'memo1', {
        content: 'こんにちは',
      })

      // 「こ」や「こん」は保存されない（デバウンスによりキャンセル）
      expect(database.updateMemo).not.toHaveBeenCalledWith(
        'user123',
        'memo1',
        { content: 'こ' }
      )
      expect(database.updateMemo).not.toHaveBeenCalledWith(
        'user123',
        'memo1',
        { content: 'こん' }
      )
    })

    it('userIdがundefinedの場合、何も実行されないこと', () => {
      const mockMemos = [createMockMemo('memo1', 'メモ')]
      const setMemos = vi.fn()

      const { result } = renderHook(() =>
        useMemoEditing({
          userId: undefined,
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
        })
      )

      // 実行
      act(() => {
        result.current.handleMemoChange('新しい内容')
      })

      // 検証: 何も実行されない
      expect(setMemos).not.toHaveBeenCalled()
    })

    it('存在しないインデックスの場合、何も実行されないこと', () => {
      const mockMemos = [createMockMemo('memo1', 'メモ')]
      const setMemos = vi.fn()

      const { result } = renderHook(() =>
        useMemoEditing({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 999, // 存在しないインデックス
        })
      )

      // 実行
      act(() => {
        result.current.handleMemoChange('新しい内容')
      })

      // 検証: 何も実行されない
      expect(setMemos).not.toHaveBeenCalled()
    })

    it('Firestore保存でエラーが発生しても、ローカルStateは更新されること', async () => {
      // 準備
      const mockMemos = [createMockMemo('memo1', '元のメモ')]
      const setMemos = vi.fn()

      // updateMemo がエラーを投げるようにモック
      vi.mocked(database.updateMemo).mockRejectedValue(
        new Error('保存エラー')
      )

      const { result } = renderHook(() =>
        useMemoEditing({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
        })
      )

      // 実行
      act(() => {
        result.current.handleMemoChange('新しい内容')
      })

      // ローカルStateは即座に更新される
      expect(setMemos).toHaveBeenCalledTimes(1)

      // 500ms経過
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      // Firestore保存が試行される（失敗する）
      expect(database.updateMemo).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()

      // エラーが発生してもローカルStateは更新されている
      const updateFunction = setMemos.mock.calls[0][0]
      const newMemos = updateFunction(mockMemos)
      expect(newMemos[0].content).toBe('新しい内容')
    })

    it('updated_at が更新されること', () => {
      const mockMemos = [createMockMemo('memo1', 'メモ')]
      const setMemos = vi.fn()
      const beforeUpdate = new Date()

      const { result } = renderHook(() =>
        useMemoEditing({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
        })
      )

      // 実行
      act(() => {
        result.current.handleMemoChange('新しい内容')
      })

      // updated_at が新しい日時に更新されているか確認
      const updateFunction = setMemos.mock.calls[0][0]
      const newMemos = updateFunction(mockMemos)

      expect(newMemos[0].updated_at).toBeInstanceOf(Date)
      expect(newMemos[0].updated_at.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime()
      )
    })
  })

  /**
   * クリーンアップのテスト
   */
  describe('クリーンアップ', () => {
    it('コンポーネントがアンマウントされた時、タイマーがクリアされること', async () => {
      const mockMemos = [createMockMemo('memo1', 'メモ')]
      const setMemos = vi.fn()

      vi.mocked(database.updateMemo).mockResolvedValue()

      const { result, unmount } = renderHook(() =>
        useMemoEditing({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
        })
      )

      // メモを変更
      act(() => {
        result.current.handleMemoChange('新しい内容')
      })

      // 500ms経過する前にアンマウント
      act(() => {
        vi.advanceTimersByTime(200)
      })
      unmount()

      // 残りの時間を経過させる
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      // アンマウント後なので、保存は実行されない
      expect(database.updateMemo).not.toHaveBeenCalled()
    })
  })
})
