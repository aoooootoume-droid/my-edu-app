import styles from './LivePage.module.css';

function LivePage({ filterSubject, searchTerm = '', liveSessions, onCardClick }) {

  const term = searchTerm.toLowerCase();

  const filteredItems = liveSessions
    .filter(item => {
      const subjectMatch = filterSubject ? item.subject === filterSubject : true;
      const titleMatch = item.title.toLowerCase().includes(term);
      return subjectMatch && titleMatch;
    })
    // ステータスで並び替え (Live > Upcoming > Finished)
    .sort((a, b) => {
      const statusOrder = { 'live': 1, 'upcoming': 2, 'finished': 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

  const getStatusText = (item) => {
    if (item.status === 'live') return '🔴 配信中';
    if (item.status === 'upcoming') return `🔵 配信予定 (${item.date})`;
    if (item.status === 'finished') return `⚫ 配信終了`;
    return '';
  };
  
  const getStatusClass = (status) => {
    if (status === 'live') return styles.statusLive;
    if (status === 'upcoming') return styles.statusUpcoming;
    if (status === 'finished') return styles.statusFinished;
    return '';
  };

  return (
    <div className={styles.liveContainer}> 
      
      {filterSubject && searchTerm && (
        <p className={styles.searchResult}>
          「{searchTerm}」の検索結果:
        </p>
      )}

      <div className={styles.listContainer}>
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={styles.liveItem}
              onClick={() => onCardClick(item.id)} // クリック対応
            >
              <div className={styles.itemInfo}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={`${styles.itemStatus} ${getStatusClass(item.status)}`}>
                  {getStatusText(item)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noDataMessage}>
            {searchTerm 
              ? `「${searchTerm}」に一致するLive配信はありません。` 
              : 'この教科のLive配信はありません。'
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default LivePage;