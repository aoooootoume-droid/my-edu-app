import styles from './FolderCard.module.css';

function FolderCard({ title, date, onClick, imageUrl }) {
  return (
    <div className={styles.cardContainer} onClick={onClick}>
      
      {/* img タグでサムネイル画像を表示 */}
      <img 
        src={imageUrl} 
        alt={title} 
        className={styles.thumbnailImage} 
      />
      
      <div className={styles.cardInfo}>
        <h4 className={styles.cardTitle}>{title}</h4>
        <p className={styles.cardDate}>{date}</p>
      </div>
    </div>
  );
}

export default FolderCard;