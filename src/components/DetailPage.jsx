import { useState, useRef } from 'react';
import styles from './DetailPage.module.css';
import { ArrowLeft, Camera } from "@phosphor-icons/react";
import { submitHomework } from '../firebase';

const renderCardContent = (card, currentUser, onSubmitSuccess) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // カメラを起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('カメラ起動エラー:', error);
      setSubmitError('カメラへのアクセスに失敗しました');
    }
  };

  // カメラを停止
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // 写真を撮影
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  // 提出処理
  const handleSubmit = async () => {
    if (!currentUser) {
      setSubmitError('ログインしてください');
      return;
    }

    if (!capturedImage && !comment.trim()) {
      setSubmitError('画像またはコメントを入力してください');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitHomework({
        homeworkId: card.id,
        studentId: currentUser.uid,
        studentName: currentUser.username || currentUser.email,
        subject: card.subject,
        homeworkTitle: card.title,
        comment: comment,
        fileUrl: capturedImage // Base64画像を保存（本番環境ではStorageにアップロード推奨）
      });

      if (result.success) {
        setSubmitSuccess(true);
        setCapturedImage(null);
        setComment('');
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 3000);
      } else {
        setSubmitError(result.error || '提出に失敗しました');
      }
    } catch (error) {
      console.error('提出エラー:', error);
      setSubmitError('エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 宿題の場合の表示
  if (card.type === 'homework') {
    return (
      <div className={styles.homeworkContent}>
        <div className={styles.homeworkInfo}>
          <h3>宿題内容</h3>
          <p className={styles.deadline}>締切: {card.deadline}</p>
          <p>{card.description || 'この宿題の詳細情報はありません。'}</p>
        </div>

        {/* 提出成功メッセージ */}
        {submitSuccess && (
          <div className={styles.successMessage}>
            提出が完了しました！
          </div>
        )}

        {/* 提出フォーム */}
        <div className={styles.submissionSection}>
          <h3>宿題を提出</h3>

          {/* カメラボタン */}
          {!showCamera && !capturedImage && (
            <button 
              className={styles.cameraButton}
              onClick={startCamera}
            >
              <Camera size={24} weight="fill" />
              カメラで撮影
            </button>
          )}

          {/* カメラプレビュー */}
          {showCamera && (
            <div className={styles.cameraContainer}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className={styles.videoPreview}
              />
              <div className={styles.cameraControls}>
                <button 
                  className={styles.captureButton}
                  onClick={capturePhoto}
                >
                  撮影
                </button>
                <button 
                  className={styles.cancelButton}
                  onClick={stopCamera}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* 撮影した画像のプレビュー */}
          {capturedImage && (
            <div className={styles.imagePreview}>
              <img src={capturedImage} alt="撮影した画像" />
              <button 
                className={styles.retakeButton}
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
              >
                撮り直し
              </button>
            </div>
          )}

          {/* コメント入力 */}
          <div className={styles.commentSection}>
            <label htmlFor="comment">コメント（任意）</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="取り組んだ感想や質問があれば記入してください..."
              rows={4}
              className={styles.commentInput}
            />
          </div>

          {/* エラーメッセージ */}
          {submitError && (
            <div className={styles.errorMessage}>
              {submitError}
            </div>
          )}

          {/* 提出ボタン */}
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting || (!capturedImage && !comment.trim())}
          >
            {isSubmitting ? '提出中...' : '提出する'}
          </button>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    );
  }

  if (card.type === 'folder' || card.type === 'print') {
    return (
      <>
        {card.imageUrl && (
          <img 
            src={card.imageUrl} 
            alt={card.title} 
            className={styles.detailImage} 
          />
        )}
        <div className={styles.content}>
          <h3>関連ファイル</h3>
          <p>（ここに添付ファイルや関連資料へのリンクが入ります）</p>
          <h3>授業メモ</h3>
          <p>（ここに {card.title} の授業メモや解説が入ります）</p>
        </div>
      </>
    );
  }
  
  if (card.type === 'qna') {
    return (
      <div className={styles.qnaContent}>
        <div className={styles.questionBox}>
          <h3>質問内容:</h3>
          <p>{card.title}（ここに詳細な質問内容が入ります）</p>
        </div>
        
        {card.status === 'answered' ? (
          <div className={styles.answerBox}>
            <h3>回答:</h3>
            <p>（ここに回答内容が入ります）</p>
          </div>
        ) : (
          <div className={styles.answerBox}>
            <p>（この質問はまだ回答されていません）</p>
          </div>
        )}
      </div>
    );
  }
  
  if (card.type === 'live') {
    return (
      <div className={styles.liveContent}>
        <div className={styles.liveStatusBox}>
          {card.status === 'live' && '配信中'}
          {card.status === 'upcoming' && `配信予定: ${card.date}`}
          {card.status === 'finished' && `配信終了: ${card.date || ''}`}
        </div>
        <p>（ここにLive配信の動画やチャットが入ります）</p>
      </div>
    );
  }
  
  if (card.type === 'notice') {
    const getNoticeTypeLabel = (type) => {
      switch(type) {
        case 'important': return '重要';
        case 'normal': return '通常';
        case 'info': return 'お知らせ';
        default: return '';
      }
    };
    
    const getNoticeTypeClass = (type) => {
      switch(type) {
        case 'important': return styles.noticeImportant;
        case 'normal': return styles.noticeNormal;
        case 'info': return styles.noticeInfo;
        default: return '';
      }
    };
    
    return (
      <div className={styles.noticeContent}>
        <div className={`${styles.noticeBadge} ${getNoticeTypeClass(card.noticeType)}`}>
          {getNoticeTypeLabel(card.noticeType)}
        </div>
        <div className={styles.noticeBody}>
          <p>{card.content}</p>
        </div>
      </div>
    );
  }
  
  if (card.type === 'test') {
    return (
      <div className={styles.testContent}>
        <div className={styles.testBadge}>
          テスト
        </div>
        <div className={styles.testBody}>
          <p>{card.content || 'テストの詳細情報がありません。'}</p>
        </div>
      </div>
    );
  }
  
  return <p>このコンテンツタイプの詳細は表示できません。</p>;
};

function DetailPage({ card, onBackClick, currentUser }) {
  
  if (!card) {
    return (
      <div>
        <button onClick={onBackClick} className={styles.backButton}>
          <ArrowLeft size={18} weight="bold" />
          <span>戻る</span>
        </button>
        <h2>アイテムが見つかりません</h2>
        <p>データが見つかりませんでした。</p>
      </div>
    );
  }
  
  const renderMetaInfo = () => {
    if (card.date) {
      return <span>{card.date}</span>;
    }
    if (card.deadline) {
      return <span>締切: {card.deadline}</span>;
    }
    return null;
  };

  return (
    <div className={styles.detailContainer}>
      <button onClick={onBackClick} className={styles.backButton}>
        <ArrowLeft size={18} weight="bold" />
        <span>戻る</span>
      </button>
      
      <h2 className={styles.title}>{card.title}</h2>
      
      <div className={styles.metaInfo}>
        {card.subject && <span>{card.subject}</span>}
        {card.subject && renderMetaInfo() && <span className={styles.separator}>|</span>}
        {renderMetaInfo()}
      </div>
      
      {renderCardContent(card, currentUser)}
      
    </div>
  );
}

export default DetailPage;