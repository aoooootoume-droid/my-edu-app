import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * 新規ユーザー登録
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 * @param {string} username - ユーザー名
 * @param {string} role - 役割 ('teacher' or 'student')
 */
export const registerUser = async (email, password, username, role = 'student') => {
  try {
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
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
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