import { useState } from 'react';
import styles from './Header.module.css';
import NotificationDropdown from './NotificationDropdown';

function Header({
  onProfileClick, searchTerm, onSearchChange,
  onLogout, currentUser,
  suggestions, onSuggestionClick,
  notifications, onNotificationClick, onMarkAllAsRead,
  isMobileMenuOpen, onMobileMenuToggle
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
        {/* ハンバーガーメニューボタン（スマホのみ表示） */}
        <button
          className={`${styles.hamburgerButton} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}
          onClick={onMobileMenuToggle}
          aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>

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
              aria-label="検索"
              aria-autocomplete="list"
              aria-expanded={isSuggestionsVisible && suggestions.length > 0}
              role="combobox"
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.searchClearButton}
                onClick={handleClearSearch}
                aria-label="検索をクリア"
              >
                &times;
              </button>
            )}
            
            {isSuggestionsVisible && suggestions.length > 0 && (
              <ul className={styles.suggestionsList} role="listbox">
                {suggestions.map((title, index) => (
                  <li
                    key={index}
                    className={styles.suggestionItem}
                    onMouseDown={() => handleSuggestionClick(title)}
                    role="option"
                    tabIndex={-1}
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
            <button
              type="button"
              className={styles.notificationBell}
              onClick={() => setIsNotificationVisible(!isNotificationVisible)}
              aria-label={`通知 ${unreadCount > 0 ? `${unreadCount}件の未読` : ''}`}
              aria-expanded={isNotificationVisible}
              aria-haspopup="true"
            >
              🔔
              {unreadCount > 0 && (
                <span className={styles.notificationBadge} aria-hidden="true">{unreadCount}</span>
              )}
            </button>
            
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
            <button
              type="button"
              className={styles.userIcon}
              onClick={() => setIsProfileMenuVisible(!isProfileMenuVisible)}
              aria-label="ユーザーメニュー"
              aria-expanded={isProfileMenuVisible}
              aria-haspopup="menu"
            >
              👤
            </button>

            {isProfileMenuVisible && (
              <div className={styles.profileMenu} role="menu">

                <div className={styles.menuHeader}>
                  ログイン中:
                  <span className={styles.userName}>
                    {currentUser?.username || currentUser?.email || 'ユーザー'}
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.menuItem}
                  onMouseDown={handleProfileItemClick}
                  role="menuitem"
                >
                  プロフィール
                </button>
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                  onMouseDown={handleLogoutItemClick}
                  role="menuitem"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  );
}

export default Header;