import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

function Sidebar({ activeViewType, activeSubject, onNavClick, onSubjectClick, onClassChange, currentUser }) {
  
  // クラス選択の状態管理
  const [selectedClass, setSelectedClass] = useState(null);
  
  // クラス一覧
  const classes = [
    '1年A組', '1年B組', '1年C組', '1年D組',
    '2年A組', '2年B組', '2年C組', '2年D組',
    '3年A組', '3年B組', '3年C組', '3年D組',
    '特進1組', '特進2組', '国際科', '理数科'
  ];
  
  // 教科一覧（主要5教科 + 副教科）
  const subjects = [
    '国語',
    '数学',
    '英語',
    '理科',
    '社会',
    '音楽',
    '美術',
    '保健体育',
    '技術',
    '家庭',
  ];
  
  // クラス選択時の処理
  const handleClassSelect = (className) => {
    setSelectedClass(className);
    // 親コンポーネントにクラス変更を通知
    if (onClassChange) {
      onClassChange(className);
    }
    // クラス選択時にホーム画面にリセット
    onNavClick('home');
  };
  
  // 戻るボタンの処理
  const handleBackToClassList = () => {
    setSelectedClass(null);
    // 親コンポーネントにクラス解除を通知
    if (onClassChange) {
      onClassChange(null);
    }
    // クラス選択画面に戻るときもホームにリセット
    onNavClick('home');
  };
  
  return (
    <div className={styles.sidebarContainer}>
      
      {/* ===== レイヤー1: クラス選択画面 ===== */}
      {!selectedClass && (
        <div className={styles.classSelectLayer}>
          <h2 className={styles.layerTitle}>クラス選択</h2>
          
          <div className={styles.classList}>
            {classes.map(className => (
              <button
                key={className}
                className={styles.classButton}
                onClick={() => handleClassSelect(className)}
              >
                {className}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* ===== レイヤー2: メインメニュー ===== */}
      {selectedClass && (
        <div className={styles.menuLayer}>
          {/* 戻るボタン + 選択中のクラス表示 */}
          <div className={styles.menuHeader}>
            <div className={styles.classHeader}>
              <button 
                className={styles.backButton}
                onClick={handleBackToClassList}
                title="クラス選択に戻る"
              >
                ◀
              </button>
              <div className={styles.selectedClassBadge}>
                <span>{selectedClass}</span>
              </div>
            </div>
          </div>
          
          {/* メインメニュー */}
          <nav className={styles.nav}>
            <button 
              className={activeViewType === 'home' ? styles.active : ''}
              onClick={() => onNavClick('home')}
            >
              ホーム
            </button>
            
            <button 
              className={activeViewType === 'archive' ? styles.active : ''}
              onClick={() => onNavClick('archive')}
            >
              アーカイブ
            </button>
            
            <button 
              className={activeViewType === 'calendar' ? styles.active : ''}
              onClick={() => onNavClick('calendar')}
            >
              カレンダー
            </button>
            
            <button 
              className={activeViewType === 'camera' ? styles.active : ''}
              onClick={() => onNavClick('camera')}
            >
              カメラ
            </button>

            <button 
              className={activeViewType === 'groups' ? styles.active : ''}
              onClick={() => onNavClick('groups')}
            >
              グループ
            </button>

            <button 
              className={activeViewType === 'submissions' ? styles.active : ''}
              onClick={() => onNavClick('submissions')}
            >
              課題提出
            </button>

            <button 
              className={activeViewType === 'recording' ? styles.active : ''}
              onClick={() => onNavClick('recording')}
            >
              授業録画
            </button>
          </nav>

          {/* 教科一覧セクション */}
          <div className={styles.subjectSection}>
            <h3 className={styles.subjectTitle}>教科一覧</h3>
            <div className={styles.subjectList}>
              {subjects.map(subject => (
                <button
                  key={subject}
                  className={activeSubject === subject ? styles.activeSubject : ''}
                  onClick={() => {
                    console.log('教科クリック:', subject);
                    console.log('onSubjectClick:', onSubjectClick);
                    onSubjectClick(subject);
                  }}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>


        </div>
      )}
    </div>
  );
}

export default Sidebar;