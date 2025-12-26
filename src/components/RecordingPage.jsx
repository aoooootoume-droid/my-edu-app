import { useState, useRef, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import styles from './RecordingPage.module.css';

const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;

function RecordingPage({ selectedClass }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [totalFileSize, setTotalFileSize] = useState(0);
  
  // 文字起こし関連
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState('');
  const [transcription, setTranscription] = useState('');
  
  // フォーム
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('数学');
  const [description, setDescription] = useState('');
  
  // コーデック
  const [selectedMimeType, setSelectedMimeType] = useState('');
  
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const thumbnailRef = useRef(null);

  const subjects = ['数学', '英語', '国語', '理科', '社会', '情報', '音楽', '美術', '体育', 'その他'];

  // 録画時間のフォーマット
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ファイルサイズのフォーマット
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // カメラ起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('カメラの起動に失敗:', err);
      alert('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
    }
  };

  // 録画開始
  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    
    // ブラウザがサポートするコーデックを検出
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    let mimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }
    
    if (!mimeType) {
      alert('このブラウザは録画に対応していません');
      return;
    }
    
    setSelectedMimeType(mimeType);
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: mimeType
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      generateThumbnail();
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);
    setIsPaused(false);
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // サムネイル生成
  const generateThumbnail = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      thumbnailRef.current = canvas.toDataURL('image/jpeg', 0.7);
    }
  };

  // 一時停止/再開
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
    }
    setIsPaused(!isPaused);
  };

  // 録画停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
  };

  // 録画をキャンセル（やり直し）
  const cancelRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    setTranscription('');
    setTitle('');
    setDescription('');
    thumbnailRef.current = null;
  };

  // AssemblyAI で文字起こし
  const transcribeWithAssemblyAI = async (videoUrl) => {
    if (!ASSEMBLYAI_API_KEY) {
      console.warn('AssemblyAI APIキーが設定されていません');
      return null;
    }

    try {
      setIsTranscribing(true);
      setTranscriptionProgress('文字起こしを開始しています...');

      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: videoUrl,
          language_code: 'ja'
        })
      });

      if (!response.ok) {
        throw new Error('文字起こしの開始に失敗しました');
      }

      const { id } = await response.json();
      setTranscriptionProgress('音声を解析中...');

      let result = null;
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
          headers: { 'Authorization': ASSEMBLYAI_API_KEY }
        });
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          result = statusData;
          break;
        } else if (statusData.status === 'error') {
          throw new Error(statusData.error || '文字起こしに失敗しました');
        }
        
        setTranscriptionProgress(`音声を解析中... (${Math.min(attempts * 5, 95)}%)`);
        attempts++;
      }

      if (!result) {
        throw new Error('文字起こしがタイムアウトしました');
      }

      let transcriptText = '';
      if (result.words && result.words.length > 0) {
        let currentParagraph = [];
        let paragraphStartTime = 0;
        
        result.words.forEach((word) => {
          if (currentParagraph.length === 0) {
            paragraphStartTime = word.start;
          }
          currentParagraph.push(word.text);
          
          if (word.text.includes('。') || word.text.includes('？') || word.text.includes('！') || currentParagraph.length >= 10) {
            const timeSeconds = Math.floor(paragraphStartTime / 1000);
            const mins = Math.floor(timeSeconds / 60);
            const secs = timeSeconds % 60;
            const timestamp = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
            transcriptText += `${timestamp} ${currentParagraph.join('')}\n`;
            currentParagraph = [];
          }
        });
        
        if (currentParagraph.length > 0) {
          const timeSeconds = Math.floor(paragraphStartTime / 1000);
          const mins = Math.floor(timeSeconds / 60);
          const secs = timeSeconds % 60;
          const timestamp = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
          transcriptText += `${timestamp} ${currentParagraph.join('')}\n`;
        }
      } else if (result.text) {
        transcriptText = result.text;
      }

      setTranscriptionProgress('文字起こし完了！');
      return transcriptText;

    } catch (error) {
      console.error('文字起こしエラー:', error);
      setTranscriptionProgress(`エラー: ${error.message}`);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  // アップロード
  const handleUpload = async () => {
    if (!recordedBlob || !title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('準備中...');

    try {
      const timestamp = Date.now();
      
      let thumbnailUrl = null;
      if (thumbnailRef.current) {
        setUploadStatus('サムネイルをアップロード中...');
        const thumbnailBlob = await fetch(thumbnailRef.current).then(r => r.blob());
        const thumbnailStorageRef = ref(storage, `thumbnails/${timestamp}.jpg`);
        await uploadBytesResumable(thumbnailStorageRef, thumbnailBlob);
        thumbnailUrl = await getDownloadURL(thumbnailStorageRef);
      }
      
      setUploadStatus('動画をアップロード中...');
      const ext = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
      const videoStorageRef = ref(storage, `recordings/${timestamp}.${ext}`);
      
      const uploadTask = uploadBytesResumable(videoStorageRef, recordedBlob);
      setTotalFileSize(recordedBlob.size);
      
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
            setUploadedFileSize(snapshot.bytesTransferred);
          },
          (error) => reject(error),
          () => resolve()
        );
      });
      
      const videoUrl = await getDownloadURL(videoStorageRef);
      
      setUploadStatus('文字起こしを実行中...');
      let finalTranscription = transcription;
      
      if (ASSEMBLYAI_API_KEY) {
        const assemblyTranscript = await transcribeWithAssemblyAI(videoUrl);
        if (assemblyTranscript) {
          finalTranscription = assemblyTranscript;
          setTranscription(assemblyTranscript);
        }
      }
      
      setUploadStatus('データベースに保存中...');
      await addDoc(collection(db, 'recordings'), {
        title: title.trim(),
        subject,
        description: description.trim(),
        className: selectedClass || null,
        videoUrl,
        thumbnailUrl,
        duration: recordingTime,
        transcription: finalTranscription,
        hasTranscription: !!finalTranscription,
        createdAt: serverTimestamp()
      });
      
      setUploadStatus('完了！');
      alert('✅ アップロードが完了しました！');
      
      setRecordedBlob(null);
      setRecordingTime(0);
      setTitle('');
      setDescription('');
      setTranscription('');
      setUploadProgress(0);
      thumbnailRef.current = null;
      
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('❌ アップロードに失敗しました: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, []);

  // ===== 録画前の画面 =====
  if (!recordedBlob) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.pageTitle}>🎥 授業を録画</h2>
          {selectedClass && <span className={styles.classLabel}>{selectedClass}</span>}
        </div>

        {ASSEMBLYAI_API_KEY ? (
          <div className={styles.apiReady}>✅ 文字起こし対応（全ブラウザOK）</div>
        ) : (
          <div className={styles.apiNotReady}>⚠️ 文字起こし未設定</div>
        )}
        
        <div className={styles.cameraSection}>
          <div className={styles.cameraContainer}>
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className={styles.cameraVideo}
            />
            
            {isRecording && (
              <div className={styles.recordingBadge}>
                <span className={styles.recordingDot}></span>
                {isPaused ? '一時停止中' : 'REC'}
              </div>
            )}
            
            <div className={styles.timeOverlay}>
              {formatTime(recordingTime)}
            </div>
          </div>
          
          <div className={styles.cameraControls}>
            {!isRecording ? (
              <button onClick={startRecording} className={styles.startBtn}>
                <span className={styles.startIcon}>⏺</span>
                録画開始
              </button>
            ) : (
              <>
                <button onClick={togglePause} className={styles.pauseBtn}>
                  {isPaused ? '▶️ 再開' : '⏸️ 一時停止'}
                </button>
                <button onClick={stopRecording} className={styles.stopBtn}>
                  ⏹️ 録画終了
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== 録画後のアップロード画面 =====
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>📤 録画をアップロード</h2>
      </div>

      <div className={styles.uploadLayout}>
        {/* 左側：プレビュー */}
        <div className={styles.previewSection}>
          <div className={styles.previewCard}>
            <video 
              ref={previewVideoRef}
              src={URL.createObjectURL(recordedBlob)} 
              controls 
              className={styles.previewVideo}
            />
            <div className={styles.previewInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>録画時間</span>
                <span className={styles.infoValue}>{formatTime(recordingTime)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>ファイルサイズ</span>
                <span className={styles.infoValue}>{formatFileSize(recordedBlob.size)}</span>
              </div>
            </div>
          </div>
          
          <button onClick={cancelRecording} className={styles.retakeBtn}>
            🔄 撮り直す
          </button>
        </div>

        {/* 右側：フォーム */}
        <div className={styles.formSection}>
          <div className={styles.formCard}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                タイトル <span className={styles.required}>*必須</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 第5回 二次関数の応用"
                className={styles.input}
                autoFocus
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>教科</label>
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className={styles.select}
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>説明（任意）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="授業の内容や補足事項など"
                className={styles.textarea}
                rows={4}
              />
            </div>

            {ASSEMBLYAI_API_KEY && (
              <div className={styles.transcriptNote}>
                💡 アップロード後、自動で文字起こしされます（約1〜3分）
              </div>
            )}
            
            <button 
              onClick={handleUpload} 
              className={styles.uploadBtn}
              disabled={!title.trim()}
            >
              📤 アップロードする
            </button>
          </div>
        </div>
      </div>

      {/* アップロード中のモーダル */}
      {isUploading && (
        <div className={styles.uploadModal}>
          <div className={styles.uploadModalContent}>
            <div className={styles.spinner}></div>
            <h3 className={styles.uploadTitle}>{uploadStatus}</h3>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className={styles.progressText}>
                  {uploadProgress.toFixed(0)}% （{formatFileSize(uploadedFileSize)} / {formatFileSize(totalFileSize)}）
                </p>
              </div>
            )}
            
            {isTranscribing && (
              <p className={styles.transcribingText}>🎤 {transcriptionProgress}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordingPage;