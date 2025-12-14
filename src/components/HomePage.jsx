import FolderCard from './FolderCard';
import styles from './HomePage.module.css';
import { mainSubjects } from '../data.js';
import { seedDatabase, clearDatabase } from '../seedData';

function HomePage({ onCardClick, searchTerm, folders, prints, qnaItems, notices, selectedClass }) {
  
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

  // ダミーデータ投入
  const handleSeedData = async () => {
    if (window.confirm('ダミーデータをFirestoreに投入しますか？')) {
      const result = await seedDatabase();
      if (result.success) {
        alert('✅ ダミーデータの投入が完了しました！\nページをリロードします。');
        window.location.reload();
      } else {
        alert('❌ エラー: ' + result.error);
      }
    }
  };

  // データ削除
  const handleClearData = async () => {
    if (window.confirm('⚠️ 本当に全データを削除しますか？\nこの操作は取り消せません。')) {
      const result = await clearDatabase();
      if (result.success) {
        alert('✅ 全データの削除が完了しました！\nページをリロードします。');
        window.location.reload();
      } else {
        alert('❌ エラー: ' + result.error);
      }
    }
  };

  return (
    <div className={styles.homeContainer}>
      <h2>
        {searchTerm ? `「${searchTerm}」の検索結果 (ホーム)` : 'ホーム'}
        {selectedClass && <span className={styles.classLabel}> - {selectedClass}</span>}
      </h2>
      
      {/* データ管理ボタン（開発用） */}
      <div className={styles.devButtons}>
        <button onClick={handleClearData} className={styles.clearButton}>
          🗑️ データ削除
        </button>
        <button onClick={handleSeedData} className={styles.seedButton}>
          📥 ダミーデータ投入
        </button>
      </div>
      
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
                        subject={folder.subject}
                        className={!selectedClass ? folder.className : null}
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
                        subject={print.subject}
                        className={!selectedClass ? print.className : null}
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
                        {!selectedClass && qna.className && (
                          <span className={styles.qnaClass}>{qna.className}</span>
                        )}
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