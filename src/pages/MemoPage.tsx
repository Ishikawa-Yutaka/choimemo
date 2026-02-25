/**
 * メモページコンポーネント
 *
 * メモの作成・読込・更新・削除（CRUD）を実装した画面です。
 * - メモ一覧をFirestoreから読み込み
 * - 現在表示中のメモを管理
 * - メモの作成・更新・削除機能
 * - 将来的にスワイプナビゲーションと自動保存を追加予定
 *
 * パフォーマンス最適化:
 * - useCallback で関数をメモ化し、子コンポーネントの不要な再レンダリングを防止
 * - useMemo で値をメモ化し、不要な再計算を防止
 * - 子コンポーネント（Header、FloatingButton など）は React.memo でメモ化済み
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import Header from '../components/Header'
import MemoEditor from '../components/MemoEditor'
import FloatingButton from '../components/FloatingButton'
import Menu from '../components/Menu'
import MemoList from '../components/MemoList'
import DeleteProgressOverlay from '../components/DeleteProgressOverlay'
import NavigationArrows from '../components/NavigationArrows'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { useMemoOperations } from '../hooks/useMemoOperations'
import { useSwipeNavigation } from '../hooks/useSwipeNavigation'
import { useMemoData } from '../hooks/useMemoData'
import { useMemoEditing } from '../hooks/useMemoEditing'
import { useDeleteAccount } from '../hooks/useDeleteAccount'
import { getCurrentDate } from '../lib/formatters'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
import '../App.css'

/**
 * メモ編集ページを表示するコンポーネント
 *
 * @returns メモ編集画面のJSX要素
 */
