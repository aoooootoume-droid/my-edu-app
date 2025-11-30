import styles from './SubjectPage.module.css';
import NoticePage from './NoticePage';
import ArchivePage from './ArchivePage'; 
import HomeworkPage from './HomeworkPage'; 
import PrintPage from './PrintPage'; 
import QnaPage from './QnaPage'; 

function SubjectPage({ 
  subject, onCardClick, searchTerm, 
  folders, prints, homeworks, qnaItems, notices,
  activeTab, onTabClick, onAddQuestion, currentUser
}) {
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'notice':
        return <NoticePage 
                  filterSubject={subject} 
                  notices={notices} 
                  onCardClick={onCardClick} 
                  currentUser={currentUser}
                />;
        
      case 'archive':
        return <ArchivePage 
                  filterSubject={subject} 
                  onCardClick={onCardClick} 
                  searchTerm={searchTerm} 
                  folders={folders}
                />;
                
      case 'qbox':
        return <QnaPage 
                  filterSubject={subject} 
                  searchTerm={searchTerm} 
                  qnaItems={qnaItems}
                  onCardClick={onCardClick} 
                  onAddQuestion={onAddQuestion}
                />;
      
      case 'homework':
        return <HomeworkPage 
                  filterSubject={subject} 
                  searchTerm={searchTerm} 
                  homeworks={homeworks}
                  onCardClick={onCardClick}
                />;
      
      case 'print':
        return <PrintPage 
                  filterSubject={subject} 
                  searchTerm={searchTerm} 
                  onCardClick={onCardClick} 
                  prints={prints}
                />;
      default:
        return null;
    }
  };

  const getTabClass = (tabName) => {
    return `${styles.tab} ${activeTab === tabName ? styles.active : ''}`;
  };

  return (
    <div className={styles.subjectContainer}>
      <h2 className={styles.subjectTitle}>{subject}</h2>
      
      <nav className={styles.tabNav}>
        <div className={getTabClass('notice')} onClick={() => onTabClick('notice')}>
          お知らせ
        </div>
        <div className={getTabClass('archive')} onClick={() => onTabClick('archive')}>
          アーカイブ
        </div>
        <div className={getTabClass('qbox')} onClick={() => onTabClick('qbox')}>
          質問箱
        </div>
        <div className={getTabClass('homework')} onClick={() => onTabClick('homework')}>
          宿題
        </div>
        <div className={getTabClass('print')} onClick={() => onTabClick('print')}>
          プリント
        </div>
      </nav>
      
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>
    </div>
  );
}

export default SubjectPage;