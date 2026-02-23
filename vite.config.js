import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /**
         * manualChunks: ライブラリを手動で分割してキャッシュ効率を向上
         *
         * メリット:
         * 1. ライブラリコードは変更頻度が低いため、別チャンクにすることでキャッシュヒット率が向上
         * 2. 並列ダウンロードにより、初期ロード速度が向上
         * 3. アプリコードの変更時に、ライブラリチャンクは再ダウンロード不要
         *
         * チャンク分割の方針:
         * - react: React本体（React DOM含む）
         * - firebase-auth: Firebase認証関連
         * - firebase-firestore: Firestore関連
         * - router: React Router関連
         * - vendor: その他のライブラリ（react-icons、zodなど）
         */
        manualChunks(id) {
          // node_modules内のモジュールのみ処理
          if (id.includes('node_modules')) {
            // React関連
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react'
            }

            // Firebase Auth関連（認証機能）
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'firebase-auth'
            }

            // Firebase Firestore関連（データベース）
            if (
              id.includes('firebase/firestore') ||
              id.includes('@firebase/firestore')
            ) {
              return 'firebase-firestore'
            }

            // Firebase Core（小さいので認証と一緒にする）
            if (id.includes('firebase/app') || id.includes('@firebase/app')) {
              return 'firebase-auth'
            }

            // React Router関連
            if (id.includes('react-router')) {
              return 'router'
            }

            // その他のライブラリ（react-icons、zodなど）
            return 'vendor'
          }
        },
      },
    },
  },
})
