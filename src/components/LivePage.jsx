import { useState, useEffect, useRef } from 'react';
import styles from './LivePage.module.css';
import { 
  Play, 
  Stop, 
  Monitor, 
  Video, 
  VideoCamera,
  VideoCameraSlash,
  Microphone,
  MicrophoneSlash,
  PaperPlaneRight,
  X
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
  const [isViewing, setIsViewing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const cleanupRef = useRef(null);

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

  // ビデオ要素にストリームを設定
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 配信を開始
  const handleStartStreaming = async (liveItem) => {
    const result = await startLiveStream(
      liveItem.id,
      currentUser.uid,
      currentUser.displayName || currentUser.email
    );

    if (result.success) {
      setLocalStream(result.stream);
      setIsStreaming(true);
      setSelectedLive(liveItem);
    } else {
      alert('配信の開始に失敗しました: ' + result.error);
    }
  };

  // 配信を停止
  const handleStopStreaming = async () => {
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
    setSelectedLive(null);
    setIsSharingScreen(false);
  };

  // 視聴を開始
  const handleStartViewing = async (liveItem) => {
    const viewerId = `viewer_${currentUser.uid}_${Date.now()}`;
    
    const result = await joinLiveStream(liveItem.id, viewerId);

    if (result.success) {
      setRemoteStream(result.remoteStream);
      peerConnectionRef.current = result.peerConnection;
      cleanupRef.current = result.cleanup;
      setIsViewing(true);
      setSelectedLive(liveItem);
    } else {
      alert('視聴の開始に失敗しました: ' + result.error);
    }
  };

  // 視聴を停止
  const handleStopViewing = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    setRemoteStream(null);
    setIsViewing(false);
    setSelectedLive(null);
  };

  // 画面共有を開始
  const handleStartScreenShare = async () => {
    const result = await startScreenShare();

    if (result.success) {
      const videoTrack = result.stream.getVideoTracks()[0];
      
      // 現在のビデオトラックを置き換え
      if (localStream) {
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find(s => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        // ローカルストリームを更新
        const oldVideoTrack = localStream.getVideoTracks()[0];
        oldVideoTrack.stop();
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(videoTrack);
      }

      setIsSharingScreen(true);

      // 画面共有が終了したら元に戻す
      videoTrack.onended = () => {
        handleStopScreenShare();
      };
    } else {
      alert('画面共有の開始に失敗しました: ' + result.error);
    }
  };

  // 画面共有を停止
  const handleStopScreenShare = async () => {
    if (!localStream) return;

    // カメラに戻す
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
      currentUser.displayName || currentUser.email || '匿名',
      chatInput
    );

    setChatInput('');
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

  // 配信・視聴中の画面
  if (selectedLive && (isStreaming || isViewing)) {
    return (
      <div className={styles.streamContainer}>
        <div className={styles.streamHeader}>
          <h3>{selectedLive.title}</h3>
          <button 
            className={styles.closeButton}
            onClick={isStreaming ? handleStopStreaming : handleStopViewing}
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.streamContent}>
          <div className={styles.videoArea}>
            {isStreaming ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={styles.videoPlayer}
              />
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={styles.videoPlayer}
              />
            )}

            {isStreaming && (
              <div className={styles.streamControls}>
                <button
                  className={`${styles.controlButton} ${isMuted ? styles.active : ''}`}
                  onClick={toggleMute}
                >
                  {isMuted ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
                </button>
                <button
                  className={`${styles.controlButton} ${isVideoOff ? styles.active : ''}`}
                  onClick={toggleVideo}
                >
                  {isVideoOff ? <VideoCameraSlash size={24} /> : <VideoCamera size={24} />}
                </button>
                <button
                  className={`${styles.controlButton} ${isSharingScreen ? styles.active : ''}`}
                  onClick={isSharingScreen ? handleStopScreenShare : handleStartScreenShare}
                >
                  <Monitor size={24} />
                </button>
                <button
                  className={`${styles.controlButton} ${styles.stopButton}`}
                  onClick={handleStopStreaming}
                >
                  <Stop size={24} />
                  配信終了
                </button>
              </div>
            )}
          </div>

          <div className={styles.chatArea}>
            <div className={styles.chatHeader}>チャット</div>
            <div className={styles.chatMessages}>
              {chatMessages.map(msg => (
                <div key={msg.id} className={styles.chatMessage}>
                  <span className={styles.chatUser}>{msg.userName}:</span>
                  <span className={styles.chatText}>{msg.message}</span>
                </div>
              ))}
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
                <PaperPlaneRight size={20} />
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
                  <>
                    <button
                      className={styles.startButton}
                      onClick={() => handleStartStreaming(item)}
                    >
                      <Play size={20} weight="fill" />
                      配信開始
                    </button>
                    <button
                      className={styles.viewButton}
                      onClick={() => handleStartViewing(item)}
                    >
                      <Video size={20} weight="fill" />
                      視聴
                    </button>
                  </>
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