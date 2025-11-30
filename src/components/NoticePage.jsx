import { useState } from 'react';
import styles from './NoticePage.module.css';
import { addNotice } from '../firebase';

function NoticePage({ filterSubject, notices, onCardClick, currentUser }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    noticeType: 'normal',
    date: new Date().toISOString().split('T')[0],
    showInCalendar: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const filteredNotices = filterSubject 
    ? notices.filter(notice => notice.subject === filterSubject)
    : notices;

  const isTeacher = currentUser?.role === 'teacher';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setSubmitError('タイトルと内容を入力してください');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await addNotice({
        title: formData.title,
        content: formData.content,
        subject: filterSubject,
        noticeType: formData.noticeType,
        date: formData.date,
        showInCalendar: formData.showInCalendar,
        createdBy: currentUser.uid
      });

      if (result.success) {
        // フォームをリセット
        setFormData({
          title: '',
          content: '',
          noticeType: 'normal',
          date: new Date().toISOString().split('T')[0],
          showInCalendar: false
        });
        setShowCreateForm(false);
        alert('✅ お知らせを作成しました！');
      } else {
        setSubmitError(result.error || 'お知らせの作成に失敗しました');
      }
    } catch (error) {
      console.error('お知らせ作成エラー:', error);
      setSubmitError('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className={styles.noticeContainer}>
      
      {/* 教員専用：新規作成ボタン */}
      {isTeacher && (
        <div className={styles.createButtonWrapper}>
          <button 
            className={styles.createButton}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✕ キャンセル' : '➕ 新規お知らせを作成'}
          </button>
        </div>
      )}

      {/* 作成フォーム */}
      {isTeacher && showCreateForm && (
        <div className={styles.createForm}>
          <h3 className={styles.formTitle}>📢 新しいお知らせを作成</h3>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="title">タイトル *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="例: 次回テストのお知らせ"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">内容 *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="お知らせの詳細を入力してください..."
                rows={5}
                className={styles.textarea}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="noticeType">種類</label>
                <select
                  id="noticeType"
                  name="noticeType"
                  value={formData.noticeType}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="normal">通常</option>
                  <option value="important">重要</option>
                  <option value="info">お知らせ</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="date">日付</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="showInCalendar"
                  checked={formData.showInCalendar}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                <span>カレンダーにも表示する</span>
              </label>
            </div>

            {submitError && (
              <div className={styles.errorMessage}>
                ⚠️ {submitError}
              </div>
            )}

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? '作成中...' : '作成する'}
            </button>
          </form>
        </div>
      )}

      {/* お知らせ一覧 */}
      <div className={styles.noticeList}>
        {filteredNotices.length > 0 ? (
          filteredNotices.map(notice => (
            <div 
              key={notice.id} 
              className={styles.noticeCard}
              onClick={() => onCardClick(notice.id)}
            >
              <div className={styles.noticeHeader}>
                <span className={`${styles.noticeBadge} ${getNoticeTypeClass(notice.noticeType)}`}>
                  {getNoticeTypeLabel(notice.noticeType)}
                </span>
                <span className={styles.noticeDate}>{notice.date}</span>
              </div>
              <h4 className={styles.noticeTitle}>{notice.title}</h4>
              <p className={styles.noticeContent}>
                {notice.content.length > 100 
                  ? notice.content.substring(0, 100) + '...' 
                  : notice.content}
              </p>
              {notice.showInCalendar && (
                <div className={styles.calendarBadge}>
                  📅 カレンダー表示
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={styles.noData}>
            <p>📭 お知らせはまだありません</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoticePage;