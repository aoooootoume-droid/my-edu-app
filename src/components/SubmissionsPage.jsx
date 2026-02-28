import { useState, useEffect, useRef } from 'react';
import styles from './SubmissionsPage.module.css';
import { db, storage } from '../firebase/config';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onSubmissionsChange, gradeSubmission, onHomeworksChange, submitHomework } from '../firebase';

function SubmissionsPage({ currentUser, selectedClass }) {
  const isTeacher = currentUser?.role === 'teacher';

  if (isTeacher) {
    return <TeacherSubmissionsView currentUser={currentUser} selectedClass={selectedClass} />;
  } else {
    return <StudentSubmissionsView currentUser={currentUser} selectedClass={selectedClass} />;
  }
}

// ============================================
// 教師用ビュー（既存のまま）
// ============================================
function TeacherSubmissionsView({ currentUser, selectedClass }) {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    const unsubscribe = onSubmissionsChange((data) => {
      const filtered = selectedClass 
        ? data.filter(s => s.className === selectedClass || !s.className)
        : data;
      setSubmissions(filtered);
    });
    return () => unsubscribe();
  }, [selectedClass]);

  useEffect(() => {
    let filtered = submissions;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(s => s.subject === selectedSubject);
    }

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'graded') {
        filtered = filtered.filter(s => s.grade !== null);
      } else if (selectedStatus === 'ungraded') {
        filtered = filtered.filter(s => s.grade === null);
      }
    }

    setFilteredSubmissions(filtered);
  }, [submissions, selectedSubject, selectedStatus]);

  const subjects = [...new Set(submissions.map(s => s.subject))];

  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s && s.grade !== null && s.grade !== undefined).length,
    ungraded: submissions.filter(s => s && (s.grade === null || s.grade === undefined)).length,
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission || !gradeInput) return;

    const result = await gradeSubmission(
      selectedSubmission.id,
      gradeInput,
      feedbackInput
    );

    if (result.success) {
      alert('評価を保存しました！');
      setSelectedSubmission(null);
      setGradeInput('');
      setFeedbackInput('');
    } else {
      alert('エラーが発生しました: ' + result.error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '未提出';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>提出物管理</h1>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.total}</div>
            <div className={styles.statLabel}>全提出物</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.ungraded}</div>
            <div className={styles.statLabel}>未採点</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.graded}</div>
            <div className={styles.statLabel}>採点済み</div>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>教科:</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={styles.select}
          >
            <option value="all">すべて</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>状態:</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.select}
          >
            <option value="all">すべて</option>
            <option value="ungraded">未採点</option>
            <option value="graded">採点済み</option>
          </select>
        </div>
      </div>

      <div className={styles.submissionsList}>
        {filteredSubmissions.length === 0 ? (
          <div className={styles.empty}>
            <p>提出物がありません</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>生徒名</th>
                <th>教科</th>
                <th>宿題タイトル</th>
                <th>提出日時</th>
                <th>評価</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(submission => (
                <tr key={submission.id}>
                  <td className={styles.studentName}>
                    <div className={styles.avatar}>
                      {submission.studentName ? submission.studentName.charAt(0) : '?'}
                    </div>
                    {submission.studentName || '名前なし'}
                  </td>
                  <td>
                    <span className={styles.subjectBadge}>
                      {submission.subject || '教科なし'}
                    </span>
                  </td>
                  <td>{submission.homeworkTitle || 'タイトルなし'}</td>
                  <td className={styles.date}>
                    {formatDate(submission.submittedAt)}
                  </td>
                  <td>
                    {submission.grade ? (
                      <span className={styles.gradeBadge}>
                        {submission.grade}
                      </span>
                    ) : (
                      <span className={styles.ungradedBadge}>未採点</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={styles.viewButton}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedSubmission && (
        <div className={styles.modal} onClick={() => setSelectedSubmission(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>提出物の詳細</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedSubmission(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>生徒名:</label>
                  <span>{selectedSubmission.studentName}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>教科:</label>
                  <span>{selectedSubmission.subject}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>宿題:</label>
                  <span>{selectedSubmission.homeworkTitle}</span>
                </div>
                <div className={styles.infoItem}>
                  <label>提出日時:</label>
                  <span>{formatDate(selectedSubmission.submittedAt)}</span>
                </div>
              </div>

              {selectedSubmission.comment && (
                <div className={styles.commentSection}>
                  <label>生徒のコメント:</label>
                  <p className={styles.comment}>{selectedSubmission.comment}</p>
                </div>
              )}

              {selectedSubmission.fileUrl && (
                <div className={styles.fileSection}>
                  <label>提出ファイル:</label>
                  <a 
                    href={selectedSubmission.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.fileLink}
                  >
                    ファイルを開く
                  </a>
                </div>
              )}

              <form onSubmit={handleGradeSubmit} className={styles.gradeForm}>
                <h3>評価を入力</h3>
                
                <div className={styles.formGroup}>
                  <label htmlFor="grade">評価 *</label>
                  <select
                    id="grade"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    className={styles.input}
                    required
                  >
                    <option value="">選択してください</option>
                    <option value="A">A（優秀）</option>
                    <option value="B">B（良好）</option>
                    <option value="C">C（普通）</option>
                    <option value="D">D（要改善）</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="feedback">フィードバック</label>
                  <textarea
                    id="feedback"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className={styles.textarea}
                    placeholder="生徒へのコメントを入力..."
                    rows={4}
                  />
                </div>

                <button type="submit" className={styles.submitButton}>
                  評価を保存
                </button>
              </form>

              {selectedSubmission.grade && (
                <div className={styles.existingGrade}>
                  <h3>現在の評価</h3>
                  <div className={styles.gradeDisplay}>
                    <span className={styles.gradeLarge}>{selectedSubmission.grade}</span>
                    {selectedSubmission.feedback && (
                      <p className={styles.feedbackText}>{selectedSubmission.feedback}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 生徒用ビュー（新規）
// ============================================
function StudentSubmissionsView({ currentUser, selectedClass }) {
  const [homeworks, setHomeworks] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 宿題一覧を取得
  useEffect(() => {
    const unsubscribe = onHomeworksChange((data) => {
      const filtered = selectedClass 
        ? data.filter(h => h.className === selectedClass || !h.className)
        : data;
      // 締め切りでソート（近い順）
      filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      setHomeworks(filtered);
    });
    return () => unsubscribe();
  }, [selectedClass]);

  // 自分の提出物を取得
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'submissions'),
      where('studentId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMySubmissions(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 提出済みかチェック
  const isSubmitted = (homeworkId) => {
    return mySubmissions.some(s => s.homeworkId === homeworkId);
  };

  // 提出情報を取得
  const getSubmission = (homeworkId) => {
    return mySubmissions.find(s => s.homeworkId === homeworkId);
  };

  // 締め切りまでの日数
  const getDaysUntilDeadline = (deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // 締め切りステータス
  const getDeadlineStatus = (deadline) => {
    const days = getDaysUntilDeadline(deadline);
    if (days < 0) return { text: '締切超過', class: styles.deadlineOverdue };
    if (days === 0) return { text: '今日まで', class: styles.deadlineToday };
    if (days <= 3) return { text: `あと${days}日`, class: styles.deadlineSoon };
    return { text: `あと${days}日`, class: styles.deadlineNormal };
  };

  // カメラを起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraMode(true);
    } catch (err) {
      console.error('カメラ起動エラー:', err);
      alert('カメラを起動できませんでした');
    }
  };

  // カメラを停止
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraMode(false);
  };

  // 写真を撮影
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      setCapturedImage(blob);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // ファイル選択
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setCapturedImage(null);
    }
  };

  // 提出処理
  const handleSubmit = async () => {
    if (!selectedHomework) return;
    if (!selectedFile && !capturedImage) {
      alert('ファイルまたは写真を選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const fileToUpload = capturedImage || selectedFile;
      const fileName = capturedImage 
        ? `photo_${Date.now()}.jpg` 
        : selectedFile.name;
      
      const storageRef = ref(storage, `submissions/${Date.now()}_${currentUser.uid}_${fileName}`);
      await uploadBytes(storageRef, fileToUpload);
      const fileUrl = await getDownloadURL(storageRef);

      await submitHomework({
        homeworkId: selectedHomework.id,
        studentId: currentUser.uid,
        studentName: currentUser.displayName || currentUser.email,
        subject: selectedHomework.subject,
        homeworkTitle: selectedHomework.title,
        fileUrl: fileUrl,
        comment: comment,
        className: selectedClass
      });

      alert('提出が完了しました！');
      setSelectedHomework(null);
      setSelectedFile(null);
      setCapturedImage(null);
      setComment('');
    } catch (err) {
      console.error('提出エラー:', err);
      alert('提出に失敗しました: ' + err.message);
    }

    setIsSubmitting(false);
  };

  // モーダルを閉じる
  const closeModal = () => {
    stopCamera();
    setSelectedHomework(null);
    setSelectedFile(null);
    setCapturedImage(null);
    setComment('');
  };

  // 統計
  const stats = {
    total: homeworks.length,
    submitted: homeworks.filter(h => isSubmitted(h.id)).length,
    pending: homeworks.filter(h => !isSubmitted(h.id)).length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>課題一覧</h1>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.total}</div>
            <div className={styles.statLabel}>全課題</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.pending}</div>
            <div className={styles.statLabel}>未提出</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.submitted}</div>
            <div className={styles.statLabel}>提出済み</div>
          </div>
        </div>
      </div>

      {/* 課題一覧 */}
      <div className={styles.homeworkList}>
        {homeworks.length === 0 ? (
          <div className={styles.empty}>
            <p>課題がありません</p>
          </div>
        ) : (
          homeworks.map(homework => {
            const submitted = isSubmitted(homework.id);
            const submission = getSubmission(homework.id);
            const deadlineStatus = getDeadlineStatus(homework.deadline);

            return (
              <div 
                key={homework.id} 
                className={`${styles.homeworkCard} ${submitted ? styles.submitted : ''}`}
              >
                <div className={styles.homeworkHeader}>
                  <span className={styles.subjectBadge}>{homework.subject}</span>
                  <span className={deadlineStatus.class}>{deadlineStatus.text}</span>
                </div>

                <h3 className={styles.homeworkTitle}>{homework.title}</h3>
                
                <div className={styles.homeworkMeta}>
                  <span>締切: {homework.deadline}</span>
                </div>

                {homework.description && (
                  <p className={styles.homeworkDesc}>{homework.description}</p>
                )}

                <div className={styles.homeworkFooter}>
                  {submitted ? (
                    <div className={styles.submittedInfo}>
                      <span className={styles.submittedBadge}>✓ 提出済み</span>
                      {submission?.grade && (
                        <span className={styles.gradeBadge}>{submission.grade}</span>
                      )}
                    </div>
                  ) : (
                    <button
                      className={styles.submitBtn}
                      onClick={() => setSelectedHomework(homework)}
                    >
                      提出する
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 提出モーダル */}
      {selectedHomework && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>課題を提出</h2>
              <button className={styles.closeButton} onClick={closeModal}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.homeworkInfo}>
                <span className={styles.subjectBadge}>{selectedHomework.subject}</span>
                <h3>{selectedHomework.title}</h3>
                <p>締切: {selectedHomework.deadline}</p>
              </div>

              {/* カメラモード */}
              {cameraMode ? (
                <div className={styles.cameraSection}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={styles.cameraPreview}
                  />
                  <div className={styles.cameraButtons}>
                    <button className={styles.captureBtn} onClick={capturePhoto}>
                      撮影
                    </button>
                    <button className={styles.cancelBtn} onClick={stopCamera}>
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : capturedImage ? (
                <div className={styles.previewSection}>
                  <img
                    src={URL.createObjectURL(capturedImage)}
                    alt="撮影した画像"
                    className={styles.imagePreview}
                  />
                  <button
                    className={styles.retakeBtn}
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera();
                    }}
                  >
                    撮り直す
                  </button>
                </div>
              ) : selectedFile ? (
                <div className={styles.previewSection}>
                  <div className={styles.filePreview}>
                    <span>{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)}>✕</button>
                  </div>
                </div>
              ) : (
                <div className={styles.uploadOptions}>
                  <button className={styles.optionBtn} onClick={startCamera}>
                    カメラで撮影
                  </button>
                  <label className={styles.optionBtn}>
                    ファイルを選択
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      hidden
                    />
                  </label>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>コメント（任意）</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="先生へのコメントがあれば入力..."
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={isSubmitting || (!selectedFile && !capturedImage)}
              >
                {isSubmitting ? '提出中...' : '提出する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionsPage;