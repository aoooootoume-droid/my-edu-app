import { useState } from 'react';
import styles from './HomeworkPage.module.css';
import { addHomework, addNotification } from '../firebase';
import HomeworkDetailPage from './HomeworkDetailPage';

function HomeworkPage({ filterSubject, searchTerm = '', homeworks, onCardClick, onAddHomework, currentUser, selectedClass }) {

  const term = searchTerm.toLowerCase();
  const [submittedHomeworks, setSubmittedHomeworks] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    deadline: '',
    description: ''
  });
  
  const isTeacher = currentUser?.role === 'teacher';

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
    setSelectedHomework(homework);
  };

  // 詳細ページから戻る
  const handleBackFromDetail = () => {
    setSelectedHomework(null);
  };

  // 提出ボタンのハンドラ
  const handleSubmit = (e, homeworkId, homeworkTitle) => {
    e.stopPropagation();
    if (window.confirm(`「${homeworkTitle}」を提出しますか?`)) {
      setSubmittedHomeworks(prev => new Set([...prev, homeworkId]));
      alert('✅ 提出完了しました!');
    }
  };

  // 提出済みかどうかをチェック
  const isSubmitted = (homeworkId) => {
    return submittedHomeworks.has(homeworkId);
  };

  // フォーム入力ハンドラ
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 宿題追加
  const handleAddHomework = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.deadline) {
      alert('タイトルと締切日を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addHomework({
        title: formData.title.trim(),
        subject: filterSubject,
        deadline: formData.deadline,
        description: formData.description.trim(),
        className: selectedClass,
        createdBy: currentUser?.uid
      });

      if (result.success) {
        // 通知を作成
        await addNotification({
          type: 'homework',
          title: '新しい宿題',
          message: `${filterSubject}「${formData.title}」締切: ${formData.deadline}`,
          linkType: 'homework',
          linkId: result.id,
          className: selectedClass
        });

        setFormData({ title: '', deadline: '', description: '' });
        setShowAddForm(false);
        alert('✅ 宿題を追加しました！');
      } else {
        alert('宿題の追加に失敗しました');
      }
    } catch (error) {
      console.error('宿題追加エラー:', error);
      alert('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 詳細ページを表示中
  if (selectedHomework) {
    return (
      <HomeworkDetailPage
        homeworkId={selectedHomework.id}
        currentUser={currentUser}
        onBack={handleBackFromDetail}
      />
    );
  }

  return (
    <div className={styles.homeworkContainer}> 
      
      {/* 教員用：宿題追加ボタン */}
      {isTeacher && (
        <div className={styles.addButtonWrapper}>
          <button 
            className={styles.addButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ キャンセル' : '➕ 宿題を追加'}
          </button>
        </div>
      )}

      {/* 宿題追加フォーム */}
      {isTeacher && showAddForm && (
        <div className={styles.addForm}>
          <h3 className={styles.formTitle}>📝 新しい宿題を追加</h3>
          
          <form onSubmit={handleAddHomework}>
            <div className={styles.formGroup}>
              <label htmlFor="title">タイトル *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="例: 教科書P.50-52の問題"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="deadline">締切日 *</label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">説明</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="宿題の詳細を入力..."
                rows={3}
                className={styles.textarea}
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? '追加中...' : '追加する'}
            </button>
          </form>
        </div>
      )}

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