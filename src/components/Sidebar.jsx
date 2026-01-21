import React, { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

function Sidebar({ activeViewType, activeSubject, onNavClick, onSubjectClick, onClassChange, currentUser }) {
  
  // 教師かどうか判定
  const isTeacher = currentUser?.role === 'teacher';
  
  // Firebaseから取得するデータ
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // クラス選択の状態管理
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Firebaseからクラスと教科を取得
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.schoolCode) {
        setLoading(false);
        return;
      }
      
      try {
        // クラス取得
        const classesQuery = query(
          collection(db, 'classes'), 
          where('schoolCode', '==', currentUser.schoolCode)
        );
        const classesSnap = await getDocs(classesQuery);
        const classesList = classesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // 学年・組順にソート
        classesList.sort((a, b) => {
          if (a.grade !== b.grade) return a.grade - b.grade;
          return a.className.localeCompare(b.className);
        });
        setClasses(classesList);
        
        // 教科取得
        const subjectsQuery = query(
          collection(db, 'subjects'), 
          where('schoolCode', '==', currentUser.schoolCode)
        );
        const subjectsSnap = await getDocs(subjectsQuery);
        const subjectsList = subjectsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        subjectsList.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
        setSubjects(subjectsList);
        
      } catch (err) {
        console.error('サイドバーデータ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser?.schoolCode]);
  
  // 生徒の場合、自分のクラスを初期選択
  useEffect(() => {
    if (!isTeacher && currentUser?.className) {
      setSelectedClass(currentUser.className);
      if (onClassChange) {
        onClassChange(currentUser.className);
      }
    }
  }, [isTeacher, currentUser?.className]);
  
  // クラス選択時の処理（メニューは閉じない）
  const handleClassSelect = (cls) => {
    setSelectedClass(cls.displayName);
    if (onClassChange) {
      onClassChange(cls.displayName);
    }
    // onNavClickは呼ばない（メニューを閉じないようにするため）
  };
  
  // 戻るボタンの処理（教師のみ使用、メニューは閉じない）
  const handleBackToClassList = () => {
    setSelectedClass(null);
    if (onClassChange) {
      onClassChange(null);
    }
    // onNavClickは呼ばない（メニューを閉じないようにするため）
  };
  
  // ローディング中
  if (loading) {
    return (
      <div className={styles.sidebarContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }
  
  return (
    <div className={styles.sidebarContainer}>
      
      {/* ===== レイヤー1: クラス選択画面（教師のみ） ===== */}
      {isTeacher && !selectedClass && (
        <div className={styles.classSelectLayer}>
          <h2 className={styles.layerTitle}>クラス選択</h2>
          
          {classes.length === 0 ? (
            <div className={styles.emptyMessage}>
              クラスが登録されていません
            </div>
          ) : (
            <div className={styles.classList}>
              {classes.map(cls => (
                <button
                  key={cls.id}
                  className={styles.classButton}
                  onClick={() => handleClassSelect(cls)}
                >
                  {cls.displayName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* ===== レイヤー2: メインメニュー ===== */}
      {(selectedClass || !isTeacher) && (
        <div className={styles.menuLayer}>
          {/* 戻るボタン + 選択中のクラス表示 */}
          <div className={styles.menuHeader}>
            <div className={styles.classHeader}>
              {isTeacher && (
                <button 
                  className={styles.backButton}
                  onClick={handleBackToClassList}
                  title="クラス選択に戻る"
                >
                  ◀
                </button>
              )}
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
              className={activeViewType === 'quiz' ? styles.active : ''}
              onClick={() => onNavClick('quiz')}
            >
              まとめノート
            </button>   
            
            {/* 授業録画は教師のみ表示 */}
            {isTeacher && (
              <button 
                className={activeViewType === 'recording' ? styles.active : ''}
                onClick={() => onNavClick('recording')}
              >
                授業録画
              </button>
            )}
          </nav>

          {/* 教科一覧セクション */}
          <div className={styles.subjectSection}>
            <h3 className={styles.subjectTitle}>教科一覧</h3>
            
            {subjects.length === 0 ? (
              <div className={styles.emptyMessage}>
                教科が登録されていません
              </div>
            ) : (
              <div className={styles.subjectList}>
                {subjects.map(subject => (
                  <button
                    key={subject.id}
                    className={activeSubject === subject.name ? styles.activeSubject : ''}
                    onClick={() => onSubjectClick(subject.name)}
                    style={{
                      borderLeft: `3px solid ${subject.color || '#667eea'}`
                    }}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;