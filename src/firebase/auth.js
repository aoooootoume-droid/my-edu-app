import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// ============================================
// メールドメイン制限設定
// ============================================

// 許可するドメインのリスト（必要に応じて追加・削除してください）
const ALLOWED_DOMAINS = [
  'school.jp',
  'school.ed.jp',
  'edu.jp',
  // 他に許可したいドメインを追加
];

// すべてのドメインを許可する場合は true に設定
const ALLOW_ALL_DOMAINS = false;

/**
 * メールアドレスのドメインが許可されているかチェック
 * @param {string} email - チェックするメールアドレス
 * @returns {object} - { valid: boolean, error: string }
 */
const validateEmailDomain = (email) => {
  // すべてのドメインを許可する設定の場合はスキップ
  if (ALLOW_ALL_DOMAINS) {
    return { valid: true, error: null };
  }

  if (!email || !email.includes('@')) {
    return { valid: false, error: '有効なメールアドレスを入力してください' };
  }

  const domain = email.split('@')[1].toLowerCase();

  // 許可されたドメインかチェック
  const isAllowed = ALLOWED_DOMAINS.some(allowedDomain => {
    const lowerDomain = allowedDomain.toLowerCase();
    // 完全一致 or サブドメインを含む
    return domain === lowerDomain || domain.endsWith('.' + lowerDomain);
  });

  if (!isAllowed) {
    return { 
      valid: false, 
      error: `許可されたドメインのメールアドレスを使用してください（例: ${ALLOWED_DOMAINS[0]}）` 
    };
  }

  return { valid: true, error: null };
};

// ============================================

/**
 * 新規ユーザー登録
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 * @param {string} username - ユーザー名
 * @param {string} role - 役割 ('teacher' or 'student')
 */
export const registerUser = async (email, password, username, role = 'student') => {
  try {
    // メールドメインのバリデーション
    const domainCheck = validateEmailDomain(email);
    if (!domainCheck.valid) {
      return { success: false, error: domainCheck.error };
    }

    // Firebase Authenticationにユーザー作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestoreにユーザー情報を保存
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      username: username,
      role: role, // 'teacher' または 'student'
      createdAt: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    console.error('登録エラー:', error.message);
    
    // Firebaseのエラーメッセージを日本語化
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'このメールアドレスは既に使用されています';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '無効なメールアドレスです';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'パスワードは6文字以上で設定してください';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * ログイン
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestoreからユーザー情報を取得
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    return { 
      success: true, 
      user: {
        uid: user.uid,
        email: user.email,
        ...userData
      }
    };
  } catch (error) {
    console.error('ログインエラー:', error.message);
    
    // Firebaseのエラーメッセージを日本語化
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'ユーザーが見つかりません';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'パスワードが間違っています';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '無効なメールアドレスです';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'このアカウントは無効化されています';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * ログアウト
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('ログアウトエラー:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 認証状態の監視
 * @param {function} callback - ユーザー情報を受け取るコールバック関数
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // ログイン中: Firestoreからユーザー情報取得
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      callback({
        uid: user.uid,
        email: user.email,
        ...userData
      });
    } else {
      // ログアウト状態
      callback(null);
    }
  });
};

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentUser = async () => {
  const user = auth.currentUser;
  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return {
      uid: user.uid,
      email: user.email,
      ...userDoc.data()
    };
  }
  return null;
};

/**
 * 許可されているドメインのリストを取得（フロントエンドで表示用）
 * @returns {array} - 許可されたドメインの配列
 */
export const getAllowedDomains = () => {
  return ALLOWED_DOMAINS;
};

/**
 * すべてのドメインが許可されているかチェック
 * @returns {boolean}
 */
export const isAllDomainsAllowed = () => {
  return ALLOW_ALL_DOMAINS;
};