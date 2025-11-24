import { useState } from 'react';
import styles from './QnaPage.module.css';

function QnaPage({ filterSubject, searchTerm = '', qnaItems, onCardClick, onAddQuestion }) {
  
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const term = searchTerm.toLowerCase();

  const filteredItems = qnaItems
    .filter(item => {
      const subjectMatch = filterSubject ? item.subject === filterSubject : true;
      const titleMatch = item.title.toLowerCase().includes(term);
      return subjectMatch && titleMatch;
    })
    // 未回答を上に
    .sort((a, b) => (a.status === 'unanswered' && b.status === 'answered') ? -1 : 1);

  const getStatusClass = (status) => {
    return status === 'answered' ? styles.statusAnswered : styles.statusUnanswered;
  };
  
  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (newQuestionTitle.trim() && filterSubject) {
      onAddQuestion(filterSubject, newQuestionTitle);
      setNewQuestionTitle(''); // 送信後フォームをクリア
    }
  };

  return (
    <div className={styles.qnaContainer}> 
      
      {/* --- 質問投稿フォーム --- */}
      <form className={styles.postForm} onSubmit={handleSubmitQuestion}>
        <h3 className={styles.formTitle}>「{filterSubject}」について質問する</h3>
        <textarea 
          className={styles.formTextarea}
          value={newQuestionTitle}
          onChange={(e) => setNewQuestionTitle(e.target.value)}
          placeholder="質問内容を入力してください..."
          rows={3}
        />
        <button 
          type="submit" 
          className={styles.formButton}
          disabled={!newQuestionTitle.trim()} // 空欄なら押せない
        >
          質問を投稿する
        </button>
      </form>
      
      {/* --- 検索結果表示 (あれば) --- */}
      {filterSubject && searchTerm && (
        <p className={styles.searchResult}>
          「{searchTerm}」の検索結果:
        </p>
      )}
      
      {/* --- 質問リスト --- */}
      <div className={styles.listContainer}>
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={styles.qnaItem}
              onClick={() => onCardClick(item.id)} // クリック対応
            >
              <span className={`${styles.itemStatus} ${getStatusClass(item.status)}`}>
                {item.status === 'answered' ? '回答済み' : '未回答'}
              </span>
              <p className={styles.itemTitle}>{item.title}</p>
            </div>
          ))
        ) : (
          <p className={styles.noDataMessage}>
            {searchTerm 
              ? `「${searchTerm}」に一致する質問はありません。` 
              : 'この教科の質問はまだありません。'
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default QnaPage;