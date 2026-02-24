/**
 * useMemoOperations.ts のユニットテスト
 *
 * このファイルでは、メモ操作カスタムフック（作成・削除）のテストを行います。
 * カスタムフックのテストには @testing-library/react の renderHook を使用します。
 *
 * テスト対象:
 * - deleteMemoByIndex(): メモ削除処理
 * - createNewMemo(): 新規メモ作成処理
 * - isOperating: 操作中フラグ（多重実行防止）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMemoOperations } from './useMemoOperations'
import * as database from '../lib/database'
import type { Memo } from '../types'

/**
 * database モジュールの関数をモック化
 *
 * vi.mock() を使うと、実際のFirestoreにアクセスせず、
 * テスト用の偽の関数を使ってテストできます。
 */
vi.mock('../lib/database', () => ({
  createMemo: vi.fn(),
  deleteMemo: vi.fn(),
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

describe('useMemoOperations', () => {
  /**
   * 各テストの前に実行される処理
   * モック関数をリセットして、前のテストの影響を受けないようにします
   */
  beforeEach(() => {
    vi.clearAllMocks()
    // console.error と alert をモック化して、テスト出力をクリーンに保つ
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  /**
   * 各テストの後に実行される処理
   * モックをリストアして元に戻す
   */
  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * deleteMemoByIndex() のテストグループ
   */
  describe('deleteMemoByIndex', () => {
    it('メモを正常に削除できること', async () => {
      // 準備: テスト用のメモデータとState更新関数
      const mockMemos = [
        createMockMemo('memo1', 'メモ1'),
        createMockMemo('memo2', 'メモ2'),
        createMockMemo('memo3', 'メモ3'),
      ]

      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      // database.deleteMemo が成功することをモック
      vi.mocked(database.deleteMemo).mockResolvedValue()

      // フックをレンダリング
      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 1,
          setCurrentIndex,
        })
      )

      // 実行: 2番目のメモ（index=1）を削除
      let deleteResult: boolean | undefined
      await act(async () => {
        deleteResult = await result.current.deleteMemoByIndex(1)
      })

      // 検証
      expect(deleteResult).toBe(true) // 削除成功
      expect(database.deleteMemo).toHaveBeenCalledWith('user123', 'memo2')
      expect(setMemos).toHaveBeenCalledWith([
        createMockMemo('memo1', 'メモ1'),
        createMockMemo('memo3', 'メモ3'),
      ])
      expect(setCurrentIndex).toHaveBeenCalledWith(0) // 削除後は最初のメモを表示
    })

    it('最後のメモを削除した場合、新しい空メモが作成されること', async () => {
      // 準備: メモが1つだけある状態
      const mockMemos = [createMockMemo('memo1', 'メモ1')]

      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      // database関数のモック設定
      vi.mocked(database.deleteMemo).mockResolvedValue()
      vi.mocked(database.createMemo).mockResolvedValue('new-memo-id')

      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
          setCurrentIndex,
        })
      )

      // 実行: 唯一のメモを削除
      let deleteResult: boolean | undefined
      await act(async () => {
        deleteResult = await result.current.deleteMemoByIndex(0)
      })

      // 検証
      expect(deleteResult).toBe(true)
      expect(database.deleteMemo).toHaveBeenCalledWith('user123', 'memo1')
      expect(database.createMemo).toHaveBeenCalledWith('user123', {
        content: '',
      })

      // 新しい空メモが作成されたか確認
      expect(setMemos).toHaveBeenCalled()
      const newMemosArg = setMemos.mock.calls[0][0]
      expect(newMemosArg).toHaveLength(1)
      expect(newMemosArg[0]).toMatchObject({
        id: 'new-memo-id',
        content: '',
      })
      expect(setCurrentIndex).toHaveBeenCalledWith(0)
    })

    it('存在しないインデックスを指定した場合、falseを返すこと', async () => {
      const mockMemos = [createMockMemo('memo1', 'メモ1')]
      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
          setCurrentIndex,
        })
      )

      // 実行: 存在しないインデックス999を指定
      let deleteResult: boolean | undefined
      await act(async () => {
        deleteResult = await result.current.deleteMemoByIndex(999)
      })

      // 検証: 削除が実行されず、falseが返される
      expect(deleteResult).toBe(false)
      expect(database.deleteMemo).not.toHaveBeenCalled()
      expect(setMemos).not.toHaveBeenCalled()
    })

    it('削除中にエラーが発生した場合、エラーハンドリングされること', async () => {
      const mockMemos = [createMockMemo('memo1', 'メモ1')]
      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      // database.deleteMemo がエラーを投げるようにモック
      vi.mocked(database.deleteMemo).mockRejectedValue(
        new Error('削除エラー')
      )

      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
          setCurrentIndex,
        })
      )

      // 実行
      let deleteResult: boolean | undefined
      await act(async () => {
        deleteResult = await result.current.deleteMemoByIndex(0)
      })

      // 検証
      expect(deleteResult).toBe(false) // 削除失敗
      expect(console.error).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith(
        'メモの削除に失敗しました。もう一度お試しください。'
      )
      expect(setMemos).not.toHaveBeenCalled() // Stateは更新されない
    })

    it('操作中は多重実行が防止されること', async () => {
      const mockMemos = [
        createMockMemo('memo1', 'メモ1'),
        createMockMemo('memo2', 'メモ2'),
      ]
      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      // deleteMemo を遅延させて、操作中の状態を作る
      let resolveDelete: (() => void) | undefined
      vi.mocked(database.deleteMemo).mockImplementation(() => {
        return new Promise(resolve => {
          resolveDelete = resolve as () => void
        })
      })

      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
          setCurrentIndex,
        })
      )

      // 実行: 1回目の削除を開始（まだ完了しない）
      let firstDeletePromise: Promise<boolean> | undefined
      act(() => {
        firstDeletePromise = result.current.deleteMemoByIndex(0)
      })

      // isOperatingがtrueになっているか確認
      await waitFor(() => {
        expect(result.current.isOperating).toBe(true)
      })

      // 実行: 操作中に2回目の削除を試みる
      let secondDeleteResult: boolean | undefined
      await act(async () => {
        secondDeleteResult = await result.current.deleteMemoByIndex(1)
      })

      // 検証: 2回目の削除は拒否される
      expect(secondDeleteResult).toBe(false)
      expect(database.deleteMemo).toHaveBeenCalledTimes(1) // 1回だけ

      // 1回目の削除を完了させる
      act(() => {
        resolveDelete?.()
      })

      await act(async () => {
        await firstDeletePromise
      })

      // 操作完了後はisOperatingがfalseに戻る
      expect(result.current.isOperating).toBe(false)
    })
  })

  /**
   * createNewMemo() のテストグループ
   */
  describe('createNewMemo', () => {
    it('新規メモを正常に作成できること', async () => {
      // 準備
      const mockMemos = [createMockMemo('memo1', 'メモ1')]
      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      vi.mocked(database.createMemo).mockResolvedValue('new-memo-id')

      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
          setCurrentIndex,
        })
      )

      // 実行
      let createResult: boolean | undefined
      await act(async () => {
        createResult = await result.current.createNewMemo()
      })

      // 検証
      expect(createResult).toBe(true)
      expect(database.createMemo).toHaveBeenCalledWith('user123', {
        content: '',
      })

      // 新しいメモがリストの先頭に追加されたか確認
      expect(setMemos).toHaveBeenCalled()
      const newMemosArg = setMemos.mock.calls[0][0]
      expect(newMemosArg).toHaveLength(2)
      expect(newMemosArg[0]).toMatchObject({
        id: 'new-memo-id',
        content: '',
      })
      expect(newMemosArg[1]).toEqual(createMockMemo('memo1', 'メモ1'))

      // 新しいメモが表示される（index=0）
      expect(setCurrentIndex).toHaveBeenCalledWith(0)
    })

    it('メモが1つもない状態でも新規メモを作成できること', async () => {
      // 準備: 空のメモ配列
      const mockMemos: Memo[] = []
      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      vi.mocked(database.createMemo).mockResolvedValue('first-memo-id')

      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
          setCurrentIndex,
        })
      )

      // 実行
      let createResult: boolean | undefined
      await act(async () => {
        createResult = await result.current.createNewMemo()
      })

      // 検証
      expect(createResult).toBe(true)
      expect(database.createMemo).toHaveBeenCalledWith('user123', {
        content: '',
      })

      const newMemosArg = setMemos.mock.calls[0][0]
      expect(newMemosArg).toHaveLength(1)
      expect(newMemosArg[0]).toMatchObject({
        id: 'first-memo-id',
        content: '',
      })
    })

    it('作成中にエラーが発生した場合、エラーハンドリングされること', async () => {
      const mockMemos = [createMockMemo('memo1', 'メモ1')]
      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      // database.createMemo がエラーを投げるようにモック
      vi.mocked(database.createMemo).mockRejectedValue(
        new Error('作成エラー')
      )

      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
          setCurrentIndex,
        })
      )

      // 実行
      let createResult: boolean | undefined
      await act(async () => {
        createResult = await result.current.createNewMemo()
      })

      // 検証
      expect(createResult).toBe(false) // 作成失敗
      expect(console.error).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith(
        '新規メモの作成に失敗しました。もう一度お試しください。'
      )
      expect(setMemos).not.toHaveBeenCalled() // Stateは更新されない
    })

    it('操作中は多重実行が防止されること', async () => {
      const mockMemos = [createMockMemo('memo1', 'メモ1')]
      const setMemos = vi.fn()
      const setCurrentIndex = vi.fn()

      // createMemo を遅延させて、操作中の状態を作る
      let resolveCreate: (() => void) | undefined
      vi.mocked(database.createMemo).mockImplementation(() => {
        return new Promise(resolve => {
          resolveCreate = () => resolve('new-memo-id')
        })
      })

      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: mockMemos,
          setMemos,
          currentIndex: 0,
          setCurrentIndex,
        })
      )

      // 実行: 1回目の作成を開始（まだ完了しない）
      let firstCreatePromise: Promise<boolean> | undefined
      act(() => {
        firstCreatePromise = result.current.createNewMemo()
      })

      // isOperatingがtrueになっているか確認
      await waitFor(() => {
        expect(result.current.isOperating).toBe(true)
      })

      // 実行: 操作中に2回目の作成を試みる
      let secondCreateResult: boolean | undefined
      await act(async () => {
        secondCreateResult = await result.current.createNewMemo()
      })

      // 検証: 2回目の作成は拒否される
      expect(secondCreateResult).toBe(false)
      expect(database.createMemo).toHaveBeenCalledTimes(1) // 1回だけ

      // 1回目の作成を完了させる
      act(() => {
        resolveCreate?.()
      })

      await act(async () => {
        await firstCreatePromise
      })

      // 操作完了後はisOperatingがfalseに戻る
      expect(result.current.isOperating).toBe(false)
    })
  })

  /**
   * isOperating フラグのテスト
   */
  describe('isOperating', () => {
    it('初期状態ではfalseであること', () => {
      const { result } = renderHook(() =>
        useMemoOperations({
          userId: 'user123',
          memos: [],
          setMemos: vi.fn(),
          currentIndex: 0,
          setCurrentIndex: vi.fn(),
        })
      )

      expect(result.current.isOperating).toBe(false)
    })
  })
})
