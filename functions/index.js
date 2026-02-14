/**
 * Cloud Functions for Firebase
 *
 * このファイルには、サーバー側で自動実行される関数を定義します。
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin SDKを初期化
admin.initializeApp();

/**
 * ユーザーアカウント削除時に、そのユーザーのメモをすべて削除
 *
 * 実行タイミング: Firebase Authenticationでユーザーが削除されたとき
 *
 * @param {Object} user - 削除されたユーザーの情報
 * @returns {Promise} 処理結果
 */
exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;

  console.log(`[deleteUserData] ユーザー削除イベント発生: ${userId}`);

  try {
    // ユーザーのメモコレクションへの参照
    const memosRef = admin.firestore().collection(`users/${userId}/memos`);

    // すべてのメモを取得
    const snapshot = await memosRef.get();

    console.log(`[deleteUserData] 削除するメモ数: ${snapshot.size}`);

    if (snapshot.empty) {
      console.log(`[deleteUserData] 削除するメモがありません`);
      return { success: true, deletedCount: 0 };
    }

    // バッチ処理で削除（一度に500件まで）
    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // バッチを実行
    await batch.commit();

    console.log(`[deleteUserData] ユーザー ${userId} のメモをすべて削除しました（${snapshot.size}件）`);

    return { success: true, deletedCount: snapshot.size };
  } catch (error) {
    console.error('[deleteUserData] メモの削除に失敗しました:', error);
    throw new functions.https.HttpsError(
      'internal',
      'メモの削除に失敗しました',
      error.message
    );
  }
});
