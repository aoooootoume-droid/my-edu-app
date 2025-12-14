import { useState } from 'react';
import styles from './CalendarPage.module.css';
import { addNotice, addNotification } from '../firebase';

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
    // 両方の形式に対応（スラッシュとハイフン）
    const dateStrSlash = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dateStrHyphen = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // クラスでフィルタリングする関数
    const matchesClass = (item) => {
      if (!selectedClass) return true; // クラス未選択なら全部表示
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
    
    // お知らせ（カレンダー表示がONのもの）
    const noticeEvents = (notices || []).filter(notice => 
      notice.showInCalendar && 
      (notice.date === dateStrSlash || notice.date === dateStrHyphen) &&
      matchesClass(notice)
    );
    
    return [...homeworkEvents, ...testEvents, ...noticeEvents];
  };
  
  // 日付をクリックして予定追加
  const handleDateClick = (day) => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setFormData(prev => ({
      ...prev,
      title: '',
      content: ''
    }));
    setShowAddForm(true);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
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
        // 通知も作成
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
  
  // カレンダーの日付配列を生成
  const calendarDays = [];
  
  // 前月の空白
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // 今月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  // 今日の日付
  const today = new Date();
  const isToday = (day) => {
    return day && 
           year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };
  
  // 曜日
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // 月の名前
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  
  const isTeacher = currentUser?.role === 'teacher';
  
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
        </div>
      </div>
      
      {isTeacher && (
        <div className={styles.teacherInfo}>
          💡 日付をクリックして予定を追加できます
        </div>
      )}
      
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
                className={`${styles.dayCell} ${!day ? styles.emptyCell : ''} ${isTodayDate ? styles.today : ''} ${isTeacher && day ? styles.clickable : ''}`}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onCardClick && onCardClick(event.id);
                          }}
                          title={event.title}
                        >
                          <span className={styles.eventDot}></span>
                          <span className={styles.eventTitle}>{event.title}</span>
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
      
      {/* 予定追加フォーム */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick && onCardClick(event.id);
                      }}
                    >
                      <span className={styles.eventIcon}>
                        {event.type === 'homework' ? '📝' : event.type === 'test' ? '📖' : '📢'}
                      </span>
                      <div className={styles.upcomingEventInfo}>
                        <div className={styles.upcomingEventTitle}>{event.title}</div>
                        {event.subject && (
                          <div className={styles.upcomingEventSubject}>{event.subject}</div>
                        )}
                      </div>
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