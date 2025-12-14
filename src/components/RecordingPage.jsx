import { useState, useRef, useEffect } from 'react';
import { db, storage } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './RecordingPage.module.css';

const RecordingPage = ({ selectedClass }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [stream, setStream] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  // フォーム入力
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  // カメラ起動
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('カメラアクセスエラー:', error);
        alert('カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // サムネイルを生成
  const generateThumbnail = () => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve(null);
        return;
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  };

  // 録画開始
  const startRecording = () => {
    if (!stream) return;

    const options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }

    const mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorderRef.current = mediaRecorder;

    const chunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      setRecordedChunks(chunks);
      
      // サムネイルを生成
      const thumbnail = await generateThumbnail();
      setThumbnailBlob(thumbnail);
      if (thumbnail) {
        setThumbnailPreview(URL.createObjectURL(thumbnail));
      }
      
      setShowSaveForm(true);
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // 録画一時停止/再開
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
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsPaused(false);
    clearInterval(timerRef.current);
  };

  // 時間フォーマット
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Firebaseに保存
  const saveRecording = async () => {
    if (recordedChunks.length === 0) {
      alert('録画データがありません');
      return;
    }

    if (!title.trim()) {
      alert('授業タイトルを入力してください');
      return;
    }

    setIsUploading(true);

    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const timestamp = Date.now();
      
      // 動画をアップロード
      const videoFilename = `recordings/${timestamp}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.webm`;
      const videoStorageRef = ref(storage, videoFilename);
      await uploadBytes(videoStorageRef, blob);
      const videoURL = await getDownloadURL(videoStorageRef);

      // サムネイルをアップロード
      let thumbnailURL = null;
      if (thumbnailBlob) {
        const thumbFilename = `thumbnails/${timestamp}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
        const thumbStorageRef = ref(storage, thumbFilename);
        await uploadBytes(thumbStorageRef, thumbnailBlob);
        thumbnailURL = await getDownloadURL(thumbStorageRef);
      }

      await addDoc(collection(db, 'recordings'), {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        videoUrl: videoURL,
        thumbnailUrl: thumbnailURL,
        duration: recordingTime,
        className: selectedClass || null,
        createdAt: serverTimestamp(),
        fileSize: blob.size
      });

      alert('授業アーカイブの保存が完了しました！');
      
      // フォームをリセット
      setRecordedChunks([]);
      setRecordingTime(0);
      setTitle('');
      setSubject('');
      setDescription('');
      setShowSaveForm(false);
      setThumbnailBlob(null);
      setThumbnailPreview(null);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存中にエラーが発生しました: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 録画破棄
  const discardRecording = () => {
    if (window.confirm('録画を破棄しますか？')) {
      setRecordedChunks([]);
      setRecordingTime(0);
      setTitle('');
      setSubject('');
      setDescription('');
      setShowSaveForm(false);
      setThumbnailBlob(null);
      setThumbnailPreview(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>授業録画</h1>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={styles.video}
          />
          
          <div className={styles.controls}>
            <div className={styles.timer}>
              {isRecording && <span className={styles.recordingDot}>●</span>}
              {formatTime(recordingTime)}
            </div>

            <div className={styles.buttons}>
              {!isRecording && recordedChunks.length === 0 && (
                <button onClick={startRecording} className={styles.startBtn}>
                  録画開始
                </button>
              )}

              {isRecording && (
                <>
                  <button onClick={togglePause} className={styles.pauseBtn}>
                    {isPaused ? '再開' : '一時停止'}
                  </button>
                  <button onClick={stopRecording} className={styles.stopBtn}>
                    停止
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {showSaveForm && (
          <div className={styles.saveForm}>
            <h2 className={styles.formTitle}>授業情報を入力</h2>
            
            {thumbnailPreview && (
              <div className={styles.thumbnailPreview}>
                <label>サムネイル</label>
                <img src={thumbnailPreview} alt="サムネイル" />
              </div>
            )}
            
            <div className={styles.inputGroup}>
              <label>授業タイトル *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 数学 - 二次関数の応用"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>科目</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={styles.select}
              >
                <option value="">選択してください</option>
                <option value="国語">国語</option>
                <option value="数学">数学</option>
                <option value="英語">英語</option>
                <option value="理科">理科</option>
                <option value="社会">社会</option>
                <option value="音楽">音楽</option>
                <option value="美術">美術</option>
                <option value="保健体育">保健体育</option>
                <option value="技術">技術</option>
                <option value="家庭">家庭</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>説明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="授業の内容や重要なポイントを記入"
                className={styles.textarea}
                rows="4"
              />
            </div>

            <div className={styles.formButtons}>
              <button
                onClick={saveRecording}
                disabled={isUploading}
                className={styles.saveBtn}
              >
                {isUploading ? 'アップロード中...' : '保存する'}
              </button>
              <button
                onClick={discardRecording}
                disabled={isUploading}
                className={styles.discardBtn}
              >
                破棄する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingPage;