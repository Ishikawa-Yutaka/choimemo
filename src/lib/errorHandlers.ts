/**
 * Firebase エラーハンドリングを管理するモジュール
 *
 * Firebase Authentication のエラーコードを日本語のユーザーフレンドリーなメッセージに変換します。
 * 全ての認証関連のエラー処理をここに集約することで、メッセージの一貫性を保ちます。
 */

/**
 * Firebase Authentication のエラーオブジェクト型定義
 *
 * Firebase のエラーは `code` プロパティを持つオブジェクトです。
 * 例: { code: 'auth/email-already-in-use', message: '...' }
 */
export interface FirebaseAuthError {
  /** Firebase のエラーコード（例: 'auth/email-already-in-use'） */
  code?: string
}

/**
 * Firebase Authentication のエラーコードを日本語メッセージに変換する関数
 *
 * @param error - Firebase のエラーオブジェクト
 * @returns ユーザーに表示する日本語のエラーメッセージ
 *
 * 使用例:
 * ```typescript
 * try {
 *   await signInWithEmailAndPassword(auth, email, password)
 * } catch (error) {
 *   const message = getAuthErrorMessage(error as FirebaseAuthError)
 *   setErrorMessage(message)
 * }
 * ```
 */
export const getAuthErrorMessage = (error: FirebaseAuthError): string => {
  const errorCode = error.code

  // エラーコードごとに日本語メッセージを返す
  switch (errorCode) {
    // --- メールアドレス関連のエラー ---
    case 'auth/email-already-in-use':
      return 'このメールアドレスはすでに登録されています。'

    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません。'

    // --- パスワード関連のエラー ---
    case 'auth/weak-password':
      return 'パスワードが弱すぎます。もう少し複雑にしてください。'

    case 'auth/wrong-password':
    case 'auth/user-not-found':
      // セキュリティのため、どちらのエラーも同じメッセージを返す
      return 'メールアドレスまたはパスワードが正しくありません。'

    // --- アカウント状態のエラー ---
    case 'auth/user-disabled':
      return 'このアカウントは無効化されています。'

    case 'auth/operation-not-allowed':
      return 'メール/パスワードでの登録が有効になっていません。管理者に確認してください。'

    // --- Google ログイン関連のエラー ---
    case 'auth/popup-closed-by-user':
      return 'ログインがキャンセルされました。'

    case 'auth/popup-blocked':
      return 'ポップアップがブロックされました。ブラウザの設定を確認してください。'

    case 'auth/account-exists-with-different-credential':
      return 'このメールアドレスは既に別の方法で登録されています。'

    // --- レート制限のエラー ---
    case 'auth/too-many-requests':
      return 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。'

    // --- メール操作（確認メール・パスワードリセット）のエラー ---
    case 'auth/expired-action-code':
      return 'リンクの有効期限が切れています。再度メールを送信してください。'

    case 'auth/invalid-action-code':
      return 'リンクがすでに使用済みか、無効です。再度メールを送信してください。'

    // --- その他のエラー ---
    default:
      return '処理に失敗しました。時間をおいて再度お試しください。'
  }
}

/**
 * 操作タイプ別のデフォルトエラーメッセージを取得する関数
 *
 * Firebase のエラーコードが取得できない場合に使用します。
 *
 * @param operationType - 実行していた操作の種類
 * @returns 操作に応じたデフォルトのエラーメッセージ
 *
 * 使用例:
 * ```typescript
 * catch (error) {
 *   const message = error?.code
 *     ? getAuthErrorMessage(error as FirebaseAuthError)
 *     : getFallbackErrorMessage('signup')
 *   setErrorMessage(message)
 * }
 * ```
 */
export const getFallbackErrorMessage = (
  operationType:
    | 'signup'
    | 'login'
    | 'resetPassword'
    | 'emailVerification'
    | 'googleLogin'
): string => {
  switch (operationType) {
    case 'signup':
      return 'アカウントの作成に失敗しました。時間をおいて再度お試しください。'
    case 'login':
      return 'ログインに失敗しました。時間をおいて再度お試しください。'
    case 'resetPassword':
      return 'メールの送信に失敗しました。時間をおいて再度お試しください。'
    case 'emailVerification':
      return 'メールの送信に失敗しました。'
    case 'googleLogin':
      return 'Google ログインに失敗しました。時間をおいて再度お試しください。'
    default:
      return '処理に失敗しました。時間をおいて再度お試しください。'
  }
}
