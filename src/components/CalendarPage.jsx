import { useState } from 'react';
import styles from './CalendarPage.module.css';

function CalendarPage({ homeworks, tests, onCardClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // デバッグ用
  console.log('📅 CalendarPage homeworks:', homeworks);
  console.log('📅 CalendarPage tests:', tests);
  
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
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    
    // デバッグ用 (最初の数日だけ)
    if (day <= 3) {
      console.log(`📅 ${dateStr} を探しています`);
    }
    
    // 宿題の締切
    const homeworkEvents = (homeworks || []).filter(hw => {
      const match = hw.deadline === dateStr;
      if (match) console.log(`✅ 宿題が見つかりました:`, hw);
      return match;
    }).map(hw => ({
      ...hw,
      type: 'homework'
    }));
    
    // テストデータ
    const testEvents = (tests || []).filter(test => {
      const match = test.date === dateStr;
      if (match) console.log(`✅ テストが見つかりました:`, test);
      return match;
    });
    
    return [...homeworkEvents, ...testEvents];
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
        </div>
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
                className={`${styles.dayCell} ${!day ? styles.emptyCell : ''} ${isTodayDate ? styles.today : ''}`}
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
                            console.log('📅 クリックしたイベント:', event);
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
                        {event.type === 'homework' ? '📝' : '📖'}
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