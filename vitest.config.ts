/**
 * Vitest設定ファイル
 *
 * Vitestはテストランナー（テストを実行するツール）です。
 * このファイルでテストの実行環境や動作を設定します。
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Reactプラグインを使用（JSX/TSXをテストできるようにする）
  plugins: [react()],

  test: {
    /**
     * environment: テストを実行する環境
     *
     * 'jsdom' = ブラウザ環境をシミュレート
     * - window, document などのブラウザAPIが使える
     * - Reactコンポーネントのテストに必須
     */
    environment: 'jsdom',

    /**
     * globals: グローバル変数を使用するか
     *
     * true = describe, it, expect などを import なしで使える
     * false = 毎回 import { describe, it, expect } from 'vitest' が必要
     *
     * ここでは true にして、書きやすくします
     */
    globals: true,

    /**
     * setupFiles: テスト実行前に読み込むファイル
     *
     * テスト全体で共通の設定（グローバルなモック、カスタムマッチャーなど）を
     * ここで指定したファイルに書きます
     */
    setupFiles: './src/test/setup.ts',

    /**
     * coverage: カバレッジ（テストでカバーされているコードの割合）の設定
     */
    coverage: {
      /**
       * provider: カバレッジを計測するツール
       * 'v8' = 高速で正確（Node.js組み込み）
       */
      provider: 'v8',

      /**
       * reporter: カバレッジレポートの形式
       * - 'text' = コンソールに表示
       * - 'html' = HTMLファイルとして出力（coverage/index.html）
       * - 'json' = JSONファイルとして出力
       */
      reporter: ['text', 'html', 'json'],

      /**
       * exclude: カバレッジ計測から除外するファイル
       *
       * テストファイル自体、設定ファイル、型定義ファイルなどは
       * カバレッジに含めません
       */
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/types/',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
  },
})
