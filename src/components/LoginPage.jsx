import { useState } from 'react';
import styles from './LoginPage.module.css';
import { loginUser, registerUser, loginWithGoogle, loginWithApple } from '../firebase';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function LoginPage({ onLogin }) {
  // ステップ管理: 'login' -> 'school-code'
  const [step, setStep] = useState('login');
  const [authUser, setAuthUser] = useState(null);
  
  // ログイン関連
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 学校コード関連
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolPassword, setSchoolPassword] = useState('');
  const [schoolError, setSchoolError] = useState('');
  const [schoolLoading, setSchoolLoading] = useState(false);

  // 認証後に学校コードをチェック
  const checkSchoolCode = async (user) => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().schoolCode) {
      // 既に登録済みならそのままログイン
      onLogin({
        ...user,
        role: userDoc.data().role,
        schoolCode: userDoc.data().schoolCode,
        schoolName: userDoc.data().schoolName
      });
    } else {
      // 学校コード入力画面へ
      setAuthUser(user);
      setStep('school-code');
    }
  };

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        await checkSchoolCode(result.user);
      } else {
        setError(result.error || 'Googleログインに失敗しました');
      }
    } catch (err) {
      setError('エラーが発生しました');
      console.error(err);
    }
    
    setLoading(false);
  };

  // Appleログイン処理
  const handleAppleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const result = await loginWithApple();
      
      if (result.success) {
        await checkSchoolCode(result.user);
      } else {
        setError(result.error || 'Appleログインに失敗しました');
      }
    } catch (err) {
      setError('エラーが発生しました');
      console.error(err);
    }
    
    setLoading(false);
  };

  // メールログイン/登録処理
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!username.trim()) {
          setError('ユーザー名を入力してください');
          setLoading(false);
          return;
        }

        const result = await registerUser(email, password, username, 'student');
        
        if (result.success) {
          await checkSchoolCode(result.user);
        } else {
          setError(result.error || '登録に失敗しました');
        }
      } else {
        const result = await loginUser(email, password);
        
        if (result.success) {
          await checkSchoolCode(result.user);
        } else {
          setError(result.error || 'ログインに失敗しました');
        }
      }
    } catch (err) {
      setError('エラーが発生しました');
      console.error(err);
    }

    setLoading(false);
  };

  // モード切り替え
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setEmail('');
    setPassword('');
    setUsername('');
  };

  // 学校コード認証処理
  const handleSchoolCodeSubmit = async (e) => {
    e.preventDefault();
    setSchoolError('');
    setSchoolLoading(true);

    try {
      const codeUpper = schoolCode.toUpperCase();
      
      // 学校コードの存在確認
      const schoolDoc = await getDoc(doc(db, 'schools', codeUpper));
      
      if (!schoolDoc.exists()) {
        setSchoolError('学校コードが見つかりません');
        setSchoolLoading(false);
        return;
      }

      const schoolData = schoolDoc.data();

      // パスワードで役割を判定
      let userRole = null;
      
      if (schoolData.studentPassword === schoolPassword) {
        userRole = 'student';
      } else if (schoolData.teacherPassword === schoolPassword) {
        userRole = 'teacher';
      } else {
        setSchoolError('パスワードが正しくありません');
        setSchoolLoading(false);
        return;
      }

      // ユーザー情報を更新
      await setDoc(doc(db, 'users', authUser.uid), {
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        role: userRole,
        schoolCode: codeUpper,
        schoolName: schoolData.name,
        updatedAt: new Date()
      }, { merge: true });

      // ログイン完了
      onLogin({
        ...authUser,
        role: userRole,
        schoolCode: codeUpper,
        schoolName: schoolData.name
      });

    } catch (err) {
      console.error('学校コード認証エラー:', err);
      setSchoolError('認証中にエラーが発生しました');
    }

    setSchoolLoading(false);
  };

  // 戻るボタン
  const handleBack = () => {
    setStep('login');
    setSchoolCode('');
    setSchoolPassword('');
    setSchoolError('');
    setAuthUser(null);
  };

  // 学校コード入力画面
  if (step === 'school-code') {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 5L5 12.5V27.5C5 31 12.5 35 20 35C27.5 35 35 31 35 27.5V12.5L20 5Z" fill="url(#gradient)" />
                <path d="M20 15V25M15 20H25" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient" x1="5" y1="5" x2="35" y2="35">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className={styles.title}>学校認証</h1>
            <p className={styles.subtitle}>
              学校コードとパスワードを入力してください
            </p>
          </div>

          {/* ログイン中のユーザー表示 */}
          <div className={styles.userInfo}>
            {authUser?.photoURL && (
              <img src={authUser.photoURL} alt="" className={styles.userAvatar} />
            )}
            <div className={styles.userDetails}>
              <span className={styles.userName}>{authUser?.displayName || authUser?.email}</span>
              <span className={styles.userEmail}>{authUser?.email}</span>
            </div>
          </div>

          <form onSubmit={handleSchoolCodeSubmit} className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label htmlFor="schoolCode">学校コード</label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L2 6V8H18V6L10 2ZM4 10V16H7V10H4ZM9 10V16H11V10H9ZM13 10V16H16V10H13ZM2 18H18V20H2V18Z" fill="#9CA3AF"/>
                </svg>
                <input
                  id="schoolCode"
                  type="text"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="例: SCHOOL001"
                  required
                  autoComplete="off"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="schoolPassword">学校パスワード</label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="9" width="12" height="9" rx="2" stroke="#9CA3AF" strokeWidth="1.5" fill="none"/>
                  <path d="M7 9V6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6V9" stroke="#9CA3AF" strokeWidth="1.5"/>
                </svg>
                <input
                  id="schoolPassword"
                  type="password"
                  value={schoolPassword}
                  onChange={(e) => setSchoolPassword(e.target.value)}
                  placeholder="学校から配布されたパスワード"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {schoolError && (
              <div className={styles.errorAlert}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M10 6V10M10 13V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>{schoolError}</span>
              </div>
            )}

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={schoolLoading}
            >
              {schoolLoading ? (
                <>
                  <svg className={styles.spinner} width="20" height="20" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="25" />
                  </svg>
                  認証中...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                  認証して続ける
                </>
              )}
            </button>

            <button 
              type="button" 
              className={styles.backButton}
              onClick={handleBack}
            >
              ← 戻る
            </button>
          </form>

          <div className={styles.footer}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C4.69 2 2 4.69 2 8C2 11.31 4.69 14 8 14C11.31 14 14 11.31 14 8C14 4.69 11.31 2 8 2ZM7 11V9H9V11H7ZM9 8H7V5H9V8Z" fill="currentColor"/>
            </svg>
            <p>学校コードは学校の管理者から配布されます</p>
          </div>
        </div>
      </div>
    );
  }

  // 通常のログイン画面
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 5L5 12.5V27.5C5 31 12.5 35 20 35C27.5 35 35 31 35 27.5V12.5L20 5Z" fill="url(#gradient)" />
              <path d="M20 15V25M15 20H25" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="gradient" x1="5" y1="5" x2="35" y2="35">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.title}>
            {isRegisterMode ? '新規アカウント作成' : 'ログイン'}
          </h1>
          <p className={styles.subtitle}>
            {isRegisterMode 
              ? 'アカウント情報を入力してください' 
              : 'アカウントにサインインしてください'}
          </p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M10 6V10M10 13V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ソーシャルログインボタン */}
        <div className={styles.socialLogin}>
          <button 
            type="button"
            className={styles.socialButton}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.1713 8.36791H17.5001V8.33333H10.0001V11.6667H14.7096C14.0225 13.607 12.1763 15 10.0001 15C7.23882 15 5.00007 12.7613 5.00007 10C5.00007 7.23875 7.23882 5 10.0001 5C11.2747 5 12.4342 5.48084 13.3171 6.26625L15.6742 3.90917C14.1859 2.52209 12.1951 1.66667 10.0001 1.66667C5.39799 1.66667 1.66675 5.39792 1.66675 10C1.66675 14.6021 5.39799 18.3333 10.0001 18.3333C14.6022 18.3333 18.3334 14.6021 18.3334 10C18.3334 9.44125 18.2767 8.89583 18.1713 8.36791Z" fill="#FFC107"/>
              <path d="M2.6275 6.12125L5.36542 8.12917C6.10625 6.29501 7.90042 5 10.0004 5C11.275 5 12.4346 5.48084 13.3175 6.26625L15.6746 3.90917C14.1863 2.52209 12.1954 1.66667 10.0004 1.66667C6.79917 1.66667 4.02334 3.47376 2.6275 6.12125Z" fill="#FF3D00"/>
              <path d="M10.0004 18.3333C12.1529 18.3333 14.1092 17.5096 15.5871 16.17L13.0079 13.9875C12.1431 14.6452 11.0864 15.0009 10.0004 15C7.83253 15 5.99211 13.6179 5.29878 11.6892L2.58211 13.7829C3.96044 16.4817 6.76128 18.3333 10.0004 18.3333Z" fill="#4CAF50"/>
              <path d="M18.1713 8.36791H17.5001V8.33333H10.0001V11.6667H14.7096C14.3809 12.5902 13.7889 13.3972 13.0067 13.9879L13.0079 13.9871L15.5871 16.1696C15.4046 16.3354 18.3334 14.1667 18.3334 10C18.3334 9.44125 18.2767 8.89583 18.1713 8.36791Z" fill="#1976D2"/>
            </svg>
            Googleで続ける
          </button>

          <button 
            type="button"
            className={styles.socialButton}
            onClick={handleAppleLogin}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15.5 10.5c0-2.5 2-3.5 2.1-3.6-1.1-1.6-2.9-1.8-3.5-1.9-1.5-.1-2.9.9-3.6.9-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.2 9 .8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.4zM13 3.5c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/>
            </svg>
            Appleで続ける
          </button>
        </div>

        <div className={styles.divider}>
          <span>またはメールアドレスで</span>
        </div>

        {/* メールログインフォーム */}
        <form onSubmit={handleEmailSubmit} className={styles.formContainer}>
          {isRegisterMode && (
            <div className={styles.inputGroup}>
              <label htmlFor="username">ユーザー名</label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10ZM10 12C7.33 12 2 13.34 2 16V18H18V16C18 13.34 12.67 12 10 12Z" fill="#9CA3AF"/>
                </svg>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="山田太郎"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email">メールアドレス</label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 4H18V16H2V4ZM4 6L10 10L16 6" stroke="#9CA3AF" strokeWidth="1.5" fill="none"/>
              </svg>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@school.jp"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">パスワード</label>
            <div className={styles.inputWrapper}>
              <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="4" y="9" width="12" height="9" rx="2" stroke="#9CA3AF" strokeWidth="1.5" fill="none"/>
                <path d="M7 9V6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6V9" stroke="#9CA3AF" strokeWidth="1.5"/>
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                required
                minLength={6}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '処理中...' : (isRegisterMode ? 'アカウントを作成' : 'ログイン')}
          </button>
        </form>

        <div className={styles.toggleMode}>
          <button type="button" onClick={toggleMode} className={styles.toggleButton}>
            {isRegisterMode 
              ? 'すでにアカウントをお持ちの方はこちら' 
              : 'アカウントをお持ちでない方はこちら'}
          </button>
        </div>

        <div className={styles.footer}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C4.69 2 2 4.69 2 8C2 11.31 4.69 14 8 14C11.31 14 14 11.31 14 8C14 4.69 11.31 2 8 2ZM7 11V9H9V11H7ZM9 8H7V5H9V8Z" fill="currentColor"/>
          </svg>
          <p>Firebaseで安全に管理されています</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;