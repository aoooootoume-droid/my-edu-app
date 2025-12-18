import { useState, useEffect } from 'react';
import styles from './CalendarPage.module.css';
import { addNotice, addNotification } from '../firebase';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

function CalendarPage({ homeworks, tests, notices, onCardClick, currentUser, selectedClass }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject: '数学',
    noticeType: 'normal',
    showInCalendar: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 個人リマインダー
  const [reminders, setReminders] = useState([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderData, setReminderData] = useState({
    title: '',
    memo: ''
  });
  
  // 教科の色マッピング
  const subjectColors = {
    '国語': { bg: '#fce7f3', color: '#be185d', border: '#ec4899' },
    '数学': { bg: '#dbeafe', color: '#1e40af', border: '#3b82f6' },
    '英語': { bg: '#dcfce7', color: '#166534', border: '#22c55e' },
    '理科': { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' },
    '社会': { bg: '#f3e8ff', color: '#6b21a8', border: '#a855f7' },
    '音楽': { bg: '#ffe4e6', color: '#9f1239', border: '#f43f5e' },
    '美術': { bg: '#e0e7ff', color: '#3730a3', border: '#6366f1' },
    '保健体育': { bg: '#ccfbf1', color: '#115e59', border: '#14b8a6' },
    '技術': { bg: '#fef9c3', color: '#713f12', border: '#eab308' },
    '家庭': { bg: '#ffedd5', color: '#9a3412', border: '#f97316' },
  };
  
  // リマインダーをリアルタイムで取得
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReminders(data);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // 月の日数を取得
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  // 前月・次月に移動
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // 日付ごとのイベントを取得
  const getEventsForDate = (day) => {
    const dateStrSlash = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dateStrHyphen = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const matchesClass = (item) => {
      if (!selectedClass) return true;
      return item.className === selectedClass || !item.className;
    };
    
    // 宿題の締切
    const homeworkEvents = (homeworks || []).filter(hw => 
      (hw.deadline === dateStrSlash || hw.deadline === dateStrHyphen) && matchesClass(hw)
    ).map(hw => ({
      ...hw,
      type: 'homework'
    }));
    
    // テストデータ
    const testEvents = (tests || []).filter(test => 
      (test.date === dateStrSlash || test.date === dateStrHyphen) && matchesClass(test)
    );
    
    // お知らせ
    const noticeEvents = (notices || []).filter(notice => 
      notice.showInCalendar && 
      (notice.date === dateStrSlash || notice.date === dateStrHyphen) &&
      matchesClass(notice)
    );
    
    // 個人リマインダー
    const reminderEvents = reminders.filter(r =>
      r.date === dateStrSlash || r.date === dateStrHyphen
    ).map(r => ({
      ...r,
      type: 'reminder'
    }));
    
    return [...homeworkEvents, ...testEvents, ...noticeEvents, ...reminderEvents];
  };
  
  // 日付をクリック
  const handleDateClick = (day) => {
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    
    // 生徒はリマインダーのみ追加可能
    if (currentUser?.role === 'teacher') {
      setShowAddForm(true);
    } else {
      setShowReminderForm(true);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 教師用：予定追加
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('タイトルと内容を入力してください');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await addNotice({
        title: formData.title,
        content: formData.content,
        subject: formData.subject,
        noticeType: formData.noticeType,
        date: selectedDate,
        showInCalendar: formData.showInCalendar,
        createdBy: currentUser.uid,
        className: selectedClass
      });
      
      if (result.success) {
        await addNotification({
          type: 'notice',
          title: '新しい予定',
          message: `${selectedDate}に「${formData.title}」が追加されました`,
          linkType: 'notice',
          linkId: result.id,
          className: selectedClass
        });

        setShowAddForm(false);
        setFormData({
          title: '',
          content: '',
          subject: '数学',
          noticeType: 'normal',
          showInCalendar: true
        });
        alert('✅ 予定を追加しました！');
      } else {
        alert('予定の追加に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error('予定追加エラー:', error);
      alert('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // リマインダー追加
  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    
    if (!reminderData.title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'reminders'), {
        title: reminderData.title,
        memo: reminderData.memo,
        date: selectedDate,
        userId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      
      setShowReminderForm(false);
      setReminderData({ title: '', memo: '' });
      alert('✅ リマインダーを追加しました！');
    } catch (error) {
      console.error('リマインダー追加エラー:', error);
      alert('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // リマインダー削除
  const handleDeleteReminder = async (reminderId, e) => {
    e.stopPropagation();
    if (!window.confirm('このリマインダーを削除しますか？')) return;
    
    try {
      await deleteDoc(doc(db, 'reminders', reminderId));
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };
  
  // カレンダーの日付配列を生成
  const calendarDays = [];
  
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  const today = new Date();
  const isToday = (day) => {
    return day && 
           year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };
  
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  const isTeacher = currentUser?.role === 'teacher';
  
  // イベントのスタイルを取得
  const getEventStyle = (event) => {
    if (event.type === 'homework' && event.subject && subjectColors[event.subject]) {
      const colors = subjectColors[event.subject];
      return {
        background: colors.bg,
        color: colors.color,
        borderLeft: `3px solid ${colors.border}`
      };
    }
    return {};
  };
  
  return (
    <div className={styles.calendarContainer}>
      
      {/* ヘッダー */}
      <div className={styles.calendarHeader}>
        <button className={styles.todayButton} onClick={goToToday}>
          今日
        </button>
        <div className={styles.monthNavigation}>
          <button className={styles.navButton} onClick={goToPreviousMonth}>
            ◀
          </button>
          <h2 className={styles.currentMonth}>
            {year}年 {monthNames[month]}
          </h2>
          <button className={styles.navButton} onClick={goToNextMonth}>
            ▶
          </button>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.homework}`}></span>
            宿題
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.test}`}></span>
            テスト
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.notice}`}></span>
            お知らせ
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.reminder}`}></span>
            マイリマインダー
          </span>
        </div>
      </div>
      
      <div className={styles.teacherInfo}>
        💡 日付をクリックして{isTeacher ? '予定やリマインダー' : 'リマインダー'}を追加できます
      </div>
      
      {/* カレンダー本体 */}
      <div className={styles.calendar}>
        
        {/* 曜日ヘッダー */}
        <div className={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <div 
              key={day} 
              className={`${styles.weekDay} ${index === 0 ? styles.sunday : ''} ${index === 6 ? styles.saturday : ''}`}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* 日付グリッド */}
        <div className={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            const events = day ? getEventsForDate(day) : [];
            const isTodayDate = isToday(day);
            
            return (
              <div 
                key={index} 
                className={`${styles.dayCell} ${!day ? styles.emptyCell : ''} ${isTodayDate ? styles.today : ''} ${day ? styles.clickable : ''}`}
                onClick={() => day && handleDateClick(day)}
              >
                {day && (
                  <>
                    <div className={styles.dayNumber}>{day}</div>
                    <div className={styles.eventsContainer}>
                      {events.slice(0, 3).map(event => (
                        <div 
                          key={event.id} 
                          className={`${styles.event} ${styles[event.type]}`}
                          style={getEventStyle(event)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.type === 'reminder') {
                              return;
                            }
                            onCardClick && onCardClick(event.id);
                          }}
                          title={event.title}
                        >
                          {event.type === 'homework' && event.subject && (
                            <span className={styles.subjectTag}>{event.subject.slice(0, 2)}</span>
                          )}
                          <span className={styles.eventTitle}>{event.title}</span>
                          {event.type === 'reminder' && (
                            <button 
                              className={styles.deleteReminderBtn}
                              onClick={(e) => handleDeleteReminder(event.id, e)}
                              title="削除"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className={styles.moreEvents}>
                          +{events.length - 3}件
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 教師用：予定追加フォーム */}
      {showAddForm && (
        <div className={styles.modal} onClick={() => setShowAddForm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📅 予定を追加 - {selectedDate}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalTabs}>
              <button 
                className={`${styles.modalTab} ${styles.active}`}
                onClick={() => {}}
              >
                クラス予定
              </button>
              <button 
                className={styles.modalTab}
                onClick={() => {
                  setShowAddForm(false);
                  setShowReminderForm(true);
                }}
              >
                マイリマインダー
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.addForm}>
              <div className={styles.formGroup}>
                <label htmlFor="title">タイトル *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="例: 期末テスト"
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
                  placeholder="詳細を入力..."
                  rows={4}
                  className={styles.textarea}
                  required
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="subject">教科</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="数学">数学</option>
                    <option value="英語">英語</option>
                    <option value="国語">国語</option>
                    <option value="理科">理科</option>
                    <option value="社会">社会</option>
                  </select>
                </div>
                
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
        </div>
      )}
      
      {/* リマインダー追加フォーム */}
      {showReminderForm && (
        <div className={styles.modal} onClick={() => setShowReminderForm(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🔔 マイリマインダー - {selectedDate}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowReminderForm(false)}
              >
                ✕
              </button>
            </div>
            
            {isTeacher && (
              <div className={styles.modalTabs}>
                <button 
                  className={styles.modalTab}
                  onClick={() => {
                    setShowReminderForm(false);
                    setShowAddForm(true);
                  }}
                >
                  クラス予定
                </button>
                <button 
                  className={`${styles.modalTab} ${styles.active}`}
                  onClick={() => {}}
                >
                  マイリマインダー
                </button>
              </div>
            )}
            
            <div className={styles.reminderInfo}>
              ※ この予定はあなただけに表示されます
            </div>
            
            <form onSubmit={handleReminderSubmit} className={styles.addForm}>
              <div className={styles.formGroup}>
                <label htmlFor="reminderTitle">タイトル *</label>
                <input
                  id="reminderTitle"
                  type="text"
                  value={reminderData.title}
                  onChange={(e) => setReminderData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例: 数学の復習"
                  className={styles.input}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="reminderMemo">メモ</label>
                <textarea
                  id="reminderMemo"
                  value={reminderData.memo}
                  onChange={(e) => setReminderData(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder="詳細メモ（任意）..."
                  rows={3}
                  className={styles.textarea}
                />
              </div>
              
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? '追加中...' : 'リマインダーを追加'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* 今月の予定リスト */}
      <div className={styles.upcomingEvents}>
        <h3>📅 今月の予定</h3>
        <div className={styles.eventsList}>
          {Array.from({ length: daysInMonth }, (_, i) => i + 1)
            .map(day => ({ day, events: getEventsForDate(day) }))
            .filter(item => item.events.length > 0)
            .sort((a, b) => a.day - b.day)
            .map(({ day, events }) => (
              <div key={day} className={styles.upcomingDate}>
                <div className={styles.dateLabel}>
                  {month + 1}月{day}日
                </div>
                <div className={styles.dateEvents}>
                  {events.map(event => (
                    <div 
                      key={event.id} 
                      className={`${styles.upcomingEvent} ${styles[event.type]}`}
                      style={event.type === 'homework' && event.subject && subjectColors[event.subject] ? {
                        background: `linear-gradient(to right, ${subjectColors[event.subject].bg} 0%, white 50%)`,
                        borderLeftColor: subjectColors[event.subject].border
                      } : {}}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (event.type === 'reminder') return;
                        onCardClick && onCardClick(event.id);
                      }}
                    >
                      <span className={styles.eventIcon}>
                        {event.type === 'homework' ? '📝' : event.type === 'test' ? '📖' : event.type === 'reminder' ? '🔔' : '📢'}
                      </span>
                      <div className={styles.upcomingEventInfo}>
                        <div className={styles.upcomingEventTitle}>{event.title}</div>
                        {event.subject && (
                          <span 
                            className={styles.subjectBadge}
                            style={subjectColors[event.subject] ? {
                              background: subjectColors[event.subject].bg,
                              color: subjectColors[event.subject].color,
                              border: `1px solid ${subjectColors[event.subject].border}`
                            } : {}}
                          >
                            {event.subject}
                          </span>
                        )}
                        {event.type === 'reminder' && event.memo && (
                          <div className={styles.reminderMemo}>{event.memo}</div>
                        )}
                      </div>
                      {event.type === 'reminder' && (
                        <button 
                          className={styles.deleteBtn}
                          onClick={(e) => handleDeleteReminder(event.id, e)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1)
            .filter(day => getEventsForDate(day).length > 0).length === 0 && (
            <div className={styles.noEvents}>
              <span className={styles.noEventsIcon}>📭</span>
              <p>今月の予定はありません</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

export default CalendarPage;