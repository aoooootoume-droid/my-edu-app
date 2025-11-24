import styles from './NoticePage.module.css';

function NoticePage({ filterSubject, notices, onCardClick }) {
  
  // デバッグ用
  console.log('NoticePage - filterSubject:', filterSubject);
  console.log('NoticePage - notices:', notices);
  
  // propsからお知らせデータを受け取る
  const allNotices = notices || [];

  // 教科でフィルタリング
  const filteredNotices = filterSubject 
    ? allNotices.filter(notice => notice.subject === filterSubject)
    : allNotices;

  // 日付順にソート (新しい順)
  const sortedNotices = [...filteredNotices].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const getNoticeTypeLabel = (noticeType) => {
    switch(noticeType) {
      case 'important': return '重要';
      case 'normal': return '通常';
      case 'info': return 'お知らせ';
      default: return '';
    }
  };

  const getNoticeTypeClass = (noticeType) => {
    switch(noticeType) {
      case 'important': return styles.typeImportant;
      case 'normal': return styles.typeNormal;
      case 'info': return styles.typeInfo;
      default: return '';
    }
  };

  return (
    <div className={styles.noticeContainer}>
      
      <div className={styles.noticeHeader}>
        <h3>📢 お知らせ</h3>
        <span className={styles.noticeCount}>{sortedNotices.length}件</span>
      </div>

      <div className={styles.noticeList}>
        {sortedNotices.length > 0 ? (
          sortedNotices.map(notice => (
            <div 
              key={notice.id} 
              className={`${styles.noticeItem} ${getNoticeTypeClass(notice.noticeType)}`}
              onClick={() => onCardClick && onCardClick(notice.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.noticeItemHeader}>
                <span className={`${styles.noticeType} ${getNoticeTypeClass(notice.noticeType)}`}>
                  {getNoticeTypeLabel(notice.noticeType)}
                </span>
                <span className={styles.noticeDate}>{notice.date}</span>
              </div>
              <p className={styles.noticeTitle}>{notice.title}</p>
              {filterSubject === null && (
                <span className={styles.noticeSubject}>{notice.subject}</span>
              )}
            </div>
          ))
        ) : (
          <div className={styles.noNoticeMessage}>
            <span className={styles.noNoticeIcon}>📭</span>
            <p>現在、お知らせはありません</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoticePage;