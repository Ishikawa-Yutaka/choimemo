/**
 * テストのセットアップファイル
 *
 * すべてのテストが実行される前に、このファイルが1回だけ実行されます。
 * テスト全体で共通の設定をここに書きます。
 */

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

/**
 * @testing-library/jest-dom のマッチャーを追加
 *
 * これにより、以下のような便利なアサーション（期待値の検証）が使えるようになります：
 * - expect(element).toBeInTheDocument() - 要素が存在するか
 * - expect(element).toHaveTextContent('テキスト') - テキストを持っているか
 * - expect(element).toBeVisible() - 見えているか
 * - expect(element).toBeDisabled() - 無効化されているか
 * など
 */
expect.extend(matchers)

/**
 * 各テスト実行後のクリーンアップ
 *
 * afterEach = 各テスト（it/test）が終わるたびに実行される
 * cleanup() = レンダリングしたコンポーネントを全てアンマウント（削除）する
 *
 * これをしないと、前のテストのDOMが残ったまま次のテストが実行されて
 * おかしな結果になることがあります。
 */
afterEach(() => {
  cleanup()
})
