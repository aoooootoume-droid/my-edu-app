import styles from './Sidebar.module.css';
import { House, Camera, CalendarBlank, Users, ClipboardText } from "@phosphor-icons/react"; 
import { mainSubjects, subSubjects } from '../data.js';

// 全教科を一つの配列に結合
const allSubjectNames = [...mainSubjects, ...subSubjects];

// 描画用のリストを作成
const subjectList = allSubjectNames.map(name => ({
  name: name
}));

function Sidebar({ activeViewType, activeSubject, onNavClick, onSubjectClick, currentUser }) {
  
  const getNavClass = (viewType) => {
    return `${styles.navItem} ${activeViewType === viewType ? styles.active : ''}`;
  };

  const getSubjectClass = (subjectName) => {
    return `${styles.subjectItem} ${activeViewType === 'subject' && activeSubject === subjectName ? styles.active : ''}`;
  };

  // グループページもアクティブに
  const isGroupActive = activeViewType === 'groups' || activeViewType === 'groupDetail';

  // 教員かどうかをチェック
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <aside className={styles.sidebarContainer}>
      
      {/* メインナビゲーション */}
      <nav className={styles.navSection}>
        <div className={getNavClass('home')} onClick={() => onNavClick('home')}>
          <House size={22} weight="fill" />
          <span>ホーム</span>
        </div>
        <div className={getNavClass('calendar')} onClick={() => onNavClick('calendar')}>
          <CalendarBlank size={22} weight="fill" />
          <span>カレンダー</span>
        </div>
        <div className={getNavClass('camera')} onClick={() => onNavClick('camera')}>
          <Camera size={22} weight="fill" />
          <span>カメラ</span>
        </div>
        <div className={`${styles.navItem} ${isGroupActive ? styles.active : ''}`} onClick={() => onNavClick('groups')}>
          <Users size={22} weight="fill" />
          <span>グループ</span>
        </div>
        
        {/* 教員専用：提出物管理 */}
        {isTeacher && (
          <div className={getNavClass('submissions')} onClick={() => onNavClick('submissions')}>
            <ClipboardText size={22} weight="fill" />
            <span>提出物管理</span>
          </div>
        )}
      </nav>
      
      {/* 教科 */}
      <div className={styles.subjectSection}>
        {subjectList.map(subject => (
          <div 
            key={subject.name} 
            className={getSubjectClass(subject.name)} 
            onClick={() => onSubjectClick(subject.name)}
          >
            <span>{subject.name}</span>
          </div>
        ))}
      </div>
      
    </aside>
  );
}

export default Sidebar;