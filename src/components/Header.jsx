import { useState } from 'react';
import styles from './Header.module.css';
import NotificationDropdown from './NotificationDropdown';

function Header({ 
  onProfileClick, searchTerm, onSearchChange, 
  onLogout, currentUser,
  suggestions, onSuggestionClick,
  notifications, onNotificationClick, onMarkAllAsRead
}) {
  
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  
  const handleSuggestionClick = (title) => {
    onSuggestionClick(title); 
    setIsSuggestionsVisible(false);
  };
  
  const handleClearSearch = () => {
    onSearchChange({ target: { value: '' } }); 
    setIsSuggestionsVisible(false);
  };

  const handleProfileItemClick = () => {
    onProfileClick();
    setIsProfileMenuVisible(false); 
  };
  
  const handleLogoutItemClick = () => {
    onLogout();
    setIsProfileMenuVisible(false); 
  };
  
  const handleNotificationClick = (notification) => {
    onNotificationClick && onNotificationClick(notification);
    setIsNotificationVisible(false);
  };
  
  const handleMarkAllAsRead = () => {
    onMarkAllAsRead && onMarkAllAsRead();
  };
  
  // 未読数を計算
  const unreadCount = notifications ? notifications.filter(n => !n.isRead).length : 0;
  
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContentWrapper}>
        <div className={styles.logoArea}>
          School App
        </div>
        
        <div className={styles.searchNavContainer}>
          <div className={styles.searchBarContainer}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="アーカイブ、プリント、質問を検索"
              className={styles.searchInput}
              value={searchTerm}
              onChange={onSearchChange}
              onFocus={() => setIsSuggestionsVisible(true)}
              onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200)}
            />
            {searchTerm && (
              <span 
                className={styles.searchClearButton} 
                onClick={handleClearSearch}
              >
                &times;
              </span>
            )}
            
            {isSuggestionsVisible && suggestions.length > 0 && (
              <ul className={styles.suggestionsList}>
                {suggestions.map((title, index) => (
                  <li 
                    key={index} 
                    className={styles.suggestionItem}
                    onMouseDown={() => handleSuggestionClick(title)}
                  >
                    {title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className={styles.userActions}>
          {/* 通知ベル */}
          <div 
            className={styles.notificationContainer}
            onBlur={() => setTimeout(() => setIsNotificationVisible(false), 200)}
          >
            <div 
              className={styles.notificationBell}
              onClick={() => setIsNotificationVisible(!isNotificationVisible)}
              tabIndex={0}
            >
              🔔
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>{unreadCount}</span>
              )}
            </div>
            
            {isNotificationVisible && (
              <NotificationDropdown 
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            )}
          </div>
          
          {/* ユーザーアイコン */}
          <div 
            className={styles.userIconContainer}
            onBlur={() => setTimeout(() => setIsProfileMenuVisible(false), 200)}
          >
            <div 
              className={styles.userIcon}
              onClick={() => setIsProfileMenuVisible(!isProfileMenuVisible)}
              tabIndex={0} 
            >
              👤
            </div>
            
            {isProfileMenuVisible && (
              <div className={styles.profileMenu}>
                
                <div className={styles.menuHeader}>
                  ログイン中:
                  <span className={styles.userName}>
                    {currentUser?.username || currentUser?.email || 'ユーザー'}
                  </span>
                </div>
                
                <div 
                  className={styles.menuItem}
                  onMouseDown={handleProfileItemClick} 
                >
                  プロフィール
                </div>
                <div 
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                  onMouseDown={handleLogoutItemClick}
                >
                  ログアウト
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  );
}

export default Header;