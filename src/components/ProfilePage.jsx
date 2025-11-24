import styles from './ProfilePage.module.css';
import { ArrowLeft } from "@phosphor-icons/react";

function ProfilePage({ onBackClick, currentUser }) {

  return (
    <div className={styles.profileContainer}>
      <button onClick={onBackClick} className={styles.backButton}>
        <ArrowLeft size={18} weight="bold" />
        <span>戻る</span>
      </button>
      
      <h2 className={styles.title}>プロフィール</h2>
      
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          👤
        </div>
        <h3 className={styles.userName}>
          {currentUser?.username || 'ユーザー'}
        </h3>
        <div className={styles.userDetails}>
          <p className={styles.userInfo}>
            <strong>メール:</strong> {currentUser?.email || '未設定'}
          </p>
          <p className={styles.userInfo}>
            <strong>役割:</strong> {currentUser?.role === 'teacher' ? '教師' : '生徒'}
          </p>
          <p className={styles.userInfo}>
            <strong>ユーザーID:</strong> {currentUser?.uid || '不明'}
          </p>
        </div>
        
        <button className={styles.editButton}>
          プロフィールを編集
        </button>
      </div>
      
    </div>
  );
}

export default ProfilePage;