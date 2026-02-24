/**
 * formatters.ts のユニットテスト
 *
 * このファイルでは、formatters.ts に定義されている
 * 日付フォーマット関数とテキスト処理関数のテストを行います。
 *
 * テストの基本構造:
 * describe() - テストのグループ化（何をテストするか）
 * it() / test() - 個別のテストケース（どんな動作を期待するか）
 * expect() - 期待値の検証（実際の結果が期待通りか確認）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getCurrentDate, formatDate, getPreviewText } from './formatters'

/**
 * describe: テストのグループ化
 *
 * 関連するテストをまとめて、テスト結果を見やすくします。
 * 通常は「関数名」や「機能名」でグループ化します。
 */
describe('formatters', () => {
  /**
   * getCurrentDate() のテストグループ
   */
  describe('getCurrentDate', () => {
    /**
     * it: 個別のテストケース
     *
     * 1つの具体的な動作を検証します。
     * 文は「〜すること」「〜であること」のように書くと読みやすいです。
     */
    it('現在の日付を YYYY/MM/DD 形式で返すこと', () => {
      // 実行: 関数を呼び出す
      const result = getCurrentDate()

      // 検証: 形式が正しいか確認
      // 正規表現で "YYYY/MM/DD" 形式かチェック
      // \d{4} = 4桁の数字（年）
      // \d{2} = 2桁の数字（月、日）
      expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)

      // 実際に今日の日付と一致するか確認
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const expected = `${year}/${month}/${day}`

      expect(result).toBe(expected)
    })

    it('日付のゼロ埋めが正しく動作すること', () => {
      const result = getCurrentDate()

      // 月と日が必ず2桁になっているか確認
      const parts = result.split('/')
      expect(parts).toHaveLength(3) // 年/月/日の3つの部分

      // 年は4桁
      expect(parts[0]).toHaveLength(4)
      // 月は2桁
      expect(parts[1]).toHaveLength(2)
      // 日は2桁
      expect(parts[2]).toHaveLength(2)
    })
  })

  /**
   * formatDate() のテストグループ
   */
  describe('formatDate', () => {
    it('Dateオブジェクトを YYYY/MM/DD HH:MM 形式で返すこと', () => {
      // 準備: テスト用の日付を作成
      const testDate = new Date('2026-02-23T14:30:00')

      // 実行
      const result = formatDate(testDate)

      // 検証
      expect(result).toBe('2026/02/23 14:30')
    })

    it('月、日、時、分が1桁の場合、ゼロ埋めされること', () => {
      // 2026/01/05 03:05
      const testDate = new Date('2026-01-05T03:05:00')

      const result = formatDate(testDate)

      // すべて2桁でゼロ埋めされているか確認
      expect(result).toBe('2026/01/05 03:05')
    })

    it('深夜0時を正しくフォーマットできること', () => {
      // 0時0分
      const testDate = new Date('2026-02-23T00:00:00')

      const result = formatDate(testDate)

      expect(result).toBe('2026/02/23 00:00')
    })

    it('23時59分を正しくフォーマットできること', () => {
      // 23時59分
      const testDate = new Date('2026-02-23T23:59:00')

      const result = formatDate(testDate)

      expect(result).toBe('2026/02/23 23:59')
    })
  })

  /**
   * getPreviewText() のテストグループ
   */
  describe('getPreviewText', () => {
    it('30文字以下のテキストはそのまま返すこと', () => {
      const shortText = 'これは短いテキストです'

      const result = getPreviewText(shortText)

      // 13文字なので、そのまま返される
      expect(result).toBe('これは短いテキストです')
    })

    it('30文字を超えるテキストは切り詰めて「...」を付けること', () => {
      // 40文字のテキスト
      const longText = 'これは非常に長いテキストで30文字を超えているので切り詰められます'

      const result = getPreviewText(longText)

      // 30文字 + "..." になっているか確認
      expect(result).toBe('これは非常に長いテキストで30文字を超えているので切り詰めら...')
      expect(result.length).toBe(33) // 30文字 + "..."(3文字)
    })

    it('ちょうど30文字のテキストは「...」を付けないこと', () => {
      // ちょうど30文字（10文字 × 3回）
      const exactText = '1234567890'.repeat(3)

      const result = getPreviewText(exactText)

      expect(result).toBe(exactText)
      expect(result.length).toBe(30)
    })

    it('改行を含むテキストは改行をスペースに置き換えること', () => {
      const textWithNewlines = 'こんにちは\nこれはテスト\nです'

      const result = getPreviewText(textWithNewlines)

      // 改行が全てスペースになっているか確認
      expect(result).toBe('こんにちは これはテスト です')
      // 改行が含まれていないことを確認
      expect(result).not.toContain('\n')
    })

    it('改行を含む長いテキストは、スペース置換後に切り詰めること', () => {
      // 改行を含む長いテキスト（40文字）
      const longTextWithNewlines =
        'これは長い\nテキストで\n30文字を\n超えているので切り詰められます'

      const result = getPreviewText(longTextWithNewlines)

      // 改行がスペースになり、30文字で切り詰められているか確認
      expect(result).toContain(' ') // スペースが含まれる
      expect(result).not.toContain('\n') // 改行は含まれない
      expect(result).toMatch(/\.\.\.$/) // 末尾が「...」
      expect(result.length).toBe(33) // 30文字 + "..."
    })

    it('空文字列を渡してもエラーにならないこと', () => {
      const emptyText = ''

      const result = getPreviewText(emptyText)

      expect(result).toBe('')
    })
  })
})
