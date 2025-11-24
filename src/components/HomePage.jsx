import FolderCard from './FolderCard';
import styles from './HomePage.module.css';
import { mainSubjects } from '../data.js';

function HomePage({ onCardClick, searchTerm, folders, prints, qnaItems, liveSessions, notices }) {
  
  const subjects = mainSubjects;
  const term = searchTerm.toLowerCase();

  const getFoldersBySubject = (subject) => {
    return folders
      .filter(folder => folder.subject === subject)
      .filter(folder => folder.title.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  };
  
  const getPrintsBySubject = (subject) => {
    if (!term) return [];
    return prints
      .filter(print => (print.subject === subject && print.title.toLowerCase().includes(term)))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10); 
  };
  
  const getQnaBySubject = (subject) => {
    if (!term) return [];
    return qnaItems
      .filter(qna => (qna.subject === subject && qna.title.toLowerCase().includes(term)))
      .sort((a, b) => (a.status === 'unanswered' && b.status === 'answered') ? -1 : 1) 
      .slice(0, 5); 
  };
  
  const liveNowSessions = liveSessions.filter(session => session.status === 'live');
  
  const getSubjectTagClass = (subject) => {
    switch(subject) {
      case '数学': return styles.tagMath;
      case '英語': return styles.tagEnglish;
      case '国語': return styles.tagJapanese;
      case '理科': return styles.tagScience;
      case '社会': return styles.tagSocial;
      default: return styles.tagDefault;
    }
  };

  return (
    <div className={styles.homeContainer}>
      <h2>
        {searchTerm ? `「${searchTerm}」の検索結果 (ホーム)` : 'ホーム'}
      </h2>
      
      {/* Live配信中セクション (改善版) */}
      <section className={styles.liveSection}>
        <div className={styles.liveSectionHeader}>
          <h3 className={styles.liveSectionTitle}>
            <span className={styles.liveIndicator}>🔴</span>
            Live配信中
          </h3>
          {liveNowSessions.length > 0 && (
            <span className={styles.liveCount}>{liveNowSessions.length}件配信中</span>
          )}
        </div>
        
        {liveNowSessions.length > 0 ? (
          <div className={styles.liveGrid}>
            {liveNowSessions.map(item => (
              <div 
                key={item.id} 
                className={styles.liveCard}
                onClick={() => onCardClick(item.id)}
              >
                <div className={styles.liveCardHeader}>
                  <span className={`${styles.subjectBadge} ${getSubjectTagClass(item.subject)}`}>
                    {item.subject}
                  </span>
                  <span className={styles.liveBadge}>
                    <span className={styles.livePulse}></span>
                    LIVE
                  </span>
                </div>
                <h4 className={styles.liveCardTitle}>{item.title}</h4>
                <div className={styles.liveCardFooter}>
                  <span className={styles.viewersCount}>👥 配信中</span>
                  <button className={styles.joinButton}>参加する →</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noLiveCard}>
            <span className={styles.noLiveIcon}>📺</span>
            <p className={styles.noLiveText}>現在、配信中のLiveはありません</p>
            <p className={styles.noLiveSubtext}>配信が開始されると、ここに表示されます</p>
          </div>
        )}
      </section>
      
      {!searchTerm && (
        <h3 className={styles.archiveTitle}>最近のアーカイブ</h3>
      )}
      
      <>
        {subjects.map(subject => {
          const foundFolders = getFoldersBySubject(subject);
          const foundPrints = getPrintsBySubject(subject); 
          const foundQna = getQnaBySubject(subject); 

          if (foundFolders.length === 0 && foundPrints.length === 0 && foundQna.length === 0) return null; 

          return (
            <section className={styles.subjectRow} key={subject}>
              
              <h3 className={styles.subjectTitle}>{subject}</h3>
              
              {foundFolders.length > 0 && (
                <>
                  {searchTerm && <h4 className={styles.archiveSubTitle}>アーカイブ</h4>}
                  
                  <div className={styles.cardScroller}>
                    {foundFolders.map(folder => (
                      <FolderCard
                        key={folder.id} 
                        title={folder.title} 
                        date={folder.date}
                        imageUrl={folder.imageUrl}
                        onClick={() => onCardClick(folder.id)}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {foundPrints.length > 0 && (
                <>
                  <h4 className={styles.printSubTitle}>プリント</h4>
                  <div className={styles.cardScroller}>
                    {foundPrints.map(print => (
                      <FolderCard
                        key={print.id} 
                        title={print.title} 
                        date={print.date}
                        imageUrl={print.imageUrl}
                        onClick={() => onCardClick(print.id)}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {foundQna.length > 0 && (
                <>
                  <h4 className={styles.qnaSubTitle}>質問箱</h4>
                  <ul className={styles.qnaList}>
                    {foundQna.map(qna => (
                      <li key={qna.id} className={styles.qnaItem} onClick={() => onCardClick(qna.id)}>
                        <span className={`${styles.qnaStatus} ${
                          qna.status === 'answered' ? styles.statusAnswered : styles.statusUnanswered
                        }`}>
                          {qna.status === 'answered' ? '回答済み' : '未回答'}
                        </span>
                        <p className={styles.qnaTitle}>{qna.title}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              
              {searchTerm && foundFolders.length === 0 && foundPrints.length === 0 && foundQna.length === 0 && (
                <p className={styles.noDataMessage}>（この教科には一致するものがありません）</p>
              )}
              
            </section>
          );
        })}
      </>
    </div>
  );
}

export default HomePage;