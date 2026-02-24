/**
 * LoadingSpinner.tsx のユニットテスト
 *
 * このファイルでは、ローディングスピナーコンポーネントのテストを行います。
 * シンプルな表示専用コンポーネントなので、レンダリングと表示内容を検証します。
 *
 * テスト対象:
 * - コンポーネントが正しくレンダリングされること
 * - スピナー要素が存在すること
 * - アニメーションスタイルが適用されていること
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('正常にレンダリングされること', () => {
    // 実行
    const { container } = render(<LoadingSpinner />)

    // 検証: コンポーネントが存在する
    expect(container.firstChild).toBeInTheDocument()
  })

  it('フルスクリーンで中央揃えのコンテナが表示されること', () => {
    // 実行
    const { container } = render(<LoadingSpinner />)

    // コンテナ要素を取得（最初のdiv）
    const containerDiv = container.firstChild as HTMLElement

    // 検証: スタイルが正しく適用されている
    expect(containerDiv).toHaveStyle({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#ffffff',
    })
  })

  it('スピナー要素が存在すること', () => {
    // 実行
    const { container } = render(<LoadingSpinner />)

    // コンテナの中のスピナー要素を取得（2番目のdiv）
    const containerDiv = container.firstChild as HTMLElement
    const spinnerDiv = containerDiv.firstChild as HTMLElement

    // 検証: スピナーが存在する
    expect(spinnerDiv).toBeInTheDocument()
  })

  it('スピナーに正しいスタイルが適用されていること', () => {
    // 実行
    const { container } = render(<LoadingSpinner />)

    // スピナー要素を取得
    const containerDiv = container.firstChild as HTMLElement
    const spinnerDiv = containerDiv.firstChild as HTMLElement

    // 検証: スピナーのスタイル（インラインスタイルのみ検証）
    // border系はショートハンドプロパティなので、個別にテストするのが難しい
    // 主要なスタイルのみ検証する
    expect(spinnerDiv).toHaveStyle({
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite',
    })
  })

  it('アニメーション定義が存在すること', () => {
    // 実行
    const { container } = render(<LoadingSpinner />)

    // style タグを探す
    const styleTag = container.querySelector('style')

    // 検証: style タグが存在し、@keyframes spin が定義されている
    expect(styleTag).toBeInTheDocument()
    expect(styleTag?.textContent).toContain('@keyframes spin')
    expect(styleTag?.textContent).toContain('transform: rotate(0deg)')
    expect(styleTag?.textContent).toContain('transform: rotate(360deg)')
  })

  it('スナップショット: コンポーネントの構造が変わっていないこと', () => {
    // 実行
    const { container } = render(<LoadingSpinner />)

    // 検証: スナップショットマッチング
    // 初回実行時にスナップショットが作成され、以降の実行で比較される
    expect(container).toMatchSnapshot()
  })
})
