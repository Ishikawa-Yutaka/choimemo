/**
 * errorHandlers.ts のユニットテスト
 *
 * このファイルでは、Firebase Authentication のエラーメッセージ変換関数のテストを行います。
 * エラーハンドリングは重要な機能なので、全てのエラーコードをテストします。
 */

import { describe, it, expect } from 'vitest'
import {
  getAuthErrorMessage,
  getFallbackErrorMessage,
  type FirebaseAuthError,
} from './errorHandlers'

/**
 * getAuthErrorMessage() のテストグループ
 */
describe('getAuthErrorMessage', () => {
  /**
   * メールアドレス関連のエラー
   */
  describe('メールアドレス関連のエラー', () => {
    it('email-already-in-use のエラーメッセージを返すこと', () => {
      // 準備: Firebase のエラーオブジェクトを模擬
      const error: FirebaseAuthError = {
        code: 'auth/email-already-in-use',
      }

      // 実行
      const result = getAuthErrorMessage(error)

      // 検証
      expect(result).toBe('このメールアドレスはすでに登録されています。')
    })

    it('invalid-email のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/invalid-email',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe('メールアドレスの形式が正しくありません。')
    })
  })

  /**
   * パスワード関連のエラー
   */
  describe('パスワード関連のエラー', () => {
    it('weak-password のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/weak-password',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe(
        'パスワードが弱すぎます。もう少し複雑にしてください。'
      )
    })

    it('wrong-password のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/wrong-password',
      }

      const result = getAuthErrorMessage(error)

      // セキュリティのため、wrong-password も user-not-found も同じメッセージ
      expect(result).toBe(
        'メールアドレスまたはパスワードが正しくありません。'
      )
    })

    it('user-not-found のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/user-not-found',
      }

      const result = getAuthErrorMessage(error)

      // セキュリティのため、wrong-password と同じメッセージ
      expect(result).toBe(
        'メールアドレスまたはパスワードが正しくありません。'
      )
    })
  })

  /**
   * アカウント状態のエラー
   */
  describe('アカウント状態のエラー', () => {
    it('user-disabled のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/user-disabled',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe('このアカウントは無効化されています。')
    })

    it('operation-not-allowed のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/operation-not-allowed',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe(
        'メール/パスワードでの登録が有効になっていません。管理者に確認してください。'
      )
    })
  })

  /**
   * Google ログイン関連のエラー
   */
  describe('Google ログイン関連のエラー', () => {
    it('popup-closed-by-user のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/popup-closed-by-user',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe('ログインがキャンセルされました。')
    })

    it('popup-blocked のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/popup-blocked',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe(
        'ポップアップがブロックされました。ブラウザの設定を確認してください。'
      )
    })

    it('account-exists-with-different-credential のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/account-exists-with-different-credential',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe(
        'このメールアドレスは既に別の方法で登録されています。'
      )
    })
  })

  /**
   * レート制限のエラー
   */
  describe('レート制限のエラー', () => {
    it('too-many-requests のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/too-many-requests',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe(
        'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。'
      )
    })
  })

  /**
   * メール操作（確認メール・パスワードリセット）のエラー
   */
  describe('メール操作のエラー', () => {
    it('expired-action-code のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/expired-action-code',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe(
        'リンクの有効期限が切れています。再度メールを送信してください。'
      )
    })

    it('invalid-action-code のエラーメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/invalid-action-code',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe(
        'リンクがすでに使用済みか、無効です。再度メールを送信してください。'
      )
    })
  })

  /**
   * その他のエラー・デフォルトケース
   */
  describe('その他のエラー', () => {
    it('未知のエラーコードの場合、デフォルトメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: 'auth/unknown-error-code',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe('処理に失敗しました。時間をおいて再度お試しください。')
    })

    it('エラーコードがない場合、デフォルトメッセージを返すこと', () => {
      // code プロパティが undefined の場合
      const error: FirebaseAuthError = {}

      const result = getAuthErrorMessage(error)

      expect(result).toBe('処理に失敗しました。時間をおいて再度お試しください。')
    })

    it('code が空文字列の場合、デフォルトメッセージを返すこと', () => {
      const error: FirebaseAuthError = {
        code: '',
      }

      const result = getAuthErrorMessage(error)

      expect(result).toBe('処理に失敗しました。時間をおいて再度お試しください。')
    })
  })
})

/**
 * getFallbackErrorMessage() のテストグループ
 */
describe('getFallbackErrorMessage', () => {
  it('signup のフォールバックメッセージを返すこと', () => {
    const result = getFallbackErrorMessage('signup')

    expect(result).toBe(
      'アカウントの作成に失敗しました。時間をおいて再度お試しください。'
    )
  })

  it('login のフォールバックメッセージを返すこと', () => {
    const result = getFallbackErrorMessage('login')

    expect(result).toBe('ログインに失敗しました。時間をおいて再度お試しください。')
  })

  it('resetPassword のフォールバックメッセージを返すこと', () => {
    const result = getFallbackErrorMessage('resetPassword')

    expect(result).toBe(
      'メールの送信に失敗しました。時間をおいて再度お試しください。'
    )
  })

  it('emailVerification のフォールバックメッセージを返すこと', () => {
    const result = getFallbackErrorMessage('emailVerification')

    expect(result).toBe('メールの送信に失敗しました。')
  })

  it('googleLogin のフォールバックメッセージを返すこと', () => {
    const result = getFallbackErrorMessage('googleLogin')

    expect(result).toBe(
      'Google ログインに失敗しました。時間をおいて再度お試しください。'
    )
  })
})
