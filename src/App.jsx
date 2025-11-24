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

// 新規追加：グループ関連
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
  onLiveSessionsChange,
  addPrint,
  addQuestion
} from './firebase';

// ダミーデータ投入スクリプト
import { seedDatabase } from './seedData';

function App() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 
  const [folders, setFolders] = useState([]); 
  const [prints, setPrints] = useState([]); 
  const [homeworks, setHomeworks] = useState([]);
  const [qnaItems, setQnaItems] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // お知らせのダミーデータ
  const [notices] = useState([
    { 
      id: 'notice1', 
      type: 'notice',
      title: '次回テストは来週月曜日です', 
      date: '2025/11/20', 
      noticeType: 'important', 
      subject: '数学',
      content: '次回のテストは11月25日(月)に実施します。範囲は教科書P50-80です。計算問題を中心に復習しておいてください。'
    },
    { 
      id: 'notice2', 
      type: 'notice',
      title: '提出物の締切に注意してください', 
      date: '2025/11/18', 
      noticeType: 'normal', 
      subject: '数学',
      content: '宿題の提出締切が今週金曜日です。忘れずに提出してください。遅れた場合は減点となります。'
    },
    { 
      id: 'notice3', 
      type: 'notice',
      title: '補習授業のお知らせ', 
      date: '2025/11/15', 
      noticeType: 'info', 
      subject: '数学',
      content: '来週木曜日の放課後、補習授業を行います。参加希望者は事前に連絡してください。教室は3-2です。'
    },
    { 
      id: 'notice4', 
      type: 'notice',
      title: '期末試験の範囲について', 
      date: '2025/11/22', 
      noticeType: 'important', 
      subject: '英語',
      content: '期末試験の範囲を更新しました。詳細は配布プリントを確認してください。リスニング問題も出題されます。'
    },
    { 
      id: 'notice5', 
      type: 'notice',
      title: '授業プリントの配布', 
      date: '2025/11/19', 
      noticeType: 'normal', 
      subject: '国語',
      content: '次回の授業で使用するプリントを配布します。忘れずに持参してください。'
    },
  ]);
  
  // 通知のダミーデータ
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      type: 'archive', 
      title: '新しいアーカイブ', 
      message: '「数学」に新しいアーカイブが追加されました。', 
      time: '5分前',
      isRead: false,
      linkType: 'folder',
      linkId: folders[0]?.id || null
    },
    { 
      id: 2, 
      type: 'live', 
      title: 'Live配信開始', 
      message: '「英語」のLive機能が 5分後に開始します。', 
      time: '10分前',
      isRead: false,
      linkType: 'live',
      linkId: liveSessions[0]?.id || null
    },
    { 
      id: 3, 
      type: 'qna', 
      title: '質問に回答', 
      message: '「質問箱」に新しい回答がつきました。', 
      time: '1時間前',
      isRead: true,
      linkType: 'qna',
      linkId: qnaItems[0]?.id || null
    },
    { 
      id: 4, 
      type: 'homework', 
      title: '宿題の締切', 
      message: '「三角関数 練習問題」の締切は明日です。', 
      time: '2時間前',
      isRead: false,
      linkType: 'homework',
      linkId: homeworks[0]?.id || null
    },
    { 
      id: 5, 
      type: 'notice', 
      title: '重要なお知らせ', 
      message: '次回テストは来週月曜日です。', 
      time: '3時間前',
      isRead: true,
      linkType: 'notice',
      linkId: 'notice1'
    },
  ]);
  
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
    groupId: null, // グループID追加
    previousType: 'home',
    activeTab: 'notice'
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // ========================================
  // 🔥 Firebase リアルタイム監視
  // ========================================
  
  useEffect(() => {
    const unsubscribeAuth = onAuthChange((user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
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
    const unsubscribeLive = onLiveSessionsChange((data) => setLiveSessions(data));

    return () => {
      unsubscribeFolders();
      unsubscribePrints();
      unsubscribeHomeworks();
      unsubscribeQna();
      unsubscribeLive();
    };
  }, [isLoggedIn]);
  
  useEffect(() => {
    if (folders.length > 0 && liveSessions.length > 0 && qnaItems.length > 0 && homeworks.length > 0) {
      setNotifications(prev => prev.map(notif => {
        if (notif.id === 1 && folders[0]) return { ...notif, linkId: folders[0].id };
        if (notif.id === 2 && liveSessions[0]) return { ...notif, linkId: liveSessions[0].id };
        if (notif.id === 3 && qnaItems[0]) return { ...notif, linkId: qnaItems[0].id };
        if (notif.id === 4 && homeworks[0]) return { ...notif, linkId: homeworks[0].id };
        return notif;
      }));
    }
  }, [folders, liveSessions, qnaItems, homeworks]);
  
  const allClickableItems = [...folders, ...prints, ...qnaItems, ...liveSessions, ...homeworks, ...notices, ...tests];
  
  console.log('🔍 allClickableItems:', allClickableItems.map(item => ({ id: item.id, type: item.type, title: item.title })));
  
  
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

  const handleAddItem = async (item) => {
    try {
      const result = await addPrint({
        title: item.title,
        subject: item.subject,
        date: item.date || new Date().toISOString().split('T')[0],
        imageUrl: item.imageUrl || 'https://picsum.photos/240/135?random=' + Date.now()
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
        title: title
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

  // グループ詳細ページへの遷移ハンドラ
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
  
  const handleNotificationClick = (notification) => {
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    
    if (notification.linkId) {
      handleCardClick(notification.linkId);
    }
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
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
      return <DetailPage card={card} onBackClick={handleBackClick} />;
    }
    if (activeView.type === 'profile') {
      return <ProfilePage onBackClick={handleBackClick} currentUser={currentUser} />;
    }
    if (activeView.type === 'camera') {
      return <CameraPage onSaveItem={handleAddItem} />;
    }
    if (activeView.type === 'calendar') {
      return <CalendarPage homeworks={homeworks} tests={tests} onCardClick={handleCardClick} />;
    }
    // グループ一覧ページ
    if (activeView.type === 'groups') {
      return <GroupPage currentUser={currentUser} onGroupClick={handleGroupClick} />;
    }
    // グループ詳細ページ
    if (activeView.type === 'groupDetail') {
      return <GroupDetailPage 
        currentUser={currentUser} 
        groupId={activeView.groupId}
        onBackClick={handleBackClick}
      />;
    }
    
    switch (activeView.type) {
      case 'home':
        return <HomePage 
                  onCardClick={handleCardClick} 
                  searchTerm={searchTerm} 
                  folders={folders} 
                  prints={prints} 
                  qnaItems={qnaItems} 
                  liveSessions={liveSessions}
                  notices={notices}
                />;
      case 'archive':
        return <ArchivePage 
                  filterSubject={null} 
                  onCardClick={handleCardClick} 
                  searchTerm={searchTerm} 
                  folders={folders} 
                />;
      case 'subject':
        return <SubjectPage 
                  subject={activeView.subject} 
                  onCardClick={handleCardClick} 
                  searchTerm={searchTerm}
                  folders={folders} 
                  prints={prints}
                  homeworks={homeworks} 
                  qnaItems={qnaItems} 
                  liveSessions={liveSessions}
                  notices={notices}
                  activeTab={activeView.activeTab} 
                  onTabClick={handleTabClick}
                  onAddQuestion={handleAddQuestion}
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
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
      <div className="appLayout">
        <div className="sidebar">
          <Sidebar 
            activeViewType={sidebarActiveType}
            activeSubject={sidebarActiveSubject} 
            onNavClick={handleNavClick}
            onSubjectClick={handleSubjectClick}
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