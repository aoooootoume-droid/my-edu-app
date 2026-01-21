import { useState, useEffect } from 'react';
import './App.css'
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ArchivePage from './components/ArchivePage';
import HomePage from './components/HomePage';
import DetailPage from './components/DetailPage'; 
import SubjectPage from './components/SubjectPage';
import ProfilePage from './components/ProfilePage'; 
import CameraPage from './components/CameraPage'; 
import LoginPage from './components/LoginPage';
import CalendarPage from './components/CalendarPage';
import SubmissionsPage from './components/SubmissionsPage';
import QuizPage from './components/QuizPage'; 

// ★ 録画機能のコンポーネントをインポート
import RecordingPage from './components/RecordingPage';

// グループ関連
import GroupPage from './components/GroupPage';
import GroupDetailPage from './components/GroupDetailPage';

// Firebase関数をインポート
import { 
  onAuthChange,
  logoutUser,
  onFoldersChange,
  onPrintsChange,
  onHomeworksChange,
  onQuestionsChange,
  onNoticesChange,
  onNotificationsChange,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  addPrint,
  addQuestion
} from './firebase';

// ダミーデータ投入スクリプト
import { seedDatabase, clearDatabase } from './seedData';

function App() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [folders, setFolders] = useState([]); 
  const [prints, setPrints] = useState([]); 
  const [homeworks, setHomeworks] = useState([]);
  const [qnaItems, setQnaItems] = useState([]);
  const [notices, setNotices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ★ 選択中のクラスを管理
  const [selectedClass, setSelectedClass] = useState(null);
  
  // テストのダミーデータ
  const [tests] = useState([
    { 
      id: 'test1', 
      type: 'test', 
      title: '数学テスト', 
      date: '2025/11/25', 
      subject: '数学',
      content: '三角関数の範囲からテストを実施します。教科書P50-80を復習しておいてください。'
    },
    { 
      id: 'test2', 
      type: 'test', 
      title: '英語テスト', 
      date: '2025/11/28', 
      subject: '英語',
      content: '不定詞と関係代名詞の範囲からテストを実施します。'
    },
  ]);
  
  const [activeView, setActiveView] = useState({
    type: 'home',
    subject: null,
    detailId: null,
    groupId: null,
    previousType: 'home',
    activeTab: 'notice'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // ★ スマホ用ハンバーガーメニューの開閉状態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ========================================
  // 🔥 Firebase リアルタイム監視
  // ========================================
  
  useEffect(() => {
  const unsubscribeAuth = onAuthChange(async (user) => {
    if (user) {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('./firebase/config');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists() && userDoc.data().schoolCode) {
          const userData = userDoc.data();
          // 先生はclassCodeなしでOK、生徒はclassCodeが必要
          if (userData.role === 'teacher' || userData.classCode) {
            setIsLoggedIn(true);
            setCurrentUser({
              ...user,
              role: userData.role,
              schoolCode: userData.schoolCode,
              schoolName: userData.schoolName,
              classCode: userData.classCode || null,
              className: userData.className || null
            });
            setLoading(false);
            return;
          }
        }
        // 条件を満たさない場合
        setIsLoggedIn(false);
        setCurrentUser(null);
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
      setLoading(false);
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setLoading(false);
    }
  });

  return () => unsubscribeAuth();
}, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubscribeFolders = onFoldersChange((data) => setFolders(data));
    const unsubscribePrints = onPrintsChange((data) => setPrints(data));
    const unsubscribeHomeworks = onHomeworksChange((data) => setHomeworks(data));
    const unsubscribeQna = onQuestionsChange((data) => setQnaItems(data));
    const unsubscribeNotices = onNoticesChange((data) => setNotices(data));
    const unsubscribeNotifications = onNotificationsChange((data) => setNotifications(data));

    return () => {
      unsubscribeFolders();
      unsubscribePrints();
      unsubscribeHomeworks();
      unsubscribeQna();
      unsubscribeNotices();
      unsubscribeNotifications();
    };
  }, [isLoggedIn]);
  
  // ========================================
  // 🎯 クラスでフィルタリングしたデータ
  // ========================================
  
  const filteredFolders = selectedClass 
    ? folders.filter(f => f.className === selectedClass || !f.className)
    : folders;
    
  const filteredPrints = selectedClass
    ? prints.filter(p => p.className === selectedClass || !p.className)
    : prints;
    
  const filteredHomeworks = selectedClass
    ? homeworks.filter(h => h.className === selectedClass || !h.className)
    : homeworks;
    
  const filteredQnaItems = selectedClass
    ? qnaItems.filter(q => q.className === selectedClass || !q.className)
    : qnaItems;
    
  const filteredNotices = selectedClass
    ? notices.filter(n => n.className === selectedClass || !n.className)
    : notices;

  const filteredNotifications = selectedClass
    ? notifications.filter(n => n.className === selectedClass || !n.className)
    : notifications;
  
  const allClickableItems = [...filteredFolders, ...filteredPrints, ...filteredQnaItems, ...filteredHomeworks, ...filteredNotices, ...tests];
  
  console.log('🔍 selectedClass:', selectedClass);
  console.log('🔍 allClickableItems:', allClickableItems.map(item => ({ id: item.id, type: item.type, title: item.title, className: item.className })));
  
  
  // ========================================
  // 📌 イベントハンドラ
  // ========================================
  
  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user); 
    setActiveView({ type: 'home', subject: null, detailId: null, groupId: null, previousType: 'home', activeTab: 'notice' });
    setSearchTerm('');
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setCurrentUser(null); 
  };
  
  // ★ クラス変更ハンドラ
  const handleClassChange = (className) => {
    setSelectedClass(className);
    console.log('クラス変更:', className);
  };

  const handleAddItem = async (item) => {
    try {
      const result = await addPrint({
        title: item.title,
        subject: item.subject,
        date: item.date || new Date().toISOString().split('T')[0],
        imageUrl: item.imageUrl || 'https://picsum.photos/240/135?random=' + Date.now(),
        className: selectedClass // ★ 選択中のクラスを追加
      });

      if (result.success) {
        console.log('プリント追加成功:', result.id);
        setActiveView(prevView => ({ 
          ...prevView, 
          type: 'subject', 
          subject: item.subject, 
          detailId: null, 
          activeTab: 'print', 
          previousType: 'camera' 
        }));
      }
    } catch (error) {
      console.error('プリント追加エラー:', error);
    }
  };
  
  const handleAddQuestion = async (subject, title) => {
    try {
      const result = await addQuestion({
        subject: subject,
        title: title,
        className: selectedClass // ★ 選択中のクラスを追加
      });

      if (result.success) {
        console.log('質問追加成功:', result.id);
      }
    } catch (error) {
      console.error('質問追加エラー:', error);
    }
  };

  const handleNavClick = (viewType) => {
    setActiveView(prevView => ({ 
      ...prevView, 
      type: viewType, 
      subject: null, 
      detailId: null,
      groupId: null,
      previousType: prevView.type, 
      activeTab: 'notice'
    }));
  };

  const handleSubjectClick = (subject) => {
    setActiveView(prevView => ({ 
      ...prevView, 
      type: 'subject', 
      subject: subject, 
      detailId: null,
      groupId: null,
      activeTab: 'notice',
      previousType: prevView.type 
    }));
  };

  const handleTabClick = (tabName) => {
    setActiveView(prevView => ({ ...prevView, activeTab: tabName }));
  };

  const handleCardClick = (cardId) => {
    setActiveView(prevView => ({ 
      ...prevView, 
      type: 'detail', 
      detailId: cardId, 
      previousType: prevView.type === 'detail' ? prevView.previousType : prevView.type 
    }));
  };

  const handleProfileClick = () => {
    setActiveView(prevView => ({ 
      ...prevView, 
      type: 'profile', 
      previousType: prevView.type === 'profile' ? prevView.previousType : prevView.type 
    }));
  };

  const handleGroupClick = (groupId) => {
    setActiveView(prevView => ({
      ...prevView,
      type: 'groupDetail',
      groupId: groupId,
      previousType: prevView.type === 'groupDetail' ? prevView.previousType : prevView.type
    }));
  };

  const handleBackClick = () => {
    setActiveView(prevView => ({ 
      ...prevView, 
      type: prevView.previousType, 
      detailId: null,
      groupId: null
    }));
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleSuggestionClick = (title) => {
    setSearchTerm(title);
  };

  // ★ モバイルメニューの開閉
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // ★ メニュー項目クリック時にメニューを閉じる
  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };
  
  // ★ Firebase通知をクリック
  const handleNotificationClick = async (notification) => {
    // Firebaseで既読にする
    await markNotificationAsRead(notification.id);
    
    if (notification.linkId) {
      handleCardClick(notification.linkId);
    }
  };
  
  // ★ 全通知を既読に（Firebase）
  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };
  
  const handleSeedData = async () => {
    if (window.confirm('ダミーデータをFirestoreに投入しますか?')) {
      const result = await seedDatabase();
      if (result.success) {
        alert('✅ ダミーデータの投入が完了しました!');
      } else {
        alert('❌ エラー: ' + result.error);
      }
    }
  };
  
  // ★ データ削除ハンドラ
  const handleClearData = async () => {
    if (window.confirm('⚠️ 本当に全データを削除しますか？\nこの操作は取り消せません。')) {
      const result = await clearDatabase();
      if (result.success) {
        alert('✅ 全データの削除が完了しました!');
        // ページをリロードして状態をリセット
        window.location.reload();
      } else {
        alert('❌ エラー: ' + result.error);
      }
    }
  };
  
  let suggestions = [];
  if (searchTerm.trim().length > 1) { 
    const term = searchTerm.toLowerCase();
    const filteredSuggestions = allClickableItems.filter(item => 
      item.title && item.title.toLowerCase().includes(term)
    );
    const uniqueTitles = [...new Set(filteredSuggestions.map(item => item.title))];
    suggestions = uniqueTitles.slice(0, 5); 
  }
  
  
  // ========================================
  // 🎨 メインコンテンツの描画
  // ========================================
  
  const renderMainContent = () => {
    if (activeView.type === 'detail') {
      console.log('🔍 探しているID:', activeView.detailId);
      const card = allClickableItems.find(f => f.id === activeView.detailId);
      console.log('🔍 見つかったカード:', card);
      return <DetailPage card={card} onBackClick={handleBackClick} currentUser={currentUser} />;
    }
    if (activeView.type === 'profile') {
      return <ProfilePage onBackClick={handleBackClick} currentUser={currentUser} />;
    }
    if (activeView.type === 'camera') {
      return <CameraPage onSaveItem={handleAddItem} />;
    }
    if (activeView.type === 'calendar') {
      return <CalendarPage 
        homeworks={filteredHomeworks} 
        tests={tests} 
        notices={filteredNotices} 
        onCardClick={handleCardClick} 
        currentUser={currentUser}
        selectedClass={selectedClass}
      />;
    }
    if (activeView.type === 'groups') {
      return <GroupPage currentUser={currentUser} onGroupClick={handleGroupClick} />;
    }
    if (activeView.type === 'groupDetail') {
      return <GroupDetailPage 
        currentUser={currentUser} 
        groupId={activeView.groupId}
        onBackClick={handleBackClick}
      />;
    }
    if (activeView.type === 'submissions') {
      return <SubmissionsPage currentUser={currentUser} selectedClass={selectedClass} />;
    }
    
    // ★ 録画ページ
    if (activeView.type === 'recording') {
      return <RecordingPage selectedClass={selectedClass} />;
    }

    if (activeView.type === 'quiz') {
      return <QuizPage currentUser={currentUser} selectedClass={selectedClass} />;
    }

    
    switch (activeView.type) {
      case 'home':
        return <HomePage 
                  onCardClick={handleCardClick} 
                  searchTerm={searchTerm} 
                  folders={filteredFolders} 
                  prints={filteredPrints} 
                  qnaItems={filteredQnaItems}
                  notices={filteredNotices}
                  selectedClass={selectedClass}
                />;
      case 'archive':
        return <ArchivePage 
                  filterSubject={null} 
                  onCardClick={handleCardClick} 
                  searchTerm={searchTerm} 
                  folders={filteredFolders}
                  selectedClass={selectedClass}
                />;
      case 'subject':
        return <SubjectPage 
                  subject={activeView.subject} 
                  onCardClick={handleCardClick} 
                  searchTerm={searchTerm}
                  folders={filteredFolders} 
                  prints={filteredPrints}
                  homeworks={filteredHomeworks} 
                  qnaItems={filteredQnaItems}
                  notices={filteredNotices}
                  activeTab={activeView.activeTab} 
                  onTabClick={handleTabClick}
                  onAddQuestion={handleAddQuestion}
                  currentUser={currentUser}
                  selectedClass={selectedClass}
                />;
      default:
        return <h2>ようこそ</h2>;
    }
  };
  
  
  // ========================================
  // 🔄 ローディング表示
  // ========================================
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <h2>読み込み中...</h2>
      </div>
    );
  }
  
  
  // ========================================
  // 🔐 ログイン画面
  // ========================================
  
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  
  // ========================================
  // 🏠 メイン画面
  // ========================================
  
  let sidebarActiveType = activeView.type;
  let sidebarActiveSubject = activeView.subject;
  if(activeView.type === 'detail' || activeView.type === 'profile' || activeView.type === 'groupDetail') {
    sidebarActiveType = activeView.previousType;
  }

  return (
    <div>
      <Header
        onProfileClick={handleProfileClick}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onLogout={handleLogout}
        currentUser={currentUser}
        suggestions={suggestions}
        onSuggestionClick={handleSuggestionClick}
        notifications={filteredNotifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
        selectedClass={selectedClass}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={handleMobileMenuToggle}
      />
      <div className="appLayout">
        {/* モバイルメニューオーバーレイ */}
        {isMobileMenuOpen && (
          <div className="mobileMenuOverlay" onClick={handleMobileMenuClose} />
        )}

        <div className={`sidebar ${isMobileMenuOpen ? 'sidebarOpen' : ''}`}>
          <Sidebar
            activeViewType={sidebarActiveType}
            activeSubject={sidebarActiveSubject}
            onNavClick={(viewType) => {
              handleNavClick(viewType);
              handleMobileMenuClose();
            }}
            onSubjectClick={(subject) => {
              handleSubjectClick(subject);
              handleMobileMenuClose();
            }}
            onClassChange={handleClassChange}
            currentUser={currentUser}
          />
        </div>
        
        <main className="mainContent">
          {renderMainContent()}
        </main>
      </div>
    </div>
  )
}

export default App