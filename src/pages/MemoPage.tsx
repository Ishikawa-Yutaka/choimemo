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
import { useAuth } from '../hooks/useAuth'
import { useMemoOperations } from '../hooks/useMemoOperations'
import {
  getMemos,
  createMemo,
  updateMemo,
} from '../lib/database'
import type { Memo } from '../lib/database'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
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
   * スワイプ操作の開始位置（X座標）を保持
   *
   * タッチ開始時のX座標を記録し、タッチ終了時の座標と比較することで
   * 左右どちらにスワイプしたかを判定します。
   */
  const touchStartXRef = useRef<number>(0)

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

  /**
   * タッチ開始時の処理
   *
   * @param event - タッチイベント
   *
   * スマホの画面にタッチした瞬間に呼ばれます。
   * タッチ開始位置のX座標を記録しておきます。
   */
  const handleTouchStart = (event: React.TouchEvent) => {
    // event.touches[0] = 最初の指のタッチ情報
    // clientX = 画面左端からの横方向の距離（px）
    touchStartXRef.current = event.touches[0].clientX
  }

  /**
   * タッチ終了時の処理（スワイプ判定）
   *
   * @param event - タッチイベント
   *
   * 指を離した時に呼ばれます。
   * タッチ開始位置と終了位置を比較して、スワイプ方向を判定します。
   */
  const handleTouchEnd = (event: React.TouchEvent) => {
    // event.changedTouches[0] = 離された指のタッチ情報
    const touchEndX = event.changedTouches[0].clientX

    // スワイプ距離を計算（正の数 = 右スワイプ、負の数 = 左スワイプ）
    const diffX = touchEndX - touchStartXRef.current

    // 最低でも50px以上移動していないとスワイプとして認識しない
    // （誤動作を防ぐため）
    const minSwipeDistance = 50

    if (diffX > minSwipeDistance) {
      // 右スワイプ → 前のメモへ
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
    } else if (diffX < -minSwipeDistance) {
      // 左スワイプ → 次のメモへ
      if (currentIndex < memos.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }
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

  return (
    <div
      className="app"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ヘッダー */}
      <Header onDelete={handleDelete} onMenuClick={handleMenuClick} />

      {/* メモエディター */}
      <MemoEditor
        content={currentMemo.content}
        date={getCurrentDate()}
        onChange={handleMemoChange}
      />

      {/* フローティング追加ボタン */}
      <FloatingButton onClick={handleNewMemo} />

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

