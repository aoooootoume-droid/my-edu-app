import { useState, useEffect } from 'react';
import FolderCard from './FolderCard'; 
import styles from './ArchivePage.module.css';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

function ArchivePage({ filterSubject, onCardClick, searchTerm, folders, selectedClass }) {
  const [recordings, setRecordings] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingRecording, setEditingRecording] = useState(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  // Firestoreから録画データを読み込む
  const loadRecordings = async () => {
    try {
      const q = query(collection(db, 'recordings'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const recordingsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        type: 'video' // 録画であることを識別
      }));
      
      setRecordings(recordingsList);
    } catch (error) {
      console.error('録画データ読み込みエラー:', error);
    }
  };

  const term = searchTerm.toLowerCase();

  // 既存のフォルダをフィルタリング
  const filteredFolders = folders
    .filter(folder => {
      const subjectMatch = filterSubject ? folder.subject === filterSubject : true;
      const titleMatch = folder.title.toLowerCase().includes(term);
      return subjectMatch && titleMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // 録画データをフィルタリング
  const filteredRecordings = recordings
    .filter(recording => {
      const subjectMatch = filterSubject ? recording.subject === filterSubject : true;
      const titleMatch = recording.title.toLowerCase().includes(term);
      const classMatch = selectedClass ? (recording.className === selectedClass || !recording.className) : true;
      return subjectMatch && titleMatch && classMatch;
    });

  // 動画モーダルを開く
  const openVideo = (recording) => {
    setSelectedVideo(recording);
  };

  // 動画モーダルを閉じる
  const closeVideo = () => {
    setSelectedVideo(null);
  };

  // 録画を削除
  const deleteRecording = async (e, recording) => {
    console.log('削除関数が呼ばれました', recording);
    e.stopPropagation();
    setMenuOpenId(null);
    
    if (!window.confirm(`「${recording.title}」を削除しますか？\nこの操作は取り消せません。`)) {
      console.log('キャンセルされました');
      return;
    }

    console.log('削除開始');
    try {
      await deleteDoc(doc(db, 'recordings', recording.id));
      console.log('Firestore削除完了');

      if (recording.videoUrl) {
        try {
          const videoRef = ref(storage, recording.videoUrl);
          await deleteObject(videoRef);
        } catch (err) {
          console.log('動画ファイル削除スキップ:', err);
        }
      }

      if (recording.thumbnailUrl) {
        try {
          const thumbRef = ref(storage, recording.thumbnailUrl);
          await deleteObject(thumbRef);
        } catch (err) {
          console.log('サムネイル削除スキップ:', err);
        }
      }

      setRecordings(prev => prev.filter(r => r.id !== recording.id));
      alert('削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました: ' + error.message);
    }
  };

  // メニュー開閉
  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  // 編集モーダルを開く
  const openEditModal = (e, recording) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setEditingRecording({ ...recording });
  };

  // 編集を保存
  const saveEdit = async () => {
    if (!editingRecording) return;

    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'recordings', editingRecording.id), {
        title: editingRecording.title,
        subject: editingRecording.subject,
        description: editingRecording.description
      });

      setRecordings(prev => prev.map(r => 
        r.id === editingRecording.id 
          ? { ...r, title: editingRecording.title, subject: editingRecording.subject, description: editingRecording.description }
          : r
      ));

      setEditingRecording(null);
      alert('更新しました');
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpenId]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getSubjectClass = (subj) => {
    switch(subj) {
      case '数学': return styles.tagMath;
      case '英語': return styles.tagEnglish;
      case '国語': return styles.tagJapanese;
      case '理科': return styles.tagScience;
      case '社会': return styles.tagSocial;
      default: return styles.tagDefault;
    }
  };

  return (
    <div className={styles.archiveContainer}> 
      <h2 className={styles.pageTitle}>アーカイブ</h2>

      {filterSubject && searchTerm && (
        <p className={styles.searchResult}>
          「{searchTerm}」の検索結果:
        </p>
      )}

      <div className={styles.cardGrid}>
        {/* 録画動画カード */}
        {filteredRecordings.map(recording => (
          <div 
            key={`video-${recording.id}`} 
            className={styles.videoCard}
            onClick={() => openVideo(recording)}
          >
            <div className={styles.videoThumbnail}>
              {recording.thumbnailUrl ? (
                <img 
                  src={recording.thumbnailUrl} 
                  alt={recording.title}
                  className={styles.thumbnailImage}
                />
              ) : (
                <div className={styles.playIcon}>▶</div>
              )}
              <div className={styles.videoDuration}>
                {formatDuration(recording.duration)}
              </div>
              {recording.subject && (
                <span className={`${styles.videoSubjectBadge} ${getSubjectClass(recording.subject)}`}>
                  {recording.subject}
                </span>
              )}
            </div>
            <div className={styles.videoInfo}>
              <div className={styles.videoHeader}>
                <h3 className={styles.videoTitle}>{recording.title}</h3>
                <button 
                  className={styles.menuBtn}
                  onClick={(e) => toggleMenu(e, recording.id)}
                >
                  ⋮
                </button>
                {menuOpenId === recording.id && (
                  <div className={styles.dropdownMenu}>
                    <button onClick={(e) => openEditModal(e, recording)}>
                      ✏️ 編集
                    </button>
                    <button onClick={(e) => deleteRecording(e, recording)} className={styles.deleteOption}>
                      🗑️ 削除
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.videoMeta}>
                <span className={styles.videoDate}>
                  {formatDate(recording.createdAt)}
                </span>
              </div>
              {recording.description && (
                <p className={styles.videoDescription}>
                  {recording.description}
                </p>
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
            subject={folder.subject}
            imageUrl={folder.imageUrl}
            onClick={() => onCardClick(folder.id)}
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

      {/* 動画再生モーダル */}
      {selectedVideo && (
        <div className={styles.videoModal} onClick={closeVideo}>
          <div className={styles.videoModalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeVideo} className={styles.closeButton}>
              ✕
            </button>
            <h2 className={styles.modalTitle}>{selectedVideo.title}</h2>
            {selectedVideo.subject && (
              <span className={styles.modalSubject}>{selectedVideo.subject}</span>
            )}
            <video
              src={selectedVideo.videoUrl}
              controls
              autoPlay
              className={styles.modalVideo}
            />
            {selectedVideo.description && (
              <div className={styles.modalDescription}>
                <h3>説明</h3>
                <p>{selectedVideo.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {editingRecording && (
        <div className={styles.editModal} onClick={() => setEditingRecording(null)}>
          <div className={styles.editModalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.editModalTitle}>アーカイブを編集</h3>
            
            <div className={styles.editInputGroup}>
              <label>タイトル</label>
              <input
                type="text"
                value={editingRecording.title}
                onChange={(e) => setEditingRecording({...editingRecording, title: e.target.value})}
                className={styles.editInput}
              />
            </div>

            <div className={styles.editInputGroup}>
              <label>科目</label>
              <input
                type="text"
                value={editingRecording.subject || ''}
                onChange={(e) => setEditingRecording({...editingRecording, subject: e.target.value})}
                className={styles.editInput}
              />
            </div>

            <div className={styles.editInputGroup}>
              <label>説明</label>
              <textarea
                value={editingRecording.description || ''}
                onChange={(e) => setEditingRecording({...editingRecording, description: e.target.value})}
                className={styles.editTextarea}
                rows="3"
              />
            </div>

            <div className={styles.editButtons}>
              <button onClick={saveEdit} className={styles.saveEditBtn}>保存</button>
              <button onClick={() => setEditingRecording(null)} className={styles.cancelEditBtn}>キャンセル</button>
            </div>

            <button 
              onClick={(e) => {
                deleteRecording(e, editingRecording);
                setEditingRecording(null);
              }} 
              className={styles.deleteEditBtn}
            >
              🗑️ このアーカイブを削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArchivePage;