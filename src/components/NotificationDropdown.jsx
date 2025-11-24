import { useState } from 'react';
import styles from './NotificationDropdown.module.css';

function NotificationDropdown({ notifications, onNotificationClick, onMarkAllAsRead }) {
  
  // ダミーの通知データ (propsがない場合)
  const defaultNotifications = [
    { 
      id: 1, 
      type: 'archive', 
      title: '新しいアーカイブ', 
      message: '「数学」に新しいアーカイブが追加されました。', 
      time: '5分前',
      isRead: false
    },
    { 
      id: 2, 
      type: 'live', 
      title: 'Live配信開始', 
      message: '「英語」のLive機能が 5分後に開始します。', 
      time: '10分前',
      isRead: false
    },
    { 
      id: 3, 
      type: 'qna', 
      title: '質問に回答', 
      message: '「質問箱」に新しい回答がつきました。', 
      time: '1時間前',
      isRead: true
    },
    { 
      id: 4, 
      type: 'homework', 
      title: '宿題の締切', 
      message: '「三角関数 練習問題」の締切は明日です。', 
      time: '2時間前',
      isRead: false
    },
    { 
      id: 5, 
      type: 'notice', 
      title: '重要なお知らせ', 
      message: '次回テストは来週月曜日です。', 
      time: '3時間前',
      isRead: true
    },
  ];
  
  const notificationList = notifications || defaultNotifications;
  const unreadCount = notificationList.filter(n => !n.isRead).length;
  
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'archive': return '📁';
      case 'live': return '🔴';
      case 'qna': return '💬';
      case 'homework': return '📝';
      case 'notice': return '📢';
      default: return '📌';
    }
  };
  
  const getNotificationClass = (type) => {
    switch(type) {
      case 'archive': return styles.typeArchive;
      case 'live': return styles.typeLive;
      case 'qna': return styles.typeQna;
      case 'homework': return styles.typeHomework;
      case 'notice': return styles.typeNotice;
      default: return '';
    }
  };
  
  return (
    <div className={styles.dropdownContainer}>
      
      {/* ヘッダー */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h3>通知</h3>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount}件未読</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            className={styles.markAllButton}
            onClick={onMarkAllAsRead}
          >
            すべて既読
          </button>
        )}
      </div>
      
      {/* 通知リスト */}
      <ul className={styles.notificationList}>
        {notificationList.length > 0 ? (
          notificationList.map((item, index) => (
            <li 
              key={item.id} 
              className={`${styles.notificationItem} ${!item.isRead ? styles.unread : ''} ${getNotificationClass(item.type)}`}
              onClick={() => onNotificationClick && onNotificationClick(item)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={styles.notificationIcon}>
                {getNotificationIcon(item.type)}
              </div>
              <div className={styles.notificationContent}>
                <div className={styles.notificationTitle}>{item.title}</div>
                <div className={styles.notificationMessage}>{item.message}</div>
                <div className={styles.notificationTime}>{item.time}</div>
              </div>
              {!item.isRead && <div className={styles.unreadDot}></div>}
            </li>
          ))
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔔</span>
            <p>通知はありません</p>
          </div>
        )}
      </ul>
      
      {/* フッター */}
      {notificationList.length > 0 && (
        <div className={styles.footer}>
          <a className={styles.viewAllLink}>すべての通知を表示 →</a>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;