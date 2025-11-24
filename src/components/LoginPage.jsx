import { useState } from 'react';
import styles from './LoginPage.module.css';
import { loginUser, registerUser } from '../firebase';

function LoginPage({ onLogin }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('student'); // 'student' or 'teacher'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        // 新規登録
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
        // ログイン
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
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>
          {isRegisterMode ? '新規登録' : 'ログイン'}
        </h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {isRegisterMode && (
            <>
              <div className={styles.inputGroup}>
                <label>ユーザー名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="山田太郎"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>役割</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className={styles.select}
                >
                  <option value="student">生徒</option>
                  <option value="teacher">教師</option>
                </select>
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <label>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@school.jp"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '処理中...' : (isRegisterMode ? '登録' : 'ログイン')}
          </button>
        </form>

        <div className={styles.toggleMode}>
          <button onClick={toggleMode} className={styles.toggleButton}>
            {isRegisterMode 
              ? 'すでにアカウントをお持ちの方はこちら' 
              : '新規登録はこちら'}
          </button>
        </div>

        <div className={styles.demoInfo}>
          <p>🔒 Firebaseで安全に管理されています</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;