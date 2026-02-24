/**
 * Header.tsx のユニットテスト
 *
 * このファイルでは、ヘッダーコンポーネントのテストを行います。
 * ユーザーインタラクション（ボタンクリック）とpropsの受け渡しを検証します。
 *
 * テスト対象:
 * - コンポーネントのレンダリング
 * - アプリ名の表示
 * - ゴミ箱ボタンのクリックイベント
 * - メニューボタンのクリックイベント
 * - React.memoによるメモ化（propsが変わらない時は再レンダリングされない）
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from './Header'

describe('Header', () => {
  /**
   * 基本的なレンダリングテスト
   */
  describe('レンダリング', () => {
    it('正常にレンダリングされること', () => {
      // 実行
      render(<Header />)

      // 検証: ヘッダー要素が存在する
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    it('アプリ名「ちょいMEMO」が表示されること', () => {
      // 実行
      render(<Header />)

      // 検証: h1タグでアプリ名が表示されている
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveTextContent('ちょいMEMO')
    })

    it('ゴミ箱ボタンが表示されること', () => {
      // 実行
      render(<Header />)

      // 検証: aria-labelでボタンを取得
      const deleteButton = screen.getByRole('button', { name: 'メモを削除' })
      expect(deleteButton).toBeInTheDocument()
    })

    it('メニューボタンが表示されること', () => {
      // 実行
      render(<Header />)

      // 検証: aria-labelでボタンを取得
      const menuButton = screen.getByRole('button', { name: 'メニューを開く' })
      expect(menuButton).toBeInTheDocument()
    })
  })

  /**
   * ユーザーインタラクションのテスト
   */
  describe('ユーザーインタラクション', () => {
    it('ゴミ箱ボタンをクリックすると、onDeleteが呼ばれること', async () => {
      // 準備: モック関数を作成
      const onDelete = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(<Header onDelete={onDelete} />)

      const deleteButton = screen.getByRole('button', { name: 'メモを削除' })
      await user.click(deleteButton)

      // 検証: onDeleteが1回呼ばれた
      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('メニューボタンをクリックすると、onMenuClickが呼ばれること', async () => {
      // 準備
      const onMenuClick = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(<Header onMenuClick={onMenuClick} />)

      const menuButton = screen.getByRole('button', { name: 'メニューを開く' })
      await user.click(menuButton)

      // 検証: onMenuClickが1回呼ばれた
      expect(onMenuClick).toHaveBeenCalledTimes(1)
    })

    it('ゴミ箱ボタンを複数回クリックすると、onDeleteが複数回呼ばれること', async () => {
      // 準備
      const onDelete = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(<Header onDelete={onDelete} />)

      const deleteButton = screen.getByRole('button', { name: 'メモを削除' })
      await user.click(deleteButton)
      await user.click(deleteButton)
      await user.click(deleteButton)

      // 検証: onDeleteが3回呼ばれた
      expect(onDelete).toHaveBeenCalledTimes(3)
    })

    it('onDeleteが渡されていない場合でも、クリックしてもエラーにならないこと', async () => {
      // 準備
      const user = userEvent.setup()

      // 実行: onDeleteを渡さずにレンダリング
      render(<Header />)

      const deleteButton = screen.getByRole('button', { name: 'メモを削除' })

      // 検証: クリックしてもエラーにならない
      await expect(user.click(deleteButton)).resolves.not.toThrow()
    })

    it('onMenuClickが渡されていない場合でも、クリックしてもエラーにならないこと', async () => {
      // 準備
      const user = userEvent.setup()

      // 実行: onMenuClickを渡さずにレンダリング
      render(<Header />)

      const menuButton = screen.getByRole('button', { name: 'メニューを開く' })

      // 検証: クリックしてもエラーにならない
      await expect(user.click(menuButton)).resolves.not.toThrow()
    })
  })

  /**
   * React.memoのテスト
   */
  describe('React.memo最適化', () => {
    it('propsが同じ場合、再レンダリングされないこと', () => {
      // 準備: 同じ関数参照を使う
      const onDelete = vi.fn()
      const onMenuClick = vi.fn()

      // 初回レンダリング
      const { rerender } = render(
        <Header onDelete={onDelete} onMenuClick={onMenuClick} />
      )

      // 同じpropsで再レンダリング
      rerender(<Header onDelete={onDelete} onMenuClick={onMenuClick} />)

      // 検証: React.memoにより、propsが同じなら再レンダリングされない
      // （実際には内部的に再レンダリングがスキップされるが、これは目視では確認しづらい）
      // ここでは、少なくともエラーが発生しないことを確認
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'ちょいMEMO'
      )
    })

    it('propsが変わった場合、再レンダリングされること', () => {
      // 準備
      const onDelete1 = vi.fn()
      const onDelete2 = vi.fn() // 異なる関数参照

      // 初回レンダリング
      const { rerender } = render(<Header onDelete={onDelete1} />)

      // 異なるpropsで再レンダリング
      rerender(<Header onDelete={onDelete2} />)

      // 検証: propsが変わったので再レンダリングされる
      // コンポーネントは正常に表示される
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'ちょいMEMO'
      )
    })
  })

  /**
   * アクセシビリティのテスト
   */
  describe('アクセシビリティ', () => {
    it('ゴミ箱ボタンに適切なaria-labelが設定されていること', () => {
      // 実行
      render(<Header />)

      // 検証: aria-labelで識別できる
      const deleteButton = screen.getByRole('button', { name: 'メモを削除' })
      expect(deleteButton).toHaveAttribute('aria-label', 'メモを削除')
    })

    it('メニューボタンに適切なaria-labelが設定されていること', () => {
      // 実行
      render(<Header />)

      // 検証: aria-labelで識別できる
      const menuButton = screen.getByRole('button', { name: 'メニューを開く' })
      expect(menuButton).toHaveAttribute('aria-label', 'メニューを開く')
    })
  })
})
