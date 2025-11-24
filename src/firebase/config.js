import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // ← 追加

// ⚠️ ここにFirebase Consoleからコピーした設定情報を貼り付けてください
const firebaseConfig = {
  apiKey: "AIzaSyC_1HuM6XnbcFmTSRqtti2qBYeTdwBZs1A",
  authDomain: "my-edu-app-116ef.firebaseapp.com",
  projectId: "my-edu-app-116ef",
  storageBucket: "my-edu-app-116ef.firebasestorage.app",
  messagingSenderId: "872544733028",
  appId: "1:872544733028:web:98c3b881140159a54e5c71"
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// 各サービスを取得
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ← 追加

export default app;