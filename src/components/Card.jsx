import styles from './Card.module.css';
import { Folder, Printer, Exam, Question, Broadcast, CheckCircle } from '@phosphor-icons/react';

// カードの種類に応じてアイコンを返すヘルパー関数
const getIcon = (type) => {
  switch (type) {
    case 'folder':
      return <Folder size={24} weight="fill" />;
    case 'print':
      return <Printer size={24} weight="fill" />;
    case 'homework':
      return <Exam size={24} weight="fill" />;
    case 'qna':
      return <Question size={24} weight="fill" />;
    case 'live':
      return <Broadcast size={24} weight="fill" />;
    default:
      return null;
  }
};

// ステータスに応じてスタイルを返すヘルパー関数
const getStatusClass = (status) => {
  switch (status) {
    case 'pending':
      return styles.statusPending; // 未提出
    case 'submitted':
      return styles.statusSubmitted; // 提出済み
    case 'answered':
      return styles.statusAnswered; // 回答済み
    case 'unanswered':
      return styles.statusUnanswered; // 未回答
    default:
      return '';
  }
};

// ライブセッションの日付をフォーマット
const formatLiveDate = (dateString) => {
  try {
    const date = new Date(dateString);
    // 例: 6月19日 20:00
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
};

function Card({ card, onClick }) {
  
  // 'folder' または 'print' の場合 (サムネイル付き)
  if (card.type === 'folder' || card.type === 'print') {
    const cardStyle = card.type === 'print' ? styles.printCard : styles.folderCard;
    return (
      <button className={`${styles.cardBase} ${cardStyle}`} onClick={() => onClick(card.id)}>
        <div className={styles.thumbnail}>
          <img 
            src={card.thumbnail} 
            alt={card.title} 
            className={styles.thumbnailImage}
            // 画像読み込みエラー時のフォールバック
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = "https://placehold.co/240x135/cccccc/ffffff?text=Error";
            }}
          />
        </div>
        <div className={styles.info}>
          <h3 className={styles.title}>{card.title}</h3>
          <span className={styles.subject}>{card.subject}</span>
          <span className={styles.date}>{card.date}</span>
        </div>
      </button>
    );
  }

  // 'homework', 'qna', 'live' の場合 (サムネイルなし)
  const isLive = card.type === 'live';
  
  return (
    <button className={`${styles.cardBase} ${styles.infoCard}`} onClick={() => onClick(card.id)}>
      <div className={styles.infoIcon}>
        {getIcon(card.type)}
      </div>
      <div className={styles.infoContent}>
        <h3 className={styles.title}>{card.title}</h3>
        <span className={styles.subject}>{card.subject}</span>
        <span className={styles.date}>
          {isLive ? formatLiveDate(card.date) : card.date}
        </span>
      </div>
      {/* ステータス表示 (homework または qna のみ) */}
      {(card.type === 'homework' || card.type === 'qna') && (
        <div className={`${styles.status} ${getStatusClass(card.status)}`}>
          {card.status === 'submitted' || card.status === 'answered' ? <CheckCircle size={16} weight="fill" /> : null}
          {card.status === 'pending' && '未提出'}
          {card.status === 'submitted' && '提出済'}
          {card.status === 'answered' && '回答済'}
          {card.status === 'unanswered' && '未回答'}
        </div>
      )}
    </button>
  );
}

export default Card;