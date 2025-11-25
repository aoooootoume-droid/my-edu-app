import { useState, useEffect, useRef } from 'react';
import styles from './LivePage.module.css';
import { 
  Play, 
  Stop, 
  Monitor,
  MonitorPlay,
  VideoCamera,
  VideoCameraSlash,
  Microphone,
  MicrophoneSlash,
  PaperPlaneRight,
  X,
  Users,
  Clock,
  Gear
} from '@phosphor-icons/react';
import {
  startLiveStream,
  startScreenShare,
  createPeerConnection,
  joinLiveStream,
  endLiveStream,
  sendChatMessage,
  onChatMessages
} from '../firebase/webrtc';

function LivePage({ filterSubject, searchTerm = '', liveSessions, onCardClick, currentUser }) {
  const [selectedLive, setSelectedLive] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [error, setError] = useState(null);
  
  const localVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const cleanupRef = useRef(null);
  const streamStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  const term = searchTerm.toLowerCase();

  const filteredItems = liveSessions
    .filter(item => {
      const subjectMatch = filterSubject ? item.subject === filterSubject : true;
      const titleMatch = item.title.toLowerCase().includes(term);
      return subjectMatch && titleMatch;
    })
    .sort((a, b) => {
      const statusOrder = { 'live': 1, 'upcoming': 2, 'finished': 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

  // チャットメッセージを監視
  useEffect(() => {
    if (!selectedLive) return;

    const unsubscribe = onChatMessages(selectedLive.id, (messages) => {
      setChatMessages(messages.sort((a, b) => a.timestamp - b.timestamp));
    });

    return () => unsubscribe();
  }, [selectedLive]);

  // 配信時間をカウント
  useEffect(() => {
    if (isStreaming && streamStartTimeRef.current) {
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - streamStartTimeRef.current) / 1000);
        setStreamDuration(elapsed);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setStreamDuration(0);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isStreaming]);

  // ビデオ要素にストリームを設定
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // プレビューを開始（配信前の確認）
  const handleStartPreview = async (liveItem) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      setIsPreviewing(true);
      setSelectedLive(liveItem);
    } catch (err) {
      console.error('カメラ・マイクのアクセスエラー:', err);
      if (err.name === 'NotAllowedError') {
        setError('カメラとマイクへのアクセスが拒否されました。ブラウザの設定を確認してください。');
      } else if (err.name === 'NotFoundError') {
        setError('カメラまたはマイクが見つかりません。デバイスを接続してください。');
      } else {
        setError('カメラ・マイクの起動に失敗しました: ' + err.message);
      }
    }
  };

  // プレビューをキャンセル
  const handleCancelPreview = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setIsPreviewing(false);
    setSelectedLive(null);
    setError(null);
  };

  // 配信を開始
  const handleStartStreaming = async () => {
    if (!localStream || !selectedLive) return;

    const result = await startLiveStream(
      selectedLive.id,
      currentUser.uid,
      currentUser.displayName || currentUser.email
    );

    if (result.success) {
      setIsStreaming(true);
      setIsPreviewing(false);
      streamStartTimeRef.current = Date.now();
    } else {
      setError('配信の開始に失敗しました: ' + result.error);
    }
  };

  // 配信を停止
  const handleStopStreaming = async () => {
    if (!confirm('配信を終了しますか？')) return;

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (selectedLive) {
      await endLiveStream(selectedLive.id);
    }
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    setLocalStream(null);
    setIsStreaming(false);
    setIsPreviewing(false);
    setSelectedLive(null);
    setIsSharingScreen(false);
    streamStartTimeRef.current = null;
  };

  // 画面共有を開始
  const handleStartScreenShare = async () => {
    const result = await startScreenShare();

    if (result.success) {
      const videoTrack = result.stream.getVideoTracks()[0];
      
      if (localStream) {
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find(s => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        const oldVideoTrack = localStream.getVideoTracks()[0];
        oldVideoTrack.stop();
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(videoTrack);
      }

      setIsSharingScreen(true);

      videoTrack.onended = () => {
        handleStopScreenShare();
      };
    } else {
      setError('画面共有の開始に失敗しました: ' + result.error);
    }
  };

  // 画面共有を停止
  const handleStopScreenShare = async () => {
    if (!localStream) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = newStream.getVideoTracks()[0];

      const sender = peerConnectionRef.current
        ?.getSenders()
        .find(s => s.track?.kind === 'video');
      
      if (sender) {
        sender.replaceTrack(videoTrack);
      }

      const oldVideoTrack = localStream.getVideoTracks()[0];
      oldVideoTrack.stop();
      localStream.removeTrack(oldVideoTrack);
      localStream.addTrack(videoTrack);

      setIsSharingScreen(false);
    } catch (err) {
      setError('カメラへの切り替えに失敗しました: ' + err.message);
    }
  };

  // マイクのミュート切り替え
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // ビデオのON/OFF切り替え
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // チャットメッセージを送信
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedLive) return;

    await sendChatMessage(
      selectedLive.id,
      currentUser.uid,
      currentUser.displayName || currentUser.email || '先生',
      chatInput
    );

    setChatInput('');
  };

  // 配信時間をフォーマット
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (item) => {
    if (item.status === 'live') return '🔴 配信中';
    if (item.status === 'upcoming') return `🔵 配信予定 (${item.date})`;
    if (item.status === 'finished') return `⚫ 配信終了`;
    return '';
  };
  
  const getStatusClass = (status) => {
    if (status === 'live') return styles.statusLive;
    if (status === 'upcoming') return styles.statusUpcoming;
    if (status === 'finished') return styles.statusFinished;
    return '';
  };

  // プレビュー画面（配信開始前）
  if (isPreviewing) {
    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <h3>配信プレビュー</h3>
          <p>カメラとマイクの確認をしてください</p>
        </div>

        <div className={styles.previewContent}>
          <div className={styles.previewVideo}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={styles.videoPlayer}
            />
            <div className={styles.previewControls}>
              <button
                className={`${styles.previewControlButton} ${isMuted ? styles.active : ''}`}
                onClick={toggleMute}
              >
                {isMuted ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
                <span>{isMuted ? 'ミュート中' : 'マイクON'}</span>
              </button>
              <button
                className={`${styles.previewControlButton} ${isVideoOff ? styles.active : ''}`}
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoCameraSlash size={24} /> : <VideoCamera size={24} />}
                <span>{isVideoOff ? 'カメラOFF' : 'カメラON'}</span>
              </button>
            </div>
          </div>

          <div className={styles.previewInfo}>
            <h4>{selectedLive?.title}</h4>
            <p className={styles.previewSubject}>{selectedLive?.subject}</p>
            
            {error && (
              <div className={styles.errorMessage}>
                <strong>エラー:</strong> {error}
              </div>
            )}

            <div className={styles.previewActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelPreview}
              >
                キャンセル
              </button>
              <button
                className={styles.startStreamButton}
                onClick={handleStartStreaming}
                disabled={!!error}
              >
                <Play size={20} weight="fill" />
                配信を開始
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 配信中の画面
  if (selectedLive && isStreaming) {
    return (
      <div className={styles.streamContainer}>
        <div className={styles.streamHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              配信中
            </div>
            <h3>{selectedLive.title}</h3>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.statsItem}>
              <Clock size={20} weight="fill" />
              <span>{formatDuration(streamDuration)}</span>
            </div>
            <div className={styles.statsItem}>
              <Users size={20} weight="fill" />
              <span>{viewerCount}人</span>
            </div>
          </div>
        </div>

        <div className={styles.streamContent}>
          <div className={styles.videoArea}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={styles.videoPlayer}
            />

            <div className={styles.streamControls}>
              <button
                className={`${styles.controlButton} ${isMuted ? styles.active : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'ミュート解除' : 'ミュート'}
              >
                {isMuted ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
              </button>
              <button
                className={`${styles.controlButton} ${isVideoOff ? styles.active : ''}`}
                onClick={toggleVideo}
                title={isVideoOff ? 'カメラON' : 'カメラOFF'}
              >
                {isVideoOff ? <VideoCameraSlash size={24} /> : <VideoCamera size={24} />}
              </button>
              <button
                className={`${styles.controlButton} ${isSharingScreen ? styles.active : ''}`}
                onClick={isSharingScreen ? handleStopScreenShare : handleStartScreenShare}
                title={isSharingScreen ? '画面共有を停止' : '画面を共有'}
              >
                {isSharingScreen ? <MonitorPlay size={24} /> : <Monitor size={24} />}
              </button>
              <button
                className={`${styles.controlButton} ${styles.stopButton}`}
                onClick={handleStopStreaming}
              >
                <Stop size={24} weight="fill" />
                <span>配信終了</span>
              </button>
            </div>

            {error && (
              <div className={styles.streamError}>
                {error}
              </div>
            )}
          </div>

          <div className={styles.chatArea}>
            <div className={styles.chatHeader}>
              <span>チャット</span>
              <span className={styles.chatCount}>{chatMessages.length}件</span>
            </div>
            <div className={styles.chatMessages}>
              {chatMessages.length === 0 ? (
                <div className={styles.chatEmpty}>
                  まだメッセージがありません
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div key={msg.id} className={styles.chatMessage}>
                    <div className={styles.messageHeader}>
                      <span className={styles.chatUser}>{msg.userName}</span>
                      <span className={styles.messageTime}>
                        {msg.timestamp?.toDate().toLocaleTimeString('ja-JP', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <span className={styles.chatText}>{msg.message}</span>
                  </div>
                ))
              )}
            </div>
            <div className={styles.chatInput}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="メッセージを入力..."
              />
              <button onClick={handleSendMessage}>
                <PaperPlaneRight size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Live一覧画面
  return (
    <div className={styles.liveContainer}> 
      {filterSubject && searchTerm && (
        <p className={styles.searchResult}>
          「{searchTerm}」の検索結果:
        </p>
      )}

      <div className={styles.listContainer}>
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={styles.liveItem}
            >
              <div className={styles.itemInfo}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={`${styles.itemStatus} ${getStatusClass(item.status)}`}>
                  {getStatusText(item)}
                </span>
              </div>
              
              <div className={styles.itemActions}>
                {item.status === 'live' && (
                  <button
                    className={styles.startButton}
                    onClick={() => handleStartPreview(item)}
                  >
                    <Play size={20} weight="fill" />
                    配信開始
                  </button>
                )}
                {item.status !== 'live' && (
                  <button
                    className={styles.detailButton}
                    onClick={() => onCardClick(item.id)}
                  >
                    詳細
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noDataMessage}>
            {searchTerm 
              ? `「${searchTerm}」に一致するLive配信はありません。` 
              : 'この教科のLive配信はありません。'
            }
          </p>
        )}
      </div>
    </div>
  );
}

export default LivePage;