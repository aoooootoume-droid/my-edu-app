import styles from './UserDropdown.module.css';

// ★ 1. Props に onLogoutClick があるか
function UserDropdown({ onProfileClick, onLogoutClick, currentUser }) {
  return (
    <div className={styles.dropdownContainer}>
      
      <div className={styles.userInfo}>
        <p>ログイン中:</p>
        <strong>{currentUser}</strong>
      </div>
      
      <ul className={styles.menuList}>
        <li 
          className={styles.menuItem} 
          onClick={onProfileClick}
        >
          プロフィール設定
        </li>
        <li className={styles.menuItem}>
          アカウント情報（未実装）
        </li>
        <li className={styles.menuItemSeparator}></li>
        
        {/* ★ 2. ここの onClick が正しく設定されているか */}
        <li 
          className={`${styles.menuItem} ${styles.logout}`}
          onClick={onLogoutClick} 
        >
          ログアウト
        </li>
      </ul>
      
    </div>
  );
}

export default UserDropdown;