import { useState } from 'react';
import styles from './HomeworkPage.module.css';

function HomeworkPage({ filterSubject, searchTerm = '', homeworks, onCardClick }) {

  const term = searchTerm.toLowerCase();
  const [submittedHomeworks, setSubmittedHomeworks] = useState(new Set());
  
  // 締切が近い順
  const filteredHomeworks = homeworks
    .filter(hw => {
      const subjectMatch = filterSubject ? hw.subject === filterSubject : true;
      const titleMatch = hw.title.toLowerCase().includes(term);
      return subjectMatch && titleMatch;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // 宿題カードをクリックして詳細ページへ
  const handleCardClick = (homework) => {
    // homeworkにtypeを追加して詳細ページで識別できるようにする
    const homeworkWithType = {
      ...homework,
      type: 'homework'
    };
    onCardClick(homework.id);
  };

  // 提出ボタンのハンドラ（後で削除してもOK）
  const handleSubmit = (e, homeworkId, homeworkTitle) => {
    e.stopPropagation(); // カードクリックイベントを止める
    if (window.confirm(`「${homeworkTitle}」を提出しますか?`)) {
      setSubmittedHomeworks(prev => new Set([...prev, homeworkId]));
      alert('✅ 提出完了しました!');
    }
  };

  // 提出済みかどうかをチェック
  const isSubmitted = (homeworkId) => {
    return submittedHomeworks.has(homeworkId);
  };

  return (
    <div className={styles.homeworkContainer}> 
      
      {filterSubject && searchTerm && (
        <p className={styles.searchResult}>
          「{searchTerm}」の検索結果:
        </p>
      )}

      <div className={styles.listContainer}>
        {filteredHomeworks.length > 0 ? (
          filteredHomeworks.map(hw => {
            const submitted = isSubmitted(hw.id);
            
            return (
              <div 
                key={hw.id} 
                className={`${styles.homeworkItem} ${submitted ? styles.submitted : ''}`}
                onClick={() => handleCardClick(hw)}
              >
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>
                    {submitted && '✅ '}
                    {hw.title}
                  </span>
                  <span className={styles.itemDeadline}>
                    締切: {hw.deadline}
                  </span>
                  <span className={styles.itemSubject}>
                    {hw.subject}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <span className={styles.viewDetail}>
                    詳細を見る →
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className={styles.noDataMessage}>
            {searchTerm 
              ? `「${searchTerm}」に一致する宿題はありません。` 
              : 'この教科の宿題はありません。'
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default HomeworkPage;