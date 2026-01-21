import { useState, useEffect } from 'react';
import { getQuizzes, getQuiz } from '../firebase';
import styles from './QuizPage.module.css';

const QuizPage = ({ currentUser, selectedClass }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0:リスト, 1:神ノート, 2:Step1, 3:Step2, 4:Step3
  const [loading, setLoading] = useState(true);
  
  // 各ステップの状態
  const [revealedKeywords, setRevealedKeywords] = useState([]);
  const [step1Answers, setStep1Answers] = useState({});
  const [step1Results, setStep1Results] = useState({});
  const [step2Revealed, setStep2Revealed] = useState({});
  const [step3Answers, setStep3Answers] = useState({});
  const [step3Revealed, setStep3Revealed] = useState({});

  // クイズ一覧を取得
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!currentUser?.schoolCode) return;
      
      setLoading(true);
      const classCode = currentUser.classCode;
      const data = await getQuizzes(currentUser.schoolCode, classCode);
      setQuizzes(data);
      setLoading(false);
    };
    
    fetchQuizzes();
  }, [currentUser, selectedClass]);

  // クイズを選択
  const handleSelectQuiz = async (quizId) => {
    const { success, data } = await getQuiz(quizId);
    if (success) {
      setSelectedQuiz(data);
      resetState();
      setCurrentStep(1); // 神ノートから開始
    }
  };

  // 状態をリセット
  const resetState = () => {
    setRevealedKeywords([]);
    setStep1Answers({});
    setStep1Results({});
    setStep2Revealed({});
    setStep3Answers({});
    setStep3Revealed({});
  };

  // 一覧に戻る
  const handleBackToList = () => {
    setSelectedQuiz(null);
    setCurrentStep(0);
    resetState();
  };

  // キーワードをタップして表示
  const handleKeywordReveal = (index) => {
    if (!revealedKeywords.includes(index)) {
      setRevealedKeywords([...revealedKeywords, index]);
    }
  };

  // Step1: 選択式の回答
  const handleStep1Answer = (questionIndex, optionIndex) => {
    if (step1Results[questionIndex] !== undefined) return; // 既に回答済み
    
    const isCorrect = selectedQuiz.step1[questionIndex].correctIndex === optionIndex;
    setStep1Answers({ ...step1Answers, [questionIndex]: optionIndex });
    setStep1Results({ ...step1Results, [questionIndex]: isCorrect });
  };

  // Step2: 穴埋めの正解を表示
  const handleStep2Reveal = (index) => {
    setStep2Revealed({ ...step2Revealed, [index]: true });
  };

  // Step3: 記述式の入力
  const handleStep3Input = (index, value) => {
    setStep3Answers({ ...step3Answers, [index]: value });
  };

  // Step3: 模範解答を表示
  const handleStep3Reveal = (index) => {
    setStep3Revealed({ ...step3Revealed, [index]: true });
  };

  // 神ノートのコンテンツをレンダリング（キーワードをグレーアウト）
  const renderSummaryContent = () => {
    if (!selectedQuiz?.summary) return null;
    
    const { content, keywords } = selectedQuiz.summary;
    if (!keywords || keywords.length === 0) {
      return <p className={styles.summaryText}>{content}</p>;
    }

    // キーワードでコンテンツを分割してレンダリング
    let result = [];
    let lastIndex = 0;
    
    // キーワードを位置でソート
    const sortedKeywords = [...keywords].sort((a, b) => a.startIndex - b.startIndex);
    
    sortedKeywords.forEach((kw, idx) => {
      // キーワード前のテキスト
      if (kw.startIndex > lastIndex) {
        result.push(
          <span key={`text-${idx}`}>
            {content.substring(lastIndex, kw.startIndex)}
          </span>
        );
      }
      
      // キーワード部分
      const isRevealed = revealedKeywords.includes(idx);
      result.push(
        <span
          key={`kw-${idx}`}
          className={`${styles.keyword} ${isRevealed ? styles.revealed : ''}`}
          onClick={() => handleKeywordReveal(idx)}
        >
          {isRevealed ? kw.word : '　'.repeat(kw.word.length)}
        </span>
      );
      
      lastIndex = kw.endIndex;
    });
    
    // 残りのテキスト
    if (lastIndex < content.length) {
      result.push(
        <span key="text-last">{content.substring(lastIndex)}</span>
      );
    }
    
    return <p className={styles.summaryText}>{result}</p>;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  // ==================== 神ノート ====================
  if (currentStep === 1 && selectedQuiz) {
    return (
      <div className={styles.container}>
        <div className={styles.stepHeader}>
          <button className={styles.backLink} onClick={handleBackToList}>
            ← 戻る
          </button>
          <div className={styles.stepIndicator}>
            <span className={styles.stepActive}>神ノート</span>
            <span>→</span>
            <span>Step1</span>
            <span>→</span>
            <span>Step2</span>
            <span>→</span>
            <span>Step3</span>
          </div>
        </div>

        <div className={styles.noteCard}>
          <div className={styles.noteHeader}>
            <span className={styles.noteIcon}>📖</span>
            <h2>神ノート</h2>
          </div>
          <h3 className={styles.noteTitle}>{selectedQuiz.summary?.title || selectedQuiz.title}</h3>
          
          <div className={styles.summaryContent}>
            {renderSummaryContent()}
          </div>
          
          <p className={styles.hint}>
            💡 グレーの部分をタップしてキーワードを確認しよう！
          </p>
          
          <div className={styles.keywordProgress}>
            <span>{revealedKeywords.length} / {selectedQuiz.summary?.keywords?.length || 0} 確認済み</span>
          </div>
        </div>

        <button 
          className={styles.nextButton}
          onClick={() => setCurrentStep(2)}
        >
          Step1 へ進む →
        </button>
      </div>
    );
  }

  // ==================== Step1: 選択式 ====================
  if (currentStep === 2 && selectedQuiz) {
    const step1 = selectedQuiz.step1 || [];
    const allAnswered = step1.length > 0 && Object.keys(step1Results).length === step1.length;
    const correctCount = Object.values(step1Results).filter(r => r).length;

    return (
      <div className={styles.container}>
        <div className={styles.stepHeader}>
          <button className={styles.backLink} onClick={() => setCurrentStep(1)}>
            ← 神ノート
          </button>
          <div className={styles.stepIndicator}>
            <span className={styles.stepDone}>神ノート ✓</span>
            <span>→</span>
            <span className={styles.stepActive}>Step1</span>
            <span>→</span>
            <span>Step2</span>
            <span>→</span>
            <span>Step3</span>
          </div>
        </div>

        <div className={styles.stepCard}>
          <div className={styles.stepCardHeader}>
            <span className={styles.stepNumber}>1</span>
            <div>
              <h2>基礎用語</h2>
              <p>選択式問題</p>
            </div>
          </div>

          {step1.map((q, idx) => (
            <div key={idx} className={styles.questionBlock}>
              <p className={styles.questionText}>Q{idx + 1}. {q.question}</p>
              <div className={styles.options}>
                {q.options.map((opt, optIdx) => {
                  const isSelected = step1Answers[idx] === optIdx;
                  const isCorrect = q.correctIndex === optIdx;
                  const showResult = step1Results[idx] !== undefined;
                  
                  let optionClass = styles.option;
                  if (showResult) {
                    if (isCorrect) optionClass += ` ${styles.correct}`;
                    else if (isSelected) optionClass += ` ${styles.incorrect}`;
                  } else if (isSelected) {
                    optionClass += ` ${styles.selected}`;
                  }
                  
                  return (
                    <button
                      key={optIdx}
                      className={optionClass}
                      onClick={() => handleStep1Answer(idx, optIdx)}
                      disabled={showResult}
                    >
                      {opt}
                      {showResult && isCorrect && <span className={styles.badge}>✓</span>}
                      {showResult && isSelected && !isCorrect && <span className={styles.badge}>✗</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {allAnswered && (
            <div className={styles.resultBanner}>
              <span>結果: {correctCount} / {step1.length} 正解！</span>
            </div>
          )}
        </div>

        <button 
          className={styles.nextButton}
          onClick={() => setCurrentStep(3)}
        >
          Step2 へ進む →
        </button>
      </div>
    );
  }

  // ==================== Step2: 穴埋め ====================
  if (currentStep === 3 && selectedQuiz) {
    const step2 = selectedQuiz.step2 || [];

    return (
      <div className={styles.container}>
        <div className={styles.stepHeader}>
          <button className={styles.backLink} onClick={() => setCurrentStep(2)}>
            ← Step1
          </button>
          <div className={styles.stepIndicator}>
            <span className={styles.stepDone}>神ノート ✓</span>
            <span>→</span>
            <span className={styles.stepDone}>Step1 ✓</span>
            <span>→</span>
            <span className={styles.stepActive}>Step2</span>
            <span>→</span>
            <span>Step3</span>
          </div>
        </div>

        <div className={styles.stepCard}>
          <div className={styles.stepCardHeader}>
            <span className={styles.stepNumber}>2</span>
            <div>
              <h2>文脈理解</h2>
              <p>穴埋め問題</p>
            </div>
          </div>

          {step2.map((q, idx) => (
            <div key={idx} className={styles.questionBlock}>
              <p className={styles.fillText}>
                {q.sentence.split(q.blank || '___').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span 
                        className={`${styles.blank} ${step2Revealed[idx] ? styles.blankRevealed : ''}`}
                        onClick={() => handleStep2Reveal(idx)}
                      >
                        {step2Revealed[idx] ? q.answer : 'タップで確認'}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

        <button 
          className={styles.nextButton}
          onClick={() => setCurrentStep(4)}
        >
          Step3 へ進む →
        </button>
      </div>
    );
  }

  // ==================== Step3: 記述式 ====================
  if (currentStep === 4 && selectedQuiz) {
    const step3 = selectedQuiz.step3 || [];

    return (
      <div className={styles.container}>
        <div className={styles.stepHeader}>
          <button className={styles.backLink} onClick={() => setCurrentStep(3)}>
            ← Step2
          </button>
          <div className={styles.stepIndicator}>
            <span className={styles.stepDone}>神ノート ✓</span>
            <span>→</span>
            <span className={styles.stepDone}>Step1 ✓</span>
            <span>→</span>
            <span className={styles.stepDone}>Step2 ✓</span>
            <span>→</span>
            <span className={styles.stepActive}>Step3</span>
          </div>
        </div>

        <div className={styles.stepCard}>
          <div className={styles.stepCardHeader}>
            <span className={styles.stepNumber}>3</span>
            <div>
              <h2>思考力</h2>
              <p>記述式問題</p>
            </div>
          </div>

          {step3.map((q, idx) => (
            <div key={idx} className={styles.questionBlock}>
              <p className={styles.questionText}>Q{idx + 1}. {q.question}</p>
              
              <textarea
                className={styles.textArea}
                placeholder="あなたの考えを書いてください..."
                value={step3Answers[idx] || ''}
                onChange={(e) => handleStep3Input(idx, e.target.value)}
                rows={4}
              />
              
              <button
                className={styles.revealButton}
                onClick={() => handleStep3Reveal(idx)}
              >
                模範解答を見る
              </button>
              
              {step3Revealed[idx] && (
                <div className={styles.sampleAnswer}>
                  <span className={styles.sampleLabel}>📝 模範解答</span>
                  <p>{q.sampleAnswer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <button 
          className={styles.completeButton}
          onClick={handleBackToList}
        >
          🎉 完了！一覧に戻る
        </button>
      </div>
    );
  }

  // ==================== クイズ一覧 ====================
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📝 まとめノート</h1>
        <p>授業の内容を確認しよう</p>
      </div>
      
      {quizzes.length === 0 ? (
        <div className={styles.empty}>
          <p>まだノートがありません</p>
        </div>
      ) : (
        <div className={styles.quizList}>
          {quizzes.map(quiz => (
            <div 
              key={quiz.id} 
              className={styles.quizCard}
              onClick={() => handleSelectQuiz(quiz.id)}
            >
              <div className={styles.quizInfo}>
                <h3>{quiz.title}</h3>
                <div className={styles.quizMeta}>
                  <span className={styles.subject}>{quiz.subjectName}</span>
                </div>
              </div>
              <div className={styles.startButton}>
                学習する →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizPage;