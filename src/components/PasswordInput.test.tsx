/**
 * PasswordInput.tsx のユニットテスト
 *
 * このファイルでは、パスワード入力コンポーネントのテストを行います。
 * パスワードの表示/非表示切り替え機能とエラー表示を検証します。
 *
 * テスト対象:
 * - コンポーネントのレンダリング
 * - パスワード入力
 * - 表示/非表示切り替えボタン
 * - エラーメッセージ表示
 * - アクセシビリティ
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PasswordInput from './PasswordInput'

describe('PasswordInput', () => {
  /**
   * 基本的なレンダリングテスト
   */
  describe('レンダリング', () => {
    it('正常にレンダリングされること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: パスワード入力欄が存在する
      const input = screen.getByLabelText('パスワード')
      expect(input).toBeInTheDocument()
    })

    it('初期状態ではパスワードが隠されていること（type="password"）', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value="secret123"
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: type属性がpassword
      const input = screen.getByLabelText('パスワード') as HTMLInputElement
      expect(input).toHaveAttribute('type', 'password')
    })

    it('表示/非表示切り替えボタンが表示されること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: 切り替えボタンが存在する
      const toggleButton = screen.getByRole('button', {
        name: 'パスワードを表示',
      })
      expect(toggleButton).toBeInTheDocument()
    })

    it('プレースホルダーが表示されること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          placeholder="パスワードを入力"
          classPrefix="test"
        />
      )

      // 検証: プレースホルダーが設定されている
      const input = screen.getByLabelText('パスワード')
      expect(input).toHaveAttribute('placeholder', 'パスワードを入力')
    })

    it('適切なid属性が設定されること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="my-password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: id属性が設定されている
      const input = screen.getByLabelText('パスワード')
      expect(input).toHaveAttribute('id', 'my-password')
    })

    it('autoComplete属性が設定されること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          autoComplete="new-password"
          classPrefix="test"
        />
      )

      // 検証: autoComplete属性が設定されている
      const input = screen.getByLabelText('パスワード')
      expect(input).toHaveAttribute('autocomplete', 'new-password')
    })

    it('デフォルトのautoCompleteは"current-password"であること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行: autoCompleteを指定しない
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: デフォルト値が設定されている
      const input = screen.getByLabelText('パスワード')
      expect(input).toHaveAttribute('autocomplete', 'current-password')
    })
  })

  /**
   * ユーザー入力のテスト
   */
  describe('ユーザー入力', () => {
    it('パスワードを入力すると、onChangeが呼ばれること', async () => {
      // 準備
      const onChange = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      const input = screen.getByLabelText('パスワード')
      await user.type(input, 'test')

      // 検証: onChangeが入力文字数分呼ばれる（4文字 = 4回）
      expect(onChange).toHaveBeenCalledTimes(4)
      // 各文字が1文字ずつ渡される（controlled componentのため）
      expect(onChange).toHaveBeenNthCalledWith(1, 't')
      expect(onChange).toHaveBeenNthCalledWith(2, 'e')
      expect(onChange).toHaveBeenNthCalledWith(3, 's')
      expect(onChange).toHaveBeenNthCalledWith(4, 't')
    })

    it('valueプロパティが入力欄に反映されること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value="initial-value"
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: value属性が設定されている
      const input = screen.getByLabelText('パスワード') as HTMLInputElement
      expect(input.value).toBe('initial-value')
    })
  })

  /**
   * 表示/非表示切り替えのテスト
   */
  describe('表示/非表示切り替え', () => {
    it('切り替えボタンをクリックすると、パスワードが表示されること', async () => {
      // 準備
      const onChange = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(
        <PasswordInput
          id="password"
          value="secret"
          onChange={onChange}
          classPrefix="test"
        />
      )

      const toggleButton = screen.getByRole('button', {
        name: 'パスワードを表示',
      })
      await user.click(toggleButton)

      // 検証: type属性がtextに変わる
      const input = screen.getByLabelText('パスワード') as HTMLInputElement
      expect(input).toHaveAttribute('type', 'text')
    })

    it('切り替えボタンを2回クリックすると、パスワードが再び隠されること', async () => {
      // 準備
      const onChange = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(
        <PasswordInput
          id="password"
          value="secret"
          onChange={onChange}
          classPrefix="test"
        />
      )

      const input = screen.getByLabelText('パスワード') as HTMLInputElement

      // 1回目のクリック（表示）
      let toggleButton = screen.getByRole('button', {
        name: 'パスワードを表示',
      })
      await user.click(toggleButton)
      expect(input).toHaveAttribute('type', 'text')

      // 2回目のクリック（非表示）
      toggleButton = screen.getByRole('button', { name: 'パスワードを隠す' })
      await user.click(toggleButton)
      expect(input).toHaveAttribute('type', 'password')
    })

    it('パスワード表示中は、ボタンのaria-labelが「パスワードを隠す」になること', async () => {
      // 準備
      const onChange = vi.fn()
      const user = userEvent.setup()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      const toggleButton = screen.getByRole('button', {
        name: 'パスワードを表示',
      })
      await user.click(toggleButton)

      // 検証: aria-labelが変わる
      expect(
        screen.getByRole('button', { name: 'パスワードを隠す' })
      ).toBeInTheDocument()
    })

    it('切り替えボタンはsubmitボタンではないこと（type="button"）', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: type="button"が設定されている（フォーム送信を防ぐ）
      const toggleButton = screen.getByRole('button', {
        name: 'パスワードを表示',
      })
      expect(toggleButton).toHaveAttribute('type', 'button')
    })
  })

  /**
   * エラーメッセージのテスト
   */
  describe('エラーメッセージ', () => {
    it('エラーがない場合、エラーメッセージが表示されないこと', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: エラーメッセージのクラスを持つ要素が存在しない
      const errorElement = document.querySelector('.test-field-error')
      expect(errorElement).not.toBeInTheDocument()
    })

    it('エラーがある場合、エラーメッセージが表示されること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
          error="パスワードが正しくありません"
        />
      )

      // 検証: エラーメッセージが表示される
      const errorElement = screen.getByText('パスワードが正しくありません')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveClass('test-field-error')
    })

    it('エラーメッセージが変更されると、表示も更新されること', () => {
      // 準備
      const onChange = vi.fn()

      // 初回レンダリング
      const { rerender } = render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
          error="エラー1"
        />
      )

      // エラーメッセージを変更
      rerender(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
          error="エラー2"
        />
      )

      // 検証: 新しいエラーメッセージが表示される
      expect(screen.getByText('エラー2')).toBeInTheDocument()
      expect(screen.queryByText('エラー1')).not.toBeInTheDocument()
    })
  })

  /**
   * CSSクラスのテスト
   */
  describe('CSSクラス', () => {
    it('classPrefixに応じた適切なクラス名が設定されること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="login"
        />
      )

      // 検証: login-prefixのクラスが設定されている
      const input = screen.getByLabelText('パスワード')
      expect(input).toHaveClass('login-input')

      const label = screen.getByText('パスワード')
      expect(label).toHaveClass('login-label')
    })
  })

  /**
   * アクセシビリティのテスト
   */
  describe('アクセシビリティ', () => {
    it('labelとinputが正しく関連付けられていること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password-field"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: labelのhtmlFor属性とinputのid属性が一致
      const label = screen.getByText('パスワード')
      const input = screen.getByLabelText('パスワード')

      expect(label).toHaveAttribute('for', 'password-field')
      expect(input).toHaveAttribute('id', 'password-field')
    })

    it('切り替えボタンに適切なaria-labelが設定されていること', () => {
      // 準備
      const onChange = vi.fn()

      // 実行
      render(
        <PasswordInput
          id="password"
          value=""
          onChange={onChange}
          classPrefix="test"
        />
      )

      // 検証: aria-labelで識別できる
      const toggleButton = screen.getByRole('button', {
        name: 'パスワードを表示',
      })
      expect(toggleButton).toHaveAttribute('aria-label', 'パスワードを表示')
    })
  })
})
