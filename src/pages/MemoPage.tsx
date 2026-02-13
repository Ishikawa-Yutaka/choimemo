/**
 * メモページコンポーネント
 *
 * メモの作成・読込・更新・削除（CRUD）を実装した画面です。
 * - メモ一覧をFirestoreから読み込み
 * - 現在表示中のメモを管理
 * - メモの作成・更新・削除機能
 * - 将来的にスワイプナビゲーションと自動保存を追加予定
 */

import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header'
import MemoEditor from '../components/MemoEditor'
import FloatingButton from '../components/FloatingButton'
import Menu from '../components/Menu'
import MemoList from '../components/MemoList'
import NavigationArrows from '../components/NavigationArrows'
import { useAuth } from '../contexts/AuthContext'
import { useMemoOperations } from '../hooks/useMemoOperations'
import { useSwipeNavigation } from '../hooks/useSwipeNavigation'
import {
  getMemos,
  createMemo,
  updateMemo,
} from '../lib/database'
import type { Memo } from '../lib/database'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
import '../App.css'

/**
 * 現在の日付を "YYYY/MM/DD" 形式で取得するヘルパー関数
 *
 * @returns フォーマットされた日付文字列（例: "2026/01/25"）
 */
const getCurrentDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

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

  // 全メモのリストを管理するState
  const [memos, setMemos] = useState<Memo[]>([])

  // 現在表示中のメモのインデックス（memos配列の何番目か）
  const [currentIndex, setCurrentIndex] = useState(0)

  // スワイプ方向インジケーター（'left' | 'right' | null）
  // スワイプ時に表示される矢印の方向を管理
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  // データ読み込み中かどうか
  const [loading, setLoading] = useState(true)

  // メニューの表示/非表示を管理
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // メモ一覧の表示/非表示を管理
  const [isMemoListOpen, setIsMemoListOpen] = useState(false)

  // テーマ（ライトモード/ダークモード）を管理
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  /**
   * デバウンス処理用のタイマーIDを保持
   *
   * useRefを使う理由:
   * - useStateだと値が変わるたびに再レンダリングが発生してしまう
   * - useRefは値が変わっても再レンダリングされない（タイマーIDの保持に最適）
   * - コンポーネントのライフサイクル全体で同じ値を保持できる
   */
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

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
   * インデックスが変更された時のハンドラー（矢印アニメーション付き）
   */
  const handleIndexChange = (newIndex: number) => {
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
  }

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

  /**
   * コンポーネントマウント時にFirestoreからメモ一覧を取得
   */
  useEffect(() => {
    const loadMemos = async () => {
      if (!user) return

      try {
        setLoading(true)
        // Firestoreからユーザーのメモ一覧を取得（作成日時が新しい順）
        const fetchedMemos = await getMemos(user.uid)

        if (fetchedMemos.length === 0) {
          // メモが1つもない場合は、空の新規メモを作成
          const newMemoId = await createMemo(user.uid, {
            content: '',
          })

          // 作成したメモをStateに追加
          setMemos([
            {
              id: newMemoId,
              content: '',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ])
        } else {
          // 取得したメモをStateに保存
          setMemos(fetchedMemos)
        }
      } catch (error) {
        console.error('メモの読み込みに失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemos()
  }, [user])

  /**
   * コンポーネントがアンマウントされる時に、
   * デバウンスタイマーをクリーンアップ
   *
   * これをしないと、コンポーネントが破棄された後にタイマーが実行されて
   * エラーやメモリリークが発生する可能性があります。
   */
  useEffect(() => {
    return () => {
      // コンポーネントがアンマウントされる時に実行される
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // 現在表示中のメモを取得
  const currentMemo = memos[currentIndex]

  /**
   * メモの内容が変更された時の処理（デバウンス付き自動保存）
   *
   * @param newContent - 新しいメモの内容
   *
   * 処理の流れ:
   * 1. まず画面表示を即座に更新（ユーザーの入力がすぐ反映される）
   * 2. 前回のタイマーをキャンセル（連続入力の場合、保存をキャンセル）
   * 3. 500ms後にFirestoreに保存するタイマーをセット
   * 4. ユーザーが入力を止めて500ms経過したら、初めて保存実行
   */
  const handleMemoChange = (newContent: string) => {
    if (!user || !currentMemo) return

    // 1. まず画面表示を即座に更新（ローカルState）
    // これにより、ユーザーの入力がすぐに画面に反映される
    setMemos((prevMemos) =>
      prevMemos.map((memo, index) =>
        index === currentIndex
          ? { ...memo, content: newContent, updated_at: new Date() }
          : memo
      )
    )

    // 2. 前回のタイマーが残っていればキャンセル
    // 「こ」→「こん」→「こんに」と入力された場合、
    // 「こ」と「こん」の保存はキャンセルされる
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 3. 新しいタイマーをセット（500ms後に保存）
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // 4. 500ms経過後、Firestoreに保存
        await updateMemo(user.uid, currentMemo.id, {
          content: newContent,
        })
        console.log('メモを自動保存しました')
      } catch (error) {
        console.error('メモの更新に失敗しました:', error)
      }
    }, 500) // 500ms（0.5秒）のデバウンス
  }

  /**
   * ゴミ箱ボタン（メイン画面）がクリックされた時の処理
   */
  const handleDelete = async () => {
    if (!currentMemo) return
    // 現在表示中のメモを削除（カスタムフックの関数を使用）
    await deleteMemoByIndex(currentIndex)
  }

  /**
   * メニューボタンがクリックされた時の処理
   */
  const handleMenuClick = () => {
    // メニューを開く
    setIsMenuOpen(true)
  }

  /**
   * メニューを閉じる処理
   */
  const handleMenuClose = () => {
    setIsMenuOpen(false)
  }

  /**
   * ログアウト処理
   */
  const handleLogout = async () => {
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
  }

  /**
   * メモ一覧リンクがクリックされた時の処理
   */
  const handleMemoList = () => {
    // メニューを閉じて、メモ一覧を開く
    setIsMenuOpen(false)
    setIsMemoListOpen(true)
  }

  /**
   * メモ一覧を閉じる処理
   */
  const handleMemoListClose = () => {
    setIsMemoListOpen(false)
  }

  /**
   * メモ一覧でメモがクリックされた時の処理
   *
   * @param index - クリックされたメモのインデックス
   */
  const handleMemoListItemClick = (index: number) => {
    // クリックされたメモを表示
    setCurrentIndex(index)
    // メモ一覧を閉じる
    setIsMemoListOpen(false)
  }

  /**
   * メモ一覧でメモが削除された時の処理
   *
   * @param index - 削除するメモのインデックス
   */
  const handleMemoListItemDelete = async (index: number) => {
    // メモを削除（カスタムフックの関数を使用）
    await deleteMemoByIndex(index)
  }

  /**
   * テーマ切り替え処理（ライト ⇔ ダーク）
   */
  const handleToggleTheme = () => {
    // 現在のテーマと逆のテーマに切り替え
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
    setIsMenuOpen(false)
  }

  /**
   * 新規メモボタンがクリックされた時の処理
   */
  const handleNewMemo = async () => {
    if (!user) return
    // 新規メモを作成（カスタムフックの関数を使用）
    await createNewMemo()
  }

  // データ読み込み中は「読み込み中」を表示
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        読み込み中...
      </div>
    )
  }

  // メモが存在しない場合の表示（通常は起こらない）
  if (!currentMemo) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666',
        }}
      >
        メモが見つかりません
      </div>
    )
  }

  // DOMイベントハンドラーだけを抽出
  // goToPrevious, goToNext, canGoPrevious, canGoNext はNavigationArrowsに渡す
  const { onTouchStart, onTouchEnd, onMouseDown, onMouseUp, onMouseLeave } = swipeHandlers

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
      <Header onDelete={handleDelete} onMenuClick={handleMenuClick} />

      {/* メモエディター */}
      <div className="memo-container">
        <MemoEditor
          content={currentMemo.content}
          date={getCurrentDate()}
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
          onToggleTheme={handleToggleTheme}
          currentTheme={theme}
        />
      )}

      {/* メモ一覧（isMemoListOpenがtrueの時のみ表示） */}
      {isMemoListOpen && (
        <MemoList
          memos={memos}
          onClose={handleMemoListClose}
          onMemoClick={handleMemoListItemClick}
          onMemoDelete={handleMemoListItemDelete}
        />
      )}
    </div>
  )
}

export default MemoPage

