import { useState } from 'react';
import styles from './LoginPage.module.css';
import { loginUser, registerUser, loginWithGoogle, loginWithApple } from '../firebase';

function LoginPage({ onLogin }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
    suggestions: []
  });

  // パスワード強度を計算
  const calculatePasswordStrength = (pass) => {
    if (!pass) {
      return { score: 0, label: '', color: '', suggestions: [] };
    }

    let score = 0;
    const suggestions = [];

    // 長さチェック
    if (pass.length >= 8) {
      score += 25;
    } else {
      suggestions.push('8文字以上にしてください');
    }

    // 大文字チェック
    if (/[A-Z]/.test(pass)) {
      score += 25;
    } else {
      suggestions.push('大文字を含めてください');
    }

    // 小文字チェック
    if (/[a-z]/.test(pass)) {
      score += 25;
    } else {
      suggestions.push('小文字を含めてください');
    }

    // 数字チェック
    if (/[0-9]/.test(pass)) {
      score += 15;
    } else {
      suggestions.push('数字を含めてください');
    }

    // 特殊文字チェック
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      score += 10;
    } else {
      suggestions.push('記号を含めるとより安全です');
    }

    // スコアに応じてラベルと色を決定
    let label, color;
    if (score < 25) {
      label = '弱い';
      color = '#ef4444';
    } else if (score < 50) {
      label = '普通';
      color = '#f59e0b';
    } else if (score < 75) {
      label = '良い';
      color = '#3b82f6';
    } else {
      label = '強い';
      color = '#10b981';
    }

    return { score, label, color, suggestions };
  };

  // 許可するメールドメインの設定
  const allowedDomains = [
    'school.jp',
    'school.ed.jp',
    'edu.jp',
    'gmail.com',
    'yahoo.co.jp',
  ];
  
  const allowAllDomains = true;

  const validateEmail = (emailValue) => {
    if (!emailValue) {
      setEmailError('メールアドレスを入力してください');
      return false;
    }
    
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
      setEmailError('正しいメールアドレスの形式で入力してください');
      return false;
    }
    
    if ((emailValue.match(/@/g) || []).length !== 1) {
      setEmailError('＠は1つだけ使用できます');
      return false;
    }
    
    const domain = emailValue.split('@')[1];
    
    if (!domain || domain.length === 0) {
      setEmailError('ドメイン名を入力してください（例: @school.jp）');
      return false;
    }
    
    if (!domain.includes('.')) {
      setEmailError('有効なドメイン名を入力してください（例: school.jp）');
      return false;
    }
    
    if (domain.includes('..') || emailValue.includes('..')) {
      setEmailError('連続したドット(..)は使用できません');
      return false;
    }
    
    if (!allowAllDomains) {
      const isAllowedDomain = allowedDomains.some(allowedDomain => 
        domain.toLowerCase() === allowedDomain.toLowerCase() ||
        domain.toLowerCase().endsWith('.' + allowedDomain.toLowerCase())
      );
      
      if (!isAllowedDomain) {
        setEmailError(`許可されたドメインを使用してください（例: ${allowedDomains.slice(0, 2).join(', ')}）`);
        return false;
      }
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !value.includes('@')) {
      setEmailError('＠を含めてください');
    } else if (value && value.includes('@')) {
      const parts = value.split('@');
      if (parts[1] && !parts[1].includes('.')) {
        setEmailError('ドメインに . を含めてください（例: school.jp）');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (email) {
      validateEmail(email);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // 新規登録モードの時のみパスワード強度を計算
    if (isRegisterMode) {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(email)) {
      return;
    }

    // 新規登録時はパスワード強度もチェック
    if (isRegisterMode && passwordStrength.score < 25) {
      setError('パスワードが弱すぎます。より強いパスワードを設定してください');
      return;
    }
    
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!username.trim()) {
          setError('ユーザー名を入力してください');
          setLoading(false);
          return;
        }

        const result = await registerUser(email, password, username, role);
        
        if (result.success) {
          onLogin(result.user);
        } else {
          setError(result.error || '登録に失敗しました');
        }
      } else {
        const result = await loginUser(email, password);
        
        if (result.success) {
          onLogin(result.user);
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

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setEmail('');
    setPassword('');
    setUsername('');
    setShowPassword(false);
    setEmailError('');
    setPasswordStrength({ score: 0, label: '', color: '', suggestions: [] });
  };

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const result = await loginWithGoogle(role);
      
      if (result.success) {
        onLogin(result.user);
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
      const result = await loginWithApple(role);
      
      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.error || 'Appleログインに失敗しました');
      }
    } catch (err) {
      setError('エラーが発生しました');
      console.error(err);
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* ロゴエリア */}
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
        
        <div className={styles.formContainer} onSubmit={handleSubmit}>
          {isRegisterMode && (
            <>
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
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="role">役割</label>
                <div className={styles.roleSelector}>
                  <button
                    type="button"
                    className={`${styles.roleButton} ${role === 'student' ? styles.roleActive : ''}`}
                    onClick={() => setRole('student')}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2L2 7L10 12L18 7L10 2Z" fill="currentColor" opacity="0.8"/>
                      <path d="M2 13L10 18L18 13" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    生徒
                  </button>
                  <button
                    type="button"
                    className={`${styles.roleButton} ${role === 'teacher' ? styles.roleActive : ''}`}
                    onClick={() => setRole('teacher')}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 4H17V6H3V4ZM3 8H17V10H3V8ZM3 12H13V14H3V12Z" fill="currentColor"/>
                      <circle cx="15.5" cy="13.5" r="2.5" fill="currentColor" opacity="0.6"/>
                    </svg>
                    教師
                  </button>
                </div>
              </div>
            </>
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
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="example@school.jp"
                required
                autoComplete="email"
                className={emailError ? styles.inputError : ''}
              />
            </div>
            {emailError && (
              <div className={styles.fieldError}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M8 4V8M8 10V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>{emailError}</span>
              </div>
            )}
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
                onChange={handlePasswordChange}
                placeholder="6文字以上"
                required
                minLength={6}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M2 2L18 18M8.88 8.88C8.33 9.43 8 10.17 8 11C8 12.66 9.34 14 11 14C11.83 14 12.57 13.67 13.12 13.12M6.61 6.61C4.62 7.96 3.07 9.88 2.46 11.25C2.19 11.84 2.19 12.52 2.46 13.11C3.5 15.5 6.79 19 11 19C12.55 19 13.93 18.55 15.15 17.85M10.5 5.04C10.66 5.01 10.83 5 11 5C15.21 5 18.5 8.5 19.54 10.89C19.81 11.48 19.81 12.16 19.54 12.75C19.09 13.77 18.38 14.89 17.48 15.88" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 7C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7ZM10 15C6.69 15 3.79 12.87 2.73 10C3.79 7.13 6.69 5 10 5C13.31 5 16.21 7.13 17.27 10C16.21 12.87 13.31 15 10 15Z" fill="#9CA3AF"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* パスワード強度インジケーター（新規登録時のみ） */}
            {isRegisterMode && password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div 
                    className={styles.strengthProgress}
                    style={{ 
                      width: `${passwordStrength.score}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  />
                </div>
                <div className={styles.strengthLabel} style={{ color: passwordStrength.color }}>
                  パスワード強度: {passwordStrength.label}
                </div>
                {passwordStrength.suggestions.length > 0 && (
                  <div className={styles.strengthSuggestions}>
                    {passwordStrength.suggestions.map((suggestion, index) => (
                      <div key={index} className={styles.suggestion}>
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <svg className={styles.spinner} width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="25" />
                </svg>
                処理中...
              </>
            ) : (
              <>
                {isRegisterMode ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM13 11H11V13C11 13.55 10.55 14 10 14C9.45 14 9 13.55 9 13V11H7C6.45 11 6 10.55 6 10C6 9.45 6.45 9 7 9H9V7C9 6.45 9.45 6 10 6C10.55 6 11 6.45 11 7V9H13C13.55 9 14 9.45 14 10C14 10.55 13.55 11 13 11Z" fill="currentColor"/>
                    </svg>
                    アカウントを作成
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2L8 4H5C3.9 4 3 4.9 3 6V16C3 17.1 3.9 18 5 18H15C16.1 18 17 17.1 17 16V6C17 4.9 16.1 4 15 4H12L10 2Z" fill="currentColor" opacity="0.8"/>
                      <path d="M7 10L9 12L13 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    ログイン
                  </>
                )}
              </>
            )}
          </button>
        </div>

        <div className={styles.divider}>
          <span>または</span>
        </div>

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