import FolderCard from './FolderCard'; 
import styles from './PrintPage.module.css';

function PrintPage({ filterSubject, searchTerm = '', onCardClick, prints }) {

  const term = searchTerm.toLowerCase();
  
  const filteredPrints = prints
    .filter(print => {
      const subjectMatch = filterSubject ? print.subject === filterSubject : true;
      const titleMatch = print.title.toLowerCase().includes(term);
      return subjectMatch && titleMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className={styles.printContainer}> 
      
      {filterSubject && searchTerm && (
        <p className={styles.searchResult}>
          「{searchTerm}」の検索結果:
        </p>
      )}

      <div className={styles.cardGrid}>
        {filteredPrints.length > 0 ? (
          filteredPrints.map(print => (
            <FolderCard 
              key={print.id}
              title={print.title}
              date={print.date}
              imageUrl={print.imageUrl}
              onClick={() => onCardClick(print.id)}
            />
          ))
        ) : (
          <p className={styles.noDataMessage}>
            {searchTerm 
              ? `「${searchTerm}」に一致するプリントはありません。` 
              : 'この教科のプリントはまだありません。'
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default PrintPage;