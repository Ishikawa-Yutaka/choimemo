/**
 * 日付や文字列のフォーマット関数を提供するモジュール
 *
 * アプリ全体で使用する共通のフォーマット処理をここに集約します。
 */

/**
 * 現在の日付を "YYYY/MM/DD" 形式で取得する
 *
 * @returns フォーマットされた日付文字列（例: "2026/01/25"）
 *
 * 使用例:
 * ```typescript
 * const today = getCurrentDate()
 * console.log(today) // "2026/01/25"
 * ```
 */
export const getCurrentDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/**
 * Dateオブジェクトを "YYYY/MM/DD HH:MM" 形式にフォーマットする
 *
 * @param date - フォーマットする日付
 * @returns フォーマットされた日付文字列（例: "2026/01/25 14:30"）
 *
 * 使用例:
 * ```typescript
 * const date = new Date()
 * const formatted = formatDate(date)
 * console.log(formatted) // "2026/01/25 14:30"
 * ```
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

/**
 * メモの内容からプレビュー用のテキストを生成する
 *
 * - 改行を削除してスペースに置き換え
 * - 最大30文字まで表示
 * - 長い場合は「...」を追加
 *
 * @param content - メモの内容
 * @returns プレビュー用のテキスト
 *
 * 使用例:
 * ```typescript
 * const content = "こんにちは\nこれはテストです\n長いテキスト..."
 * const preview = getPreviewText(content)
 * console.log(preview) // "こんにちは これはテストです 長いテキ..."
 * ```
 */
export const getPreviewText = (content: string): string => {
  // 改行を削除してスペースに置き換え
  const singleLine = content.replace(/\n/g, ' ')

  // 30文字まで表示（それ以上は「...」を付ける）
  if (singleLine.length > 30) {
    return singleLine.slice(0, 30) + '...'
  }

  return singleLine
}
