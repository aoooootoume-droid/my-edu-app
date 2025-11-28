import { useState, useEffect } from 'react';
import styles from './SubmissionsPage.module.css';
import { onSubmissionsChange, gradeSubmission } from '../firebase';

function SubmissionsPage({ currentUser }) {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  // 提出物をリアルタイムで取得
  useEffect(() => {
    const unsubscribe = onSubmissionsChange((data) => {
      setSubmissions(data);
    });
    return () => unsubscribe();
  }, []);

  // フィルタリング
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

  // 教科一覧を取得
  const subjects = [...new Set(submissions.map(s => s.subject))];

  // 統計情報
  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s && s.grade !== null && s.grade !== undefined).length,
    ungraded: submissions.filter(s => s && (s.grade === null || s.grade === undefined)).length,
  };

  // 評価を送信
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

  // 提出日時をフォーマット
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
        <h1 className={styles.title}>📤 提出物管理</h1>
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

      {/* フィルター */}
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

      {/* 提出物一覧 */}
      <div className={styles.submissionsList}>
        {filteredSubmissions.length === 0 ? (
          <div className={styles.empty}>
            <p>📭 提出物がありません</p>
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

      {/* 詳細モーダル */}
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
                    📎 ファイルを開く
                  </a>
                </div>
              )}

              {/* 評価フォーム */}
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

              {/* 既存の評価を表示 */}
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

export default SubmissionsPage;