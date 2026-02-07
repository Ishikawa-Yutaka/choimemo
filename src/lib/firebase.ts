/**
 * Firebase SDK の初期化ファイル
 *
 * このファイルでは以下を行います：
 * 1. Firebaseアプリの初期化
 * 2. Authentication（認証）サービスの取得
 * 3. Firestore（データベース）サービスの取得
 * 4. Storage（ファイル保存）サービスの取得
 */

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

/**
 * Firebase設定オブジェクト
 * 環境変数から値を読み込みます（import.meta.env は Vite の環境変数アクセス方法）
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * Firebase設定の検証
 * すべての必須項目が設定されているかチェック
 */
const validateFirebaseConfig = () => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ]

  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
  )

  if (missingKeys.length > 0) {
    throw new Error(
      `Firebase設定が不完全です。以下の環境変数を.env.localに設定してください:\n${missingKeys.map((key) => `VITE_FIREBASE_${key.toUpperCase()}`).join('\n')}`
    )
  }
}

// 設定を検証
validateFirebaseConfig()

/**
 * Firebaseアプリを初期化
 * このオブジェクトが全てのFirebaseサービスの基盤となります
 */
const app = initializeApp(firebaseConfig)

/**
 * Authentication（認証）サービス
 * ユーザーのログイン・ログアウト・登録などを管理します
 */
export const auth = getAuth(app)

/**
 * Firestore（データベース）サービス
 * メモデータの保存・読み込みに使用します
 */
export const db = getFirestore(app)

/**
 * Storage（ファイル保存）サービス
 * 将来的に画像添付機能で使用します（Phase 2）
 */
export const storage = getStorage(app)

/**
 * Firebaseアプリインスタンス
 * 通常は使いませんが、必要な場合はエクスポートしています
 */
export default app