const MemoPage: React.FC = () => {
  // 現在ログインしているユーザー情報を取得
  const { user } = useAuth()

  // ログイン画面への遷移に使用
  const navigate = useNavigate()

  // 現在表示中のメモのインデックス（memos配列の何番目か）
  const [currentIndex, setCurrentIndex] = useState(0)

  // スワイプ方向インジケーター（'left' | 'right' | null）
  // スワイプ時に表示される矢印の方向を管理
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  )

  // メニューの表示/非表示を管理
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // メモ一覧の表示/非表示を管理
  const [isMemoListOpen, setIsMemoListOpen] = useState(false)

  /**
   * ブラウザの「戻る」ナビゲーションを防止
   *
   * iOS Safariの画面端スワイプなど、ブラウザの戻るジェスチャーが
   * 発動した場合に、ページ遷移させずに現在のページに留まる。
   * popstateイベントを検知して、履歴を再度pushすることで戻るを無効化。
   */
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  /**
   * メモデータの取得と初期化を管理するカスタムフック
   */
  const { memos, setMemos, loading } = useMemoData({ userId: user?.uid })

  /**
   * メモ編集と自動保存を管理するカスタムフック
   */
  const { handleMemoChange } = useMemoEditing({
    userId: user?.uid,
    memos,
    setMemos,
    currentIndex,
  })

  /**
   * アカウント削除処理を管理するカスタムフック
   */
  const { deleteProgress, deleteStatusMessage, handleDeleteAccount } =
    useDeleteAccount(user)

  /**
   * メモ操作のカスタムフック
   * メモの削除・作成処理をまとめたフック
   */
  const { deleteMemoByIndex, createNewMemo } = useMemoOperations({
    userId: user?.uid || '',
    memos,
    setMemos,
    currentIndex,
    setCurrentIndex,
  })

  /**
   * インデックスが変更された時のハンドラー（矢印アニメーション付き・メモ化版）
   *
   * useCallback でラップすることで、currentIndex が変わらない限り
   * 同じ関数参照を返します。これにより、この関数を使う useSwipeNavigation フックの
   * 不要な再計算を防ぎます。
   */
  const handleIndexChange = useCallback(
    (newIndex: number) => {
      // スワイプ方向を設定（表示位置の管理）
      // 左スワイプ（次のメモへ）→ 右側に表示
      // 右スワイプ（前のメモへ）→ 左側に表示
      if (newIndex > currentIndex) {
        setSwipeDirection('right') // 次のメモへ（右側に表示）
      } else if (newIndex < currentIndex) {
        setSwipeDirection('left') // 前のメモへ（左側に表示）
      }

      // インデックスを更新
      setCurrentIndex(newIndex)

      // アニメーション後にスワイプ方向をリセット
      setTimeout(() => {
        setSwipeDirection(null)
      }, 600) // CSSのアニメーション時間（0.6s）と合わせる
    },
    [currentIndex]
  )

  /**
   * スワイプナビゲーションのカスタムフック
   * タッチスワイプ、マウスドラッグ、キーボード操作をまとめたフック
   */
  const swipeHandlers = useSwipeNavigation({
    currentIndex,
    totalCount: memos.length,
    onIndexChange: handleIndexChange,
    disabled: isMenuOpen || isMemoListOpen,
  })

  // 現在表示中のメモを取得
  const currentMemo = memos[currentIndex]

  /**
   * メニューボタンがクリックされた時の処理（メモ化版）
   *
   * useCallback でラップすることで、依存配列が空なので常に同じ関数参照を返します。
   * これにより、Header コンポーネントの不要な再レンダリングを防ぎます。
   */
  const handleMenuClick = useCallback(() => {
    // メニューを開く
    setIsMenuOpen(true)
  }, [])

  /**
   * メニューを閉じる処理（メモ化版）
   */
  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  /**
   * ログアウト処理（メモ化版）
   */
  const handleLogout = useCallback(async () => {
    // ログアウトの確認ダイアログを表示
    const confirmed = window.confirm('ログアウトしますか？')
    if (!confirmed) return

    try {
      // Firebase Authentication からログアウト
      await signOut(auth)

      // ログアウト後はログイン画面にリダイレクト
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('ログアウトに失敗しました:', error)
      alert('ログアウトに失敗しました。もう一度お試しください。')
    }
  }, [navigate])

  /**
   * メモ一覧リンクがクリックされた時の処理（メモ化版）
   */
  const handleMemoList = useCallback(() => {
    // メニューを閉じて、メモ一覧を開く
    setIsMenuOpen(false)
    setIsMemoListOpen(true)
  }, [])

  /**
   * メモ一覧を閉じる処理（メモ化版）
   */
  const handleMemoListClose = useCallback(() => {
    setIsMemoListOpen(false)
  }, [])

  /**
   * メモ一覧でメモがクリックされた時の処理（メモ化版）
   *
   * @param index - クリックされたメモのインデックス
   */
  const handleMemoListItemClick = useCallback((index: number) => {
    // クリックされたメモを表示
    setCurrentIndex(index)
    // メモ一覧を閉じる
    setIsMemoListOpen(false)
  }, [])

  /**
   * 新規メモボタンがクリックされた時の処理（メモ化版）
   *
   * useCallback でラップすることで、user と createNewMemo が変わらない限り
   * 同じ関数参照を返します。これにより、FloatingButton コンポーネントの
   * 不要な再レンダリングを防ぎます。
   */
  const handleNewMemo = useCallback(async () => {
    if (!user) return
    // 新規メモを作成（カスタムフックの関数を使用）
    await createNewMemo()
  }, [user, createNewMemo])

  /**
   * 現在の日付を useMemo でメモ化
   *
   * getCurrentDate() は日付が変わるまで同じ値を返すため、
   * useMemo でメモ化することで、MemoEditor への不要な再レンダリングを防ぎます。
   * 依存配列は空なので、コンポーネントがマウントされた時だけ計算されます。
   */
  const currentDate = useMemo(() => getCurrentDate(), [])

  /**
   * 現在のメモのインデックスに対する削除ハンドラー（メモ化版）
   *
   * useCallback でラップすることで、currentIndex と deleteMemoByIndex が変わらない限り
   * 同じ関数参照を返します。これにより、Header コンポーネントの不要な再レンダリングを防ぎます。
   */
  const handleDeleteCurrentMemo = useCallback(() => {
    deleteMemoByIndex(currentIndex)
  }, [deleteMemoByIndex, currentIndex])

  // データ読み込み中はローディングスピナーを表示
  if (loading) {
    return <LoadingSpinner />
  }

  // メモが存在しない場合もローディングスピナーを表示（通常は起こらない）
  if (!currentMemo) {
    return <LoadingSpinner />
  }

  // DOMイベントハンドラーだけを抽出
  // goToPrevious, goToNext, canGoPrevious, canGoNext はNavigationArrowsに渡す
  const { onTouchStart, onTouchEnd, onMouseDown, onMouseUp, onMouseLeave } =
    swipeHandlers

  return (
    <div
      className="app"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* ヘッダー */}
      <Header onDelete={handleDeleteCurrentMemo} onMenuClick={handleMenuClick} />

      {/* メモエディター */}
      <div className="memo-container">
        <MemoEditor
          content={currentMemo.content}
          date={currentDate}
          onChange={handleMemoChange}
        />
      </div>

      {/* スワイプ方向インジケーター（矢印アニメーション） */}
      {swipeDirection && (
        <div
          className={`swipe-arrow-indicator swipe-arrow-indicator-${swipeDirection}`}
        >
          {swipeDirection === 'right' ? <HiChevronRight /> : <HiChevronLeft />}
        </div>
      )}

      {/* フローティング追加ボタン */}
      <FloatingButton onClick={handleNewMemo} />

      {/* ナビゲーション矢印（PC用、複数メモがある場合のみ） */}
      {memos.length > 1 && (
        <NavigationArrows
          onPrevious={swipeHandlers.goToPrevious}
          onNext={swipeHandlers.goToNext}
          canGoPrevious={swipeHandlers.canGoPrevious}
          canGoNext={swipeHandlers.canGoNext}
        />
      )}

      {/* メニュー（isMenuOpenがtrueの時のみ表示） */}
      {isMenuOpen && (
        <Menu
          onClose={handleMenuClose}
          onLogout={handleLogout}
          onMemoList={handleMemoList}
          onDeleteAccount={handleDeleteAccount}
          userEmail={user?.email}
        />
      )}

      {/* メモ一覧（isMemoListOpenがtrueの時のみ表示） */}
      {isMemoListOpen && (
        <MemoList
          memos={memos}
          onClose={handleMemoListClose}
          onMemoClick={handleMemoListItemClick}
          onMemoDelete={deleteMemoByIndex}
        />
      )}

      {/* アカウント削除中のプログレスオーバーレイ */}
      {/* deleteProgressがnullでない時（削除中）のみ表示 */}
      {deleteProgress !== null && (
        <DeleteProgressOverlay
          progress={deleteProgress}
          message={deleteStatusMessage}
        />
      )}
    </div>
  )
}

export default MemoPage
