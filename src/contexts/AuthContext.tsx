/**
 * 認証状態を管理するContext（コンテキスト）
 *
 * Context APIを使って、アプリ全体で認証状態（ログインユーザー情報）を共有します。
 * これにより、各コンポーネントで個別にFirebaseを監視する必要がなくなり、
 * 1箇所だけで認証状態を管理できます。
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { onAuthStateChanged, reload, User } from 'firebase/auth'
import { auth } from '../lib/firebase'

/**
 * AuthContextが提供する値の型定義
 */
interface AuthContextType {
  /** 現在ログインしているユーザー情報（未ログインの場合はnull） */
  user: User | null
  /** 認証状態の確認中かどうか */
  loading: boolean
  /**
   * ユーザー情報を最新状態に更新する関数
   *
   * reload() だけでは React の State が更新されないため、
   * reload() 後にこの関数を呼ぶことで AuthContext の user を
   * 最新状態に差し替え、再レンダリングをトリガーする。
   *
   * 使用場面: メール確認後に emailVerified を true に反映させるとき
   */
  refreshUser: () => Promise<void>
}

/**
 * AuthContext（認証コンテキスト）を作成
 *
 * createContext()でコンテキストを作成すると、
 * そのコンテキストを使ってアプリ全体でデータを共有できます。
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProviderのProps型定義
 */
interface AuthProviderProps {
  /** このProviderで包むコンポーネント */
  children: React.ReactNode
}

/**
 * AuthProvider - 認証状態を提供するコンポーネント
 *
 * このコンポーネントでアプリ全体を包むことで、
 * どのコンポーネントからでも useAuth() で認証状態にアクセスできます。
 *
 * @param props - AuthProviderのprops
 * @returns 子コンポーネントを包んだJSX要素
 *
 * 使用例:
 * ```tsx
 * // main.tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
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
     * 重要: AuthProviderを使うことで、この監視処理は1箇所だけで実行されます！
     * 各コンポーネントで個別に監視する必要がなくなります。
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

  /**
   * ユーザー情報を最新状態に更新する関数
   *
   * reload() は Firebase サーバーから最新情報を取得するが、
   * それだけでは React の State（user）は更新されない。
   * reload() 後に setUser で新しいオブジェクトをセットすることで
   * React が変化を検知し、ProtectedRoute などが再レンダリングされる。
   *
   * useCallback でメモ化することで、関数の参照を固定する
   *
   * メモ化しないと：
   * refreshUser() → setUser() → AuthProvider 再レンダリング
   * → refreshUser の参照が変わる → useEffect が再実行
   * → applyActionCode を再度呼ぶ → 使用済みoobCode で 400エラー
   *
   * useCallback(fn, []) で参照を固定すれば、この無限ループを防げる
   */
  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      // Firebase サーバーから最新の emailVerified などを取得
      await reload(auth.currentUser)
      // 同じユーザーでも新しいオブジェクト参照として setUser に渡すことで
      // React が「変化した」と認識して再レンダリングされる
      setUser({ ...auth.currentUser })
    }
  }, []) // 依存配列を空にして参照を固定（auth は安定した参照のため）

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth - 認証状態を取得するカスタムフック
 *
 * このフックを使うことで、どのコンポーネントからでも
 * 「今ログインしているか」「ログインユーザーは誰か」を簡単に取得できます。
 *
 * @returns ユーザー情報と読み込み状態のオブジェクト
 * @throws AuthProviderの外で使用された場合はエラー
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
  // useContext()でAuthContextの値を取得
  const context = useContext(AuthContext)

  // AuthProviderの外で useAuth() を使おうとした場合はエラー
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
