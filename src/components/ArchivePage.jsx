import { useState, useEffect } from 'react';
import FolderCard from './FolderCard'; 
import VideoDetailModal from './VideoDetailModal';
import styles from './ArchivePage.module.css';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

function ArchivePage({ filterSubject, onCardClick, searchTerm, folders = [], selectedClass }) {
  const [recordings, setRecordings] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [initialJumpTime, setInitialJumpTime] = useState(null);

  // Firestoreから録画データをリアルタイムで取得
  useEffect(() => {
    const q = query(collection(db, 'recordings'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordingsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        type: 'video'
      }));
      setRecordings(recordingsList);
    }, (error) => {
      console.error('録画データ取得エラー:', error);
    });

    return () => unsubscribe();
  }, []);

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
          
          // タイムスタンプを秒に変換
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

  // 既存のフォルダをフィルタリング
  const filteredFolders = (folders || [])
    .filter(folder => {
      if (!folder) return false;
      const subjectMatch = filterSubject ? folder.subject === filterSubject : true;
      const classMatch = selectedClass ? (folder.className === selectedClass || !folder.className) : true;
      const titleMatch = folder.title ? folder.title.toLowerCase().includes(term) : false;
      return subjectMatch && classMatch && titleMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // 録画データをフィルタリング（文字起こしも検索対象）
  const filteredRecordings = recordings
    .map(recording => {
      if (!recording) return null;
      
      const subjectMatch = filterSubject ? recording.subject === filterSubject : true;
      const classMatch = selectedClass ? (recording.className === selectedClass || !recording.className) : true;
      const titleMatch = recording.title ? recording.title.toLowerCase().includes(term) : false;
      
      // 文字起こしからのマッチを取得
      const transcriptMatches = term ? getTranscriptMatches(recording.transcription, term) : [];
      
      // タイトルか文字起こしにマッチ
      const matches = titleMatch || transcriptMatches.length > 0;
      
      if (subjectMatch && classMatch && matches) {
        return {
          ...recording,
          transcriptMatches,
          matchType: titleMatch ? 'title' : 'transcript'
        };
      }
      return null;
    })
    .filter(Boolean);

  // 動画モーダルを開く
  const openVideo = (recording, jumpTime = null) => {
    if (recording && recording.id) {
      setSelectedVideo(recording);
      setInitialJumpTime(jumpTime);
    }
  };

  // 動画モーダルを閉じる
  const closeVideo = () => {
    setSelectedVideo(null);
    setInitialJumpTime(null);
  };

  // 更新時のハンドラ
  const handleUpdate = (updatedRecording) => {
    setRecordings(prev => 
      prev.map(r => r.id === updatedRecording.id ? updatedRecording : r)
    );
    setSelectedVideo(updatedRecording);
  };

  // 削除時のハンドラ
  const handleDelete = (recordingId) => {
    setRecordings(prev => prev.filter(r => r.id !== recordingId));
    setSelectedVideo(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return '';
    }
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

  return (
    <div className={styles.archiveContainer}> 
      <h2 className={styles.pageTitle}>
        📁 アーカイブ
        {selectedClass && <span className={styles.classLabel}> - {selectedClass}</span>}
      </h2>

      {searchTerm && (
        <p className={styles.searchResult}>
          「{searchTerm}」の検索結果: {filteredRecordings.length + filteredFolders.length}件
        </p>
      )}

      <div className={styles.cardGrid}>
        {/* 録画動画カード */}
        {filteredRecordings.map(recording => (
          <div 
            key={`video-${recording.id}`} 
            className={styles.videoCard}
          >
            {/* サムネイル部分をクリックで通常オープン */}
            <div 
              className={styles.videoThumbnail}
              onClick={() => openVideo(recording)}
            >
              {recording.thumbnailUrl ? (
                <img 
                  src={recording.thumbnailUrl} 
                  alt={recording.title || '録画'}
                  className={styles.thumbnailImage}
                />
              ) : (
                <div className={styles.playIcon}>▶</div>
              )}
              <div className={styles.videoDuration}>
                {formatDuration(recording.duration)}
              </div>
              {recording.transcription && (
                <div className={styles.transcriptBadge}>📝</div>
              )}
            </div>
            
            <div className={styles.videoInfo}>
              <h3 
                className={styles.videoTitle}
                onClick={() => openVideo(recording)}
              >
                {highlightText(recording.title || '無題', searchTerm)}
              </h3>
              <div className={styles.videoMeta}>
                {recording.subject && (
                  <span className={styles.videoSubject}>{recording.subject}</span>
                )}
                <span className={styles.videoDate}>
                  {formatDate(recording.createdAt)}
                </span>
              </div>
              
              {/* 文字起こしマッチの表示 */}
              {recording.transcriptMatches && recording.transcriptMatches.length > 0 && (
                <div className={styles.transcriptMatchesContainer}>
                  <p className={styles.matchLabel}>
                    🔍 文字起こしで{recording.transcriptMatches.length}件ヒット
                  </p>
                  <div className={styles.matchList}>
                    {recording.transcriptMatches.slice(0, 3).map((match, idx) => (
                      <button
                        key={idx}
                        className={styles.matchItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          openVideo(recording, match.seconds);
                        }}
                      >
                        <span className={styles.matchTimestamp}>{match.timestamp}</span>
                        <span className={styles.matchContent}>
                          {highlightText(
                            match.content.length > 40 
                              ? match.content.substring(0, 40) + '...' 
                              : match.content,
                            searchTerm
                          )}
                        </span>
                      </button>
                    ))}
                    {recording.transcriptMatches.length > 3 && (
                      <span className={styles.moreMatches}>
                        +{recording.transcriptMatches.length - 3}件
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 既存のフォルダカード */}
        {filteredFolders.map(folder => (
          <FolderCard 
            key={folder.id}
            title={folder.title}
            date={folder.date}
            imageUrl={folder.imageUrl}
            subject={folder.subject}
            className={!selectedClass ? folder.className : null}
            onClick={() => onCardClick && onCardClick(folder.id)}
          />
        ))}

        {/* データがない場合 */}
        {filteredFolders.length === 0 && filteredRecordings.length === 0 && (
          <p className={styles.noDataMessage}>
            {searchTerm 
              ? `「${searchTerm}」に一致するアーカイブはありません。` 
              : 'アーカイブはまだありません。'
            }
          </p>
        )}
      </div>

      {/* 動画詳細モーダル */}
      {selectedVideo && selectedVideo.id && (
        <VideoDetailModal
          recording={selectedVideo}
          onClose={closeVideo}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          initialTime={initialJumpTime}
        />
      )}
    </div>
  );
}

export default ArchivePage;