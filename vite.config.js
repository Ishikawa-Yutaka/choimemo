import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    /**
     * VitePWA: PWA（Progressive Web App）化プラグイン
     * スマホのホーム画面にアプリとしてインストール可能にする
     */
    VitePWA({
      // 新しいService Workerが見つかったら自動更新（ユーザー操作不要）
      registerType: 'autoUpdate',

      /**
       * Web App Manifest: ホーム画面追加時のアプリ情報
       * アプリ名、アイコン、テーマカラーなどを定義
       */
      manifest: {
        name: 'ちょいMEMO',
        short_name: 'ちょいMEMO',
        description: 'サッとメモ、パッと確認。',
        theme_color: '#fefef3',
        background_color: '#fefef3',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      /**
       * Workbox設定: Service Workerのキャッシュ戦略
       *
       * アプリ更新時に古いキャッシュが残らないよう、リソースタイプごとに
       * 適切なキャッシュ戦略を設定する
       */
      workbox: {
        // 新しいSWをすぐにアクティブ化（待機状態をスキップ）
        skipWaiting: true,
        // アクティブ化したSWがすぐに全タブを制御
        clientsClaim: true,
        // 古いバージョンのキャッシュを自動削除
        cleanupOutdatedCaches: true,

        /**
         * runtimeCaching: リソースタイプごとのキャッシュ戦略
         *
         * 戦略の種類:
         * - NetworkFirst: ネットワーク優先（オフライン時のみキャッシュ使用）
         * - StaleWhileRevalidate: キャッシュを即返しつつ裏で最新を取得
         * - CacheFirst: キャッシュ優先（期限付き）
         * - NetworkOnly: 常にネットワーク経由（キャッシュしない）
         */
        runtimeCaching: [
          {
            // HTMLページ: 常に最新を取得、オフライン時のみキャッシュ使用
            urlPattern: /\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 1日
              },
            },
          },
          {
            // JS/CSSファイル: キャッシュを即返しつつ裏で最新を取得
            // ※ビルド時にファイル名にハッシュが付くため、更新時は新URLになる
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
            },
          },
          {
            // 画像ファイル: キャッシュ優先（変更頻度が低いため）
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
            },
          },
          {
            // Adobe Fonts (Typekit): キャッシュを即返しつつ裏で更新
            urlPattern: /^https:\/\/use\.typekit\.net\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'adobe-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
            },
          },
          {
            // Firebase API: リアルタイムデータは常にネットワーク経由
            urlPattern:
              /^https:\/\/firestore\.googleapis\.com\//,
            handler: 'NetworkOnly',
          },
          {
            // Firebase Auth API: 認証も常にネットワーク経由
            urlPattern:
              /^https:\/\/identitytoolkit\.googleapis\.com\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
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
