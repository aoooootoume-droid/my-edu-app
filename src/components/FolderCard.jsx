import styles from './FolderCard.module.css';

function FolderCard({ title, date, onClick, imageUrl, subject, className, isRecording }) {
  
  const getSubjectClass = (subj) => {
    switch(subj) {
      case '数学': return styles.tagMath;
      case '英語': return styles.tagEnglish;
      case '国語': return styles.tagJapanese;
      case '理科': return styles.tagScience;
      case '社会': return styles.tagSocial;
      default: return styles.tagDefault;
    }
  };

  return (
    <div className={styles.cardContainer} onClick={onClick}>
      
      {/* サムネイル画像 */}
      <div className={styles.thumbnailWrapper}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className={styles.thumbnailImage} 
          />
        ) : (
          <div className={styles.noImage}>
            {isRecording ? 'REC' : ''}
          </div>
        )}
        {subject && (
          <span className={`${styles.subjectBadge} ${getSubjectClass(subject)}`}>
            {subject}
          </span>
        )}
        {isRecording && (
          <span className={styles.recordingBadge}>録画</span>
        )}
      </div>
      
      <div className={styles.cardInfo}>
        <h4 className={styles.cardTitle}>{title}</h4>
        <div className={styles.cardMeta}>
          <p className={styles.cardDate}>{date}</p>
          {className && (
            <span className={styles.classBadge}>{className}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default FolderCard;