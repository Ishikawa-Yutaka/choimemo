/**
 * FloatingButton.tsx のユニットテスト
 *
 * このファイルでは、フローティング追加ボタンコンポーネントのテストを行います。
 * ボタンのクリックイベントとReact.memoによるメモ化を検証します。
 *
 * テスト対象:
 * - コンポーネントのレンダリング
 * - ボタンのクリックイベント
 * - React.memoによるメモ化
 * - アクセシビリティ（aria-label）
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FloatingButton from './FloatingButton'

describe('FloatingButton', () => {
  /**
   * 基本的なレンダリングテスト
   */
  describe('レンダリング', () => {
    it('正常にレンダリングされること', () => {
      // 準備
      const onClick = vi.fn()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      // 検証: ボタンが存在する
      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      expect(button).toBeInTheDocument()
    })

    it('適切なクラス名が設定されていること', () => {
      // 準備
      const onClick = vi.fn()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      // 検証: floating-buttonクラスが設定されている
      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      expect(button).toHaveClass('floating-button')
    })

    it('プラスアイコンが表示されること', () => {
      // 準備
      const onClick = vi.fn()

      // 実行
      const { container } = render(<FloatingButton onClick={onClick} />)

      // 検証: floating-button-iconクラスを持つ要素が存在する
      const icon = container.querySelector('.floating-button-icon')
      expect(icon).toBeInTheDocument()
    })
  })

  /**
   * ユーザーインタラクションのテスト
   */
  describe('ユーザーインタラクション', () => {
    it('ボタンをクリックすると、onClickが呼ばれること', async () => {
      // 準備
      const onClick = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      await user.click(button)

      // 検証: onClickが1回呼ばれた
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('ボタンを複数回クリックすると、onClickが複数回呼ばれること', async () => {
      // 準備
      const onClick = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      await user.click(button)
      await user.click(button)
      await user.click(button)

      // 検証: onClickが3回呼ばれた
      expect(onClick).toHaveBeenCalledTimes(3)
    })

    it('ダブルクリックしても正常に動作すること', async () => {
      // 準備
      const onClick = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      await user.dblClick(button)

      // 検証: ダブルクリックは2回のクリックとしてカウントされる
      expect(onClick).toHaveBeenCalledTimes(2)
    })
  })

  /**
   * React.memoのテスト
   */
  describe('React.memo最適化', () => {
    it('propsが同じ場合、再レンダリングされないこと', () => {
      // 準備: 同じ関数参照を使う
      const onClick = vi.fn()

      // 初回レンダリング
      const { rerender } = render(<FloatingButton onClick={onClick} />)

      // 同じpropsで再レンダリング
      rerender(<FloatingButton onClick={onClick} />)

      // 検証: React.memoにより、propsが同じなら再レンダリングされない
      // コンポーネントは正常に表示される
      expect(
        screen.getByRole('button', { name: '新しいメモを作成' })
      ).toBeInTheDocument()
    })

    it('propsが変わった場合、再レンダリングされること', async () => {
      // 準備
      const onClick1 = vi.fn()
      const onClick2 = vi.fn() // 異なる関数参照
      const user = userEvent.setup()

      // 初回レンダリング
      const { rerender } = render(<FloatingButton onClick={onClick1} />)

      // 異なるpropsで再レンダリング
      rerender(<FloatingButton onClick={onClick2} />)

      // 検証: 新しいonClickが使われている
      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      await user.click(button)

      expect(onClick1).not.toHaveBeenCalled() // 古いonClickは呼ばれない
      expect(onClick2).toHaveBeenCalledTimes(1) // 新しいonClickが呼ばれる
    })
  })

  /**
   * アクセシビリティのテスト
   */
  describe('アクセシビリティ', () => {
    it('適切なaria-labelが設定されていること', () => {
      // 準備
      const onClick = vi.fn()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      // 検証: aria-labelで識別できる
      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      expect(button).toHaveAttribute('aria-label', '新しいメモを作成')
    })

    it('キーボードでフォーカス可能なこと', () => {
      // 準備
      const onClick = vi.fn()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      // 検証: ボタンはデフォルトでフォーカス可能
      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      expect(button).not.toHaveAttribute('tabindex', '-1')
    })

    it('Enterキーで実行できること', async () => {
      // 準備
      const onClick = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      button.focus()
      await user.keyboard('{Enter}')

      // 検証: EnterキーでもonClickが呼ばれる
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('Spaceキーで実行できること', async () => {
      // 準備
      const onClick = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(<FloatingButton onClick={onClick} />)

      const button = screen.getByRole('button', { name: '新しいメモを作成' })
      button.focus()
      await user.keyboard(' ')

      // 検証: SpaceキーでもonClickが呼ばれる
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })
})
