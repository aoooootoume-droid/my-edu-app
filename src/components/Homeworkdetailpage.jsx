import { useState, useRef, useEffect } from 'react';
import styles from './HomeworkDetailPage.module.css';
import { db, storage } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { submitHomework } from '../firebase';

function HomeworkDetailPage({ homeworkId, currentUser, onBack }) {
  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // 宿題データを取得
  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'homeworks', homeworkId));
        if (docSnap.exists()) {
          setHomework({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('宿題取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [homeworkId]);

  // カメラを起動
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('カメラアクセスエラー:', error);
      alert('カメラへのアクセスが拒否されました');
    }
  };

  // カメラを停止
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // 写真を撮影
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      setCapturedImage({
        blob,
        preview: URL.createObjectURL(blob)
      });
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // 撮り直し
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // ファイル選択
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setCapturedImage(null); // カメラ画像をクリア
    }
  };

  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 提出
  const handleSubmit = async () => {
    if (!capturedImage && !selectedFile) {
      alert('写真を撮影するか、ファイルを選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      let fileUrl = null;

      // ファイルをアップロード
      if (capturedImage) {
        const filename = `submissions/${timestamp}_${currentUser.uid}_photo.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, capturedImage.blob);
        fileUrl = await getDownloadURL(storageRef);
      } else if (selectedFile) {
        const filename = `submissions/${timestamp}_${currentUser.uid}_${selectedFile.name}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(storageRef);
      }

      // 提出データを保存
      const result = await submitHomework({
        homeworkId: homework.id,
        studentId: currentUser.uid,
        studentName: currentUser.displayName || currentUser.email,
        subject: homework.subject,
        homeworkTitle: homework.title,
        fileUrl,
        comment: comment.trim(),
        className: homework.className
      });

      if (result.success) {
        alert('✅ 提出が完了しました！');
        onBack();
      } else {
        alert('提出に失敗しました');
      }
    } catch (error) {
      console.error('提出エラー:', error);
      alert('エラーが発生しました: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (loading) {
    return <div className={styles.loading}>読み込み中...</div>;
  }

  if (!homework) {
    return <div className={styles.error}>宿題が見つかりませんでした</div>;
  }

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← 戻る
        </button>
        <h1 className={styles.title}>宿題の詳細</h1>
      </div>

      {/* 宿題情報 */}
      <div className={styles.homeworkInfo}>
        <h2 className={styles.homeworkTitle}>{homework.title}</h2>
        <div className={styles.metaInfo}>
          <span className={styles.subject}>{homework.subject}</span>
          <span className={styles.deadline}>締切: {homework.deadline}</span>
        </div>
        {homework.description && (
          <p className={styles.description}>{homework.description}</p>
        )}
      </div>

      {/* 提出セクション */}
      <div className={styles.submitSection}>
        <h3 className={styles.sectionTitle}>📤 提出する</h3>

        {/* カメラプレビュー */}
        {showCamera && (
          <div className={styles.cameraContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={styles.cameraVideo}
            />
            <div className={styles.cameraControls}>
              <button className={styles.captureButton} onClick={capturePhoto}>
                📸 撮影
              </button>
              <button className={styles.cancelButton} onClick={stopCamera}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 撮影した画像プレビュー */}
        {capturedImage && (
          <div className={styles.previewContainer}>
            <img src={capturedImage.preview} alt="撮影画像" className={styles.previewImage} />
            <button className={styles.retakeButton} onClick={retakePhoto}>
              📷 撮り直す
            </button>
          </div>
        )}

        {/* 選択したファイルプレビュー */}
        {selectedFile && (
          <div className={styles.filePreview}>
            <div className={styles.fileIcon}>📎</div>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <button 
              className={styles.removeFile}
              onClick={() => setSelectedFile(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* ボタン群 */}
        {!showCamera && !capturedImage && (
          <div className={styles.uploadOptions}>
            <button className={styles.cameraButton} onClick={startCamera}>
              📷 カメラで撮影
            </button>
            <button className={styles.fileButton} onClick={openFileDialog}>
              📁 ファイルを選択
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* コメント */}
        <div className={styles.commentSection}>
          <label>コメント（任意）</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="先生へのコメントがあれば入力..."
            className={styles.commentInput}
            rows={3}
          />
        </div>

        {/* 提出ボタン */}
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isSubmitting || (!capturedImage && !selectedFile)}
        >
          {isSubmitting ? '提出中...' : '✅ 提出する'}
        </button>
      </div>

      {/* 非表示のキャンバス（撮影用） */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default HomeworkDetailPage;