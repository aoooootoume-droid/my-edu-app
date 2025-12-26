import { useState, useEffect } from 'react';
import FolderCard from './FolderCard';
import VideoDetailModal from './VideoDetailModal';
import styles from './HomePage.module.css';
import { mainSubjects } from '../data.js';
import { seedDatabase, clearDatabase } from '../seedData';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

function HomePage({ onCardClick, searchTerm, folders, prints, qnaItems, notices, selectedClass }) {
  
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [initialJumpTime, setInitialJumpTime] = useState(null);
  
  // 録画アーカイブをリアルタイムで取得
  useEffect(() => {
    const q = query(
      collection(db, 'recordings'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          type: 'recording',
          title: docData.title,
          date: docData.createdAt?.toDate?.()?.toISOString().split('T')[0] || '',
          imageUrl: docData.thumbnailUrl || null,
          subject: docData.subject,
          className: docData.className
        };
      });
      setRecordings(data);
    });
    
    return () => unsubscribe();
  }, []);
  
  const subjects = mainSubjects;
  const term = (searchTerm || '').toLowerCase();

  // 文字起こしから検索にマッチする行を抽出
  const getTranscriptMatches = (transcription, searchTerm) => {
    if (!transcription || !searchTerm) return [];
    
    const lines = transcription.split('\n').filter(line => line.trim());
    const matches = [];
    
    lines.forEach(line => {
      if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
        const timestampMatch = line.match(/^\[(\d{2}):(\d{2})(?::(\d{2}))?\]/);
        if (timestampMatch) {
          const timestamp = timestampMatch[0];
          const content = line.replace(timestamp, '').trim();
          
          const parts = timestampMatch[0].replace('[', '').replace(']', '').split(':');
          let seconds = 0;
          if (parts.length === 3) {
            seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
          } else {
            seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          }
          
          matches.push({
            timestamp,
            content,
            seconds
          });
        }
      }
    });
    
    return matches;
  };

  // 検索キーワードをハイライト
  const highlightText = (text, keyword) => {
    if (!keyword || !text) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      part.toLowerCase() === keyword.toLowerCase() 
        ? <mark key={i} className={styles.highlight}>{part}</mark>
        : part
    );
  };

  // 通常アーカイブと録画を合わせて取得（文字起こし検索対応）
  const getFoldersBySubject = (subject) => {
    // 通常のfolders
    const normalFolders = folders
      .filter(folder => folder.subject === subject)
      .filter(folder => folder.title.toLowerCase().includes(term))
      .map(folder => ({ ...folder, transcriptMatches: [] }));
    
    // 録画アーカイブ（文字起こし検索対応）
    const recordingFolders = recordings
      .filter(rec => rec.subject === subject)
      .filter(rec => {
        if (!selectedClass) return true;
        return rec.className === selectedClass || !rec.className;
      })
      .map(rec => {
        const titleMatch = rec.title?.toLowerCase().includes(term);
        const transcriptMatches = term ? getTranscriptMatches(rec.transcription, term) : [];
        
        // タイトルか文字起こしにマッチ
        if (titleMatch || transcriptMatches.length > 0) {
          return {
            ...rec,
            transcriptMatches,
            matchType: titleMatch ? 'title' : 'transcript'
          };
        }
        return null;
      })
      .filter(Boolean);
    
    // 合わせてソート
    return [...normalFolders, ...recordingFolders]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  };
  
  const getPrintsBySubject = (subject) => {
    if (!term) return [];
    return prints
      .filter(print => (print.subject === subject && print.title.toLowerCase().includes(term)))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10); 
  };
  
  const getQnaBySubject = (subject) => {
    if (!term) return [];
    return qnaItems
      .filter(qna => (qna.subject === subject && qna.title.toLowerCase().includes(term)))
      .sort((a, b) => (a.status === 'unanswered' && b.status === 'answered') ? -1 : 1) 
      .slice(0, 5); 
  };

  // カードクリック時の処理
  const handleCardClick = (folder, jumpTime = null) => {
    if (folder.type === 'recording') {
      setSelectedRecording(folder);
      setInitialJumpTime(jumpTime);
    } else {
      onCardClick(folder.id);
    }
  };

  // モーダルを閉じる
  const closeModal = () => {
    setSelectedRecording(null);
    setInitialJumpTime(null);
  };

  // ダミーデータ投入
  const handleSeedData = async () => {
    if (window.confirm('ダミーデータをFirestoreに投入しますか？')) {
      const result = await seedDatabase();
      if (result.success) {
        alert('✅ ダミーデータの投入が完了しました！\nページをリロードします。');
        window.location.reload();
      } else {
        alert('❌ エラー: ' + result.error);
      }
    }
  };

  // データ削除
  const handleClearData = async () => {
    if (window.confirm('⚠️ 本当に全データを削除しますか？\nこの操作は取り消せません。')) {
      const result = await clearDatabase();
      if (result.success) {
        alert('✅ 全データの削除が完了しました！\nページをリロードします。');
        window.location.reload();
      } else {
        alert('❌ エラー: ' + result.error);
      }
    }
  };

  // 録画カードのレンダリング（文字起こし検索結果付き）
  const renderRecordingCard = (folder) => {
    const hasMatches = folder.transcriptMatches && folder.transcriptMatches.length > 0;
    
    return (
      <div key={folder.id} className={styles.recordingCardWrapper}>
        <FolderCard
          title={folder.title} 
          date={folder.date}
          imageUrl={folder.imageUrl}
          subject={folder.subject}
          className={!selectedClass ? folder.className : null}
          isRecording={folder.type === 'recording'}
          hasTranscription={!!folder.transcription}
          onClick={() => handleCardClick(folder)}
        />
        
        {/* 文字起こし検索マッチ表示 */}
        {hasMatches && (
          <div className={styles.matchesContainer}>
            <p className={styles.matchesLabel}>
              🔍 文字起こしで{folder.transcriptMatches.length}件ヒット
            </p>
            <div className={styles.matchesList}>
              {folder.transcriptMatches.slice(0, 2).map((match, idx) => (
                <button
                  key={idx}
                  className={styles.matchButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(folder, match.seconds);
                  }}
                >
                  <span className={styles.matchTime}>{match.timestamp}</span>
                  <span className={styles.matchText}>
                    {highlightText(
                      match.content.length > 30 
                        ? match.content.substring(0, 30) + '...' 
                        : match.content,
                      searchTerm
                    )}
                  </span>
                </button>
              ))}
              {folder.transcriptMatches.length > 2 && (
                <span className={styles.moreMatches}>
                  +{folder.transcriptMatches.length - 2}件
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.homeContainer}>
      <h2>
        {searchTerm ? `「${searchTerm}」の検索結果 (ホーム)` : 'ホーム'}
        {selectedClass && <span className={styles.classLabel}> - {selectedClass}</span>}
      </h2>
      
      {/* データ管理ボタン（開発用） */}
      <div className={styles.devButtons}>
        <button onClick={handleClearData} className={styles.clearButton}>
          🗑️ データ削除
        </button>
        <button onClick={handleSeedData} className={styles.seedButton}>
          📥 ダミーデータ投入
        </button>
      </div>
      
      {!searchTerm && (
        <h3 className={styles.archiveTitle}>最近のアーカイブ</h3>
      )}
      
      <>
        {subjects.map(subject => {
          const foundFolders = getFoldersBySubject(subject);
          const foundPrints = getPrintsBySubject(subject); 
          const foundQna = getQnaBySubject(subject); 

          if (foundFolders.length === 0 && foundPrints.length === 0 && foundQna.length === 0) return null; 

          return (
            <section className={styles.subjectRow} key={subject}>
              
              <h3 className={styles.subjectTitle}>{subject}</h3>
              
              {/* アーカイブ（通常 + 録画を統合） */}
              {foundFolders.length > 0 && (
                <>
                  {searchTerm && <h4 className={styles.archiveSubTitle}>アーカイブ</h4>}
                  
                  <div className={styles.cardScroller}>
                    {foundFolders.map(folder => 
                      folder.type === 'recording' 
                        ? renderRecordingCard(folder)
                        : (
                          <FolderCard
                            key={folder.id} 
                            title={folder.title} 
                            date={folder.date}
                            imageUrl={folder.imageUrl}
                            subject={folder.subject}
                            className={!selectedClass ? folder.className : null}
                            onClick={() => handleCardClick(folder)}
                          />
                        )
                    )}
                  </div>
                </>
              )}
              
              {foundPrints.length > 0 && (
                <>
                  <h4 className={styles.printSubTitle}>プリント</h4>
                  <div className={styles.cardScroller}>
                    {foundPrints.map(print => (
                      <FolderCard
                        key={print.id} 
                        title={print.title} 
                        date={print.date}
                        imageUrl={print.imageUrl}
                        subject={print.subject}
                        className={!selectedClass ? print.className : null}
                        onClick={() => onCardClick(print.id)}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {foundQna.length > 0 && (
                <>
                  <h4 className={styles.qnaSubTitle}>質問箱</h4>
                  <ul className={styles.qnaList}>
                    {foundQna.map(qna => (
                      <li key={qna.id} className={styles.qnaItem} onClick={() => onCardClick(qna.id)}>
                        <span className={`${styles.qnaStatus} ${
                          qna.status === 'answered' ? styles.statusAnswered : styles.statusUnanswered
                        }`}>
                          {qna.status === 'answered' ? '回答済み' : '未回答'}
                        </span>
                        <p className={styles.qnaTitle}>{qna.title}</p>
                        {!selectedClass && qna.className && (
                          <span className={styles.qnaClass}>{qna.className}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              
              {searchTerm && foundFolders.length === 0 && foundPrints.length === 0 && foundQna.length === 0 && (
                <p className={styles.noDataMessage}>（この教科には一致するものがありません）</p>
              )}
              
            </section>
          );
        })}
      </>

      {/* 動画詳細モーダル */}
      {selectedRecording && (
        <VideoDetailModal
          recording={selectedRecording}
          onClose={closeModal}
          initialTime={initialJumpTime}
        />
      )}
    </div>
  );
}

export default HomePage;