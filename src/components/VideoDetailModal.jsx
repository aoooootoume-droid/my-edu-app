import { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import styles from './VideoDetailModal.module.css';

const VideoDetailModal = ({ recording, onClose, onUpdate, onDelete, initialTime }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');
  const [hasJumped, setHasJumped] = useState(false);
  
  // 編集モード
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(recording?.title || '');
  const [editSubject, setEditSubject] = useState(recording?.subject || '数学');
  const [editDescription, setEditDescription] = useState(recording?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // 削除確認
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // メニュー
  const [showMenu, setShowMenu] = useState(false);
  
  // 再生速度
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  const videoRef = useRef(null);
  const speedMenuRef = useRef(null);
  const menuRef = useRef(null);

  const subjects = ['数学', '英語', '国語', '理科', '社会', '情報', '音楽', '美術', '体育', 'その他'];

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 再生速度を変更
  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditing) {
          cancelEdit();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, showDeleteConfirm, isEditing]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // 初期時間が指定されていればジャンプ
      if (initialTime !== null && initialTime !== undefined && !hasJumped) {
        videoRef.current.currentTime = initialTime;
        setCurrentTime(initialTime);
        setHasJumped(true);
        // 自動再生
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const jumpToTime = (timeStr) => {
    const match = timeStr.match(/\[(\d{2}):(\d{2})(?::(\d{2}))?\]/);
    if (match && videoRef.current) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      
      let totalSeconds;
      if (match[3]) {
        totalSeconds = hours * 3600 + minutes * 60 + seconds;
      } else {
        totalSeconds = hours * 60 + minutes;
      }
      
      videoRef.current.currentTime = totalSeconds;
      setCurrentTime(totalSeconds);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderTranscript = (text) => {
    if (!text || text.trim() === '') {
      return <p className={styles.noTranscript}>文字起こしがありません</p>;
    }

    const lines = text.split('\n').filter(line => line.trim());
    
    return lines.map((line, idx) => {
      const timestampMatch = line.match(/^\[(\d{2}:\d{2}(?::\d{2})?)\]/);
      
      if (timestampMatch) {
        const timestamp = timestampMatch[0];
        const content = line.replace(timestamp, '').trim();
        
        return (
          <div key={idx} className={styles.transcriptLine}>
            <button 
              className={styles.timestamp}
              onClick={() => jumpToTime(timestamp)}
            >
              {timestamp}
            </button>
            <span className={styles.transcriptText}>{content}</span>
          </div>
        );
      }
      
      if (line.includes('[認識中]')) return null;
      
      return (
        <div key={idx} className={styles.transcriptLine}>
          <span className={styles.transcriptText}>{line}</span>
        </div>
      );
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 編集開始
  const startEdit = () => {
    setEditTitle(recording?.title || '');
    setEditSubject(recording?.subject || '数学');
    setEditDescription(recording?.description || '');
    setIsEditing(true);
    setShowMenu(false);
    setActiveTab('info');
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle(recording?.title || '');
    setEditSubject(recording?.subject || '数学');
    setEditDescription(recording?.description || '');
  };

  // 保存
  const handleSave = async () => {
    if (!editTitle.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const docRef = doc(db, 'recordings', recording.id);
      await updateDoc(docRef, {
        title: editTitle.trim(),
        subject: editSubject,
        description: editDescription.trim()
      });
      
      setIsEditing(false);
      
      if (onUpdate) {
        onUpdate({
          ...recording,
          title: editTitle.trim(),
          subject: editSubject,
          description: editDescription.trim()
        });
      }
      
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 削除
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'recordings', recording.id));
      
      try {
        if (recording.videoUrl) {
          const videoPath = decodeURIComponent(recording.videoUrl.split('/o/')[1].split('?')[0]);
          await deleteObject(ref(storage, videoPath));
        }
        if (recording.thumbnailUrl) {
          const thumbPath = decodeURIComponent(recording.thumbnailUrl.split('/o/')[1].split('?')[0]);
          await deleteObject(ref(storage, thumbPath));
        }
      } catch (storageError) {
        console.warn('Storage削除エラー（継続）:', storageError);
      }
      
      if (onDelete) {
        onDelete(recording.id);
      }
      
      onClose();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const hasTranscript = recording?.transcription && recording.transcription.trim() !== '';

  // recordingがない場合は何も表示しない
  if (!recording || !recording.id) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={styles.editTitleInput}
                placeholder="タイトル"
                autoFocus
              />
            ) : (
              <>
                <h2 className={styles.title}>{recording.title}</h2>
                {recording.subject && (
                  <span className={styles.subjectBadge}>{recording.subject}</span>
                )}
              </>
            )}
          </div>
          
          <div className={styles.headerRight}>
            {/* 3点メニュー */}
            {!isEditing && (
              <div className={styles.menuContainer} ref={menuRef}>
                <button 
                  className={styles.menuBtn}
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"/>
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="19" r="2"/>
                  </svg>
                </button>
                
                {showMenu && (
                  <div className={styles.dropdown}>
                    <button onClick={startEdit} className={styles.dropdownItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      編集
                    </button>
                    <button 
                      onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} 
                      className={`${styles.dropdownItem} ${styles.deleteItem}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                      削除
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <button className={styles.closeBtn} onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {/* 左側：動画プレイヤー */}
          <div className={styles.videoSection}>
            <div className={styles.videoContainer}>
              <video
                ref={videoRef}
                src={recording.videoUrl}
                className={styles.video}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                poster={recording.thumbnailUrl}
              />
              
              {!isPlaying && (
                <button className={styles.playOverlay} onClick={togglePlay}>
                  <div className={styles.playIconCircle}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </button>
              )}
            </div>

            {/* コントロールバー */}
            <div className={styles.controls}>
              <button className={styles.controlBtn} onClick={togglePlay}>
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>
              
              <span className={styles.time}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className={styles.seekBar}
              />
              
              <button className={styles.controlBtn} onClick={toggleMute}>
                {isMuted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                )}
              </button>
              
              {/* 再生速度 */}
              <div className={styles.speedContainer} ref={speedMenuRef}>
                <button 
                  className={styles.speedBtn} 
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                >
                  {playbackRate}x
                </button>
                
                {showSpeedMenu && (
                  <div className={styles.speedMenu}>
                    {speedOptions.map(rate => (
                      <button
                        key={rate}
                        className={`${styles.speedOption} ${playbackRate === rate ? styles.speedActive : ''}`}
                        onClick={() => changePlaybackRate(rate)}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button className={styles.controlBtn} onClick={toggleFullscreen}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 右側：文字起こし・情報 */}
          <div className={styles.sidePanel}>
            {/* タブ */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'transcript' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('transcript')}
              >
                文字起こし
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('info')}
              >
                詳細情報
              </button>
            </div>

            {/* タブコンテンツ */}
            <div className={styles.tabContent}>
              {activeTab === 'transcript' ? (
                <div className={styles.transcriptContainer}>
                  {hasTranscript ? (
                    <>
                      <p className={styles.transcriptHint}>
                        タイムスタンプをクリックでジャンプ
                      </p>
                      <div className={styles.transcriptList}>
                        {renderTranscript(recording.transcription)}
                      </div>
                    </>
                  ) : (
                    <div className={styles.noTranscriptBox}>
                      <div className={styles.noTranscriptIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                      <p>文字起こしがありません</p>
                      <span>録画時に音声認識が有効でなかった可能性があります</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.infoContainer}>
                  {/* 編集モード */}
                  {isEditing ? (
                    <div className={styles.editForm}>
                      <div className={styles.editGroup}>
                        <label>教科</label>
                        <select 
                          value={editSubject} 
                          onChange={(e) => setEditSubject(e.target.value)}
                          className={styles.editSelect}
                        >
                          {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className={styles.editGroup}>
                        <label>説明</label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className={styles.editTextarea}
                          rows={5}
                          placeholder="授業の内容など"
                        />
                      </div>
                      
                      <div className={styles.editActions}>
                        <button 
                          onClick={cancelEdit} 
                          className={styles.cancelBtn}
                          disabled={isSaving}
                        >
                          キャンセル
                        </button>
                        <button 
                          onClick={handleSave} 
                          className={styles.saveBtn}
                          disabled={isSaving}
                        >
                          {isSaving ? '保存中...' : '保存する'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.infoList}>
                      <div className={styles.infoCard}>
                        <div className={styles.infoIcon}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                        <div className={styles.infoContent}>
                          <span className={styles.infoLabel}>録画日時</span>
                          <span className={styles.infoValue}>{formatDate(recording.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className={styles.infoCard}>
                        <div className={styles.infoIcon}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <div className={styles.infoContent}>
                          <span className={styles.infoLabel}>録画時間</span>
                          <span className={styles.infoValue}>{formatTime(recording.duration || 0)}</span>
                        </div>
                      </div>
                      
                      <div className={styles.infoCard}>
                        <div className={styles.infoIcon}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                          </svg>
                        </div>
                        <div className={styles.infoContent}>
                          <span className={styles.infoLabel}>教科</span>
                          <span className={styles.infoValue}>{recording.subject || '未設定'}</span>
                        </div>
                      </div>
                      
                      {recording.className && (
                        <div className={styles.infoCard}>
                          <div className={styles.infoIcon}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                          </div>
                          <div className={styles.infoContent}>
                            <span className={styles.infoLabel}>クラス</span>
                            <span className={styles.infoValue}>{recording.className}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className={styles.descriptionCard}>
                        <span className={styles.infoLabel}>説明</span>
                        <p className={styles.descriptionText}>
                          {recording.description || '説明なし'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 削除確認モーダル */}
        {showDeleteConfirm && (
          <div className={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3>録画を削除しますか？</h3>
              <p className={styles.confirmTitle}>「{recording.title}」</p>
              <p className={styles.confirmWarning}>この操作は取り消せません</p>
              <div className={styles.confirmActions}>
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className={styles.confirmCancelBtn}
                  disabled={isDeleting}
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleDelete} 
                  className={styles.confirmDeleteBtn}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className={styles.spinner}></span>
                      削除中...
                    </>
                  ) : '削除する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoDetailModal;