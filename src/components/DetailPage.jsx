import styles from './DetailPage.module.css';
import { ArrowLeft } from "@phosphor-icons/react";

const renderCardContent = (card) => {
  if (card.type === 'folder' || card.type === 'print') {
    return (
      <>
        {card.imageUrl && (
          <img 
            src={card.imageUrl} 
            alt={card.title} 
            className={styles.detailImage} 
          />
        )}
        <div className={styles.content}>
          <h3>関連ファイル</h3>
          <p>（ここに添付ファイルや関連資料へのリンクが入ります）</p>
          <h3>授業メモ</h3>
          <p>（ここに {card.title} の授業メモや解説が入ります）</p>
        </div>
      </>
    );
  }
  
  if (card.type === 'qna') {
    return (
      <div className={styles.qnaContent}>
        <div className={styles.questionBox}>
          <h3>質問内容:</h3>
          <p>{card.title}（ここに詳細な質問内容が入ります）</p>
        </div>
        
        {card.status === 'answered' ? (
          <div className={styles.answerBox}>
            <h3>回答:</h3>
            <p>（ここに回答内容が入ります）</p>
          </div>
        ) : (
          <div className={styles.answerBox}>
            <p>（この質問はまだ回答されていません）</p>
          </div>
        )}
      </div>
    );
  }
  
  if (card.type === 'live') {
    return (
      <div className={styles.liveContent}>
        <div className={styles.liveStatusBox}>
          {card.status === 'live' && '🔴 配信中'}
          {card.status === 'upcoming' && `🔵 配信予定: ${card.date}`}
          {card.status === 'finished' && `⚫ 配信終了: ${card.date || ''}`}
        </div>
        <p>（ここにLive配信の動画やチャットが入ります）</p>
      </div>
    );
  }
  
  if (card.type === 'notice') {
    const getNoticeTypeLabel = (type) => {
      switch(type) {
        case 'important': return '重要';
        case 'normal': return '通常';
        case 'info': return 'お知らせ';
        default: return '';
      }
    };
    
    const getNoticeTypeClass = (type) => {
      switch(type) {
        case 'important': return styles.noticeImportant;
        case 'normal': return styles.noticeNormal;
        case 'info': return styles.noticeInfo;
        default: return '';
      }
    };
    
    return (
      <div className={styles.noticeContent}>
        <div className={`${styles.noticeBadge} ${getNoticeTypeClass(card.noticeType)}`}>
          {getNoticeTypeLabel(card.noticeType)}
        </div>
        <div className={styles.noticeBody}>
          <p>{card.content}</p>
        </div>
      </div>
    );
  }
  
  if (card.type === 'test') {
    return (
      <div className={styles.testContent}>
        <div className={styles.testBadge}>
          📖 テスト
        </div>
        <div className={styles.testBody}>
          <p>{card.content || 'テストの詳細情報がありません。'}</p>
        </div>
      </div>
    );
  }
  
  return <p>このコンテンツタイプの詳細は表示できません。</p>;
};

function DetailPage({ card, onBackClick }) {
  
  if (!card) {
    return (
      <div>
        <button onClick={onBackClick} className={styles.backButton}>
          <ArrowLeft size={18} weight="bold" />
          <span>戻る</span>
        </button>
        <h2>アイテムが見つかりません</h2>
        <p>データが見つかりませんでした。</p>
      </div>
    );
  }
  
  const renderMetaInfo = () => {
    if (card.date) {
      return <span>{card.date}</span>;
    }
    if (card.deadline) {
      return <span>締切: {card.deadline}</span>;
    }
    return null;
  };

  return (
    <div className={styles.detailContainer}>
      <button onClick={onBackClick} className={styles.backButton}>
        <ArrowLeft size={18} weight="bold" />
        <span>戻る</span>
      </button>
      
      <h2 className={styles.title}>{card.title}</h2>
      
      <div className={styles.metaInfo}>
        {card.subject && <span>{card.subject}</span>}
        {card.subject && renderMetaInfo() && <span className={styles.separator}>|</span>}
        {renderMetaInfo()}
      </div>
      
      {renderCardContent(card)}
      
    </div>
  );
}

export default DetailPage;