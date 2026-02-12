/**
 * 認証状態を管理するカスタムフック
 *
 * Firebase Authenticationの認証状態をReactで使いやすい形で提供します。
 * このフックを使うことで、どのコンポーネントからでも
 * 「今ログインしているか」「ログインユーザーは誰か」を簡単に取得できます。
 */

import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../lib/firebase'

/**
 * 認証状態を返すカスタムフック
 *
 * @returns ユーザー情報と読み込み状態のオブジェクト
 *
 * 使用例:
 * ```tsx
 * function MyComponent() {
 *   const { user, loading } = useAuth()
 *
 *   if (loading) return <div>読み込み中...</div>
 *   if (!user) return <div>ログインしてください</div>
 *
 *   return <div>こんにちは、{user.email}さん</div>
 * }
 * ```
 */
export function useAuth() {
  // 現在ログインしているユーザー情報（未ログインの場合はnull）
  const [user, setUser] = useState<User | null>(null)

  // 認証状態の確認中かどうか
  // 初回レンダリング時は true、確認完了後に false になる
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    /**
     * onAuthStateChanged: Firebase Authenticationの認証状態を監視する関数
     *
     * ログイン・ログアウト・ページリロードなど、認証状態が変わるたびに
     * この関数が自動的に呼ばれます。
     *
     * 返り値: 監視を解除する関数（クリーンアップ用）
     */
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // currentUser が null なら未ログイン、User オブジェクトならログイン済み
      setUser(currentUser)

      // 認証状態の確認が完了したので loading を false にする
      setLoading(false)
    })

    // コンポーネントがアンマウントされたら監視を解除
    // これをしないとメモリリークの原因になる
    return () => unsubscribe()
  }, []) // 空配列 = 初回レンダリング時のみ実行

  return { user, loading }
}
