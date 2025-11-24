import FolderCard from './FolderCard'; 
import styles from './ArchivePage.module.css';

function ArchivePage({ filterSubject, onCardClick, searchTerm, folders }) {
  
  const term = searchTerm.toLowerCase();

  const filteredFolders = folders
    .filter(folder => {
      // filterSubject があれば (教科別ページ)、その教科で絞り込む
      // filterSubject がなければ (全アーカイブ)、絞り込まない
      const subjectMatch = filterSubject ? folder.subject === filterSubject : true;
      const titleMatch = folder.title.toLowerCase().includes(term);
      return subjectMatch && titleMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className={styles.archiveContainer}> 
      
      {filterSubject && searchTerm && (
        <p className={styles.searchResult}>
          「{searchTerm}」の検索結果:
        </p>
      )}

      <div className={styles.cardGrid}>
        {filteredFolders.length > 0 ? (
          filteredFolders.map(folder => (
            <FolderCard 
              key={folder.id}
              title={folder.title}
              date={folder.date}
              imageUrl={folder.imageUrl}
              onClick={() => onCardClick(folder.id)}
            />
          ))
        ) : (
          <p className={styles.noDataMessage}>
            {searchTerm 
              ? `「${searchTerm}」に一致するアーカイブはありません。` 
              : 'アーカイブはまだありません。'
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default ArchivePage;