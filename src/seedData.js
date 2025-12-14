import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config';

// クラス一覧
const classes = ['1年A組', '1年B組', '2年A組', '2年B組', '3年A組', '3年B組'];

/**
 * 🗑️ Firestoreの全データを削除する関数
 */
export const clearDatabase = async () => {
  try {
    console.log('データの削除を開始します...');
    
    const collections = ['folders', 'prints', 'homeworks', 'qna', 'submissions', 'notices', 'notifications'];
    
    for (const collectionName of collections) {
      console.log(`${collectionName} を削除中...`);
      const snapshot = await getDocs(collection(db, collectionName));
      
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnapshot.id));
      }
      
      console.log(`${collectionName}: ${snapshot.size}件削除しました`);
    }
    
    console.log('全データの削除が完了しました!');
    return { success: true, message: 'データ削除完了' };
    
  } catch (error) {
    console.error('データ削除中にエラーが発生しました:', error);
    return { success: false, error: error.message };
  }
};

// ダミーフォルダ（クラスごとに作成）
const dummyFolders = [
  // 1年A組
  { title: '三角関数の基礎', date: '2025/01/10', subject: '数学', className: '1年A組', imageUrl: 'https://picsum.photos/240/135?random=1' },
  { title: '古文読解入門', date: '2025/01/09', subject: '国語', className: '1年A組', imageUrl: 'https://picsum.photos/240/135?random=2' },
  { title: '英文法 - 時制', date: '2025/01/08', subject: '英語', className: '1年A組', imageUrl: 'https://picsum.photos/240/135?random=3' },
  
  // 1年B組
  { title: '二次関数のグラフ', date: '2025/01/10', subject: '数学', className: '1年B組', imageUrl: 'https://picsum.photos/240/135?random=4' },
  { title: '漢文の基礎', date: '2025/01/09', subject: '国語', className: '1年B組', imageUrl: 'https://picsum.photos/240/135?random=5' },
  { title: '英会話練習', date: '2025/01/08', subject: '英語', className: '1年B組', imageUrl: 'https://picsum.photos/240/135?random=6' },
  
  // 2年A組
  { title: 'ベクトル入門', date: '2025/01/10', subject: '数学', className: '2年A組', imageUrl: 'https://picsum.photos/240/135?random=7' },
  { title: '現代文読解', date: '2025/01/09', subject: '国語', className: '2年A組', imageUrl: 'https://picsum.photos/240/135?random=8' },
  { title: '長文読解演習', date: '2025/01/08', subject: '英語', className: '2年A組', imageUrl: 'https://picsum.photos/240/135?random=9' },
  
  // 2年B組
  { title: '微分の基礎', date: '2025/01/10', subject: '数学', className: '2年B組', imageUrl: 'https://picsum.photos/240/135?random=10' },
  { title: '小説読解', date: '2025/01/09', subject: '国語', className: '2年B組', imageUrl: 'https://picsum.photos/240/135?random=11' },
  { title: 'リスニング練習', date: '2025/01/08', subject: '英語', className: '2年B組', imageUrl: 'https://picsum.photos/240/135?random=12' },
  
  // 3年A組
  { title: '積分応用', date: '2025/01/10', subject: '数学', className: '3年A組', imageUrl: 'https://picsum.photos/240/135?random=13' },
  { title: '論説文対策', date: '2025/01/09', subject: '国語', className: '3年A組', imageUrl: 'https://picsum.photos/240/135?random=14' },
  { title: '入試対策 英語', date: '2025/01/08', subject: '英語', className: '3年A組', imageUrl: 'https://picsum.photos/240/135?random=15' },
  
  // 3年B組
  { title: '確率統計', date: '2025/01/10', subject: '数学', className: '3年B組', imageUrl: 'https://picsum.photos/240/135?random=16' },
  { title: '古典総合演習', date: '2025/01/09', subject: '国語', className: '3年B組', imageUrl: 'https://picsum.photos/240/135?random=17' },
  { title: '英作文対策', date: '2025/01/08', subject: '英語', className: '3年B組', imageUrl: 'https://picsum.photos/240/135?random=18' },
];

// ダミープリント（クラスごと）
const dummyPrints = [
  { title: '三角関数 練習プリント', date: '2025/01/10', subject: '数学', className: '1年A組', imageUrl: 'https://picsum.photos/240/135?random=21' },
  { title: '古文単語テスト', date: '2025/01/09', subject: '国語', className: '1年A組', imageUrl: 'https://picsum.photos/240/135?random=22' },
  
  { title: '二次関数 演習プリント', date: '2025/01/10', subject: '数学', className: '1年B組', imageUrl: 'https://picsum.photos/240/135?random=23' },
  { title: '漢文練習プリント', date: '2025/01/09', subject: '国語', className: '1年B組', imageUrl: 'https://picsum.photos/240/135?random=24' },
  
  { title: 'ベクトル演習', date: '2025/01/10', subject: '数学', className: '2年A組', imageUrl: 'https://picsum.photos/240/135?random=25' },
  { title: '現代文プリント', date: '2025/01/09', subject: '国語', className: '2年A組', imageUrl: 'https://picsum.photos/240/135?random=26' },
  
  { title: '微分演習プリント', date: '2025/01/10', subject: '数学', className: '2年B組', imageUrl: 'https://picsum.photos/240/135?random=27' },
  { title: '小説読解プリント', date: '2025/01/09', subject: '国語', className: '2年B組', imageUrl: 'https://picsum.photos/240/135?random=28' },
  
  { title: '積分練習プリント', date: '2025/01/10', subject: '数学', className: '3年A組', imageUrl: 'https://picsum.photos/240/135?random=29' },
  { title: '入試対策プリント', date: '2025/01/09', subject: '国語', className: '3年A組', imageUrl: 'https://picsum.photos/240/135?random=30' },
  
  { title: '確率統計プリント', date: '2025/01/10', subject: '数学', className: '3年B組', imageUrl: 'https://picsum.photos/240/135?random=31' },
  { title: '古典総合プリント', date: '2025/01/09', subject: '国語', className: '3年B組', imageUrl: 'https://picsum.photos/240/135?random=32' },
];

// ダミー宿題（クラスごと）
const dummyHomeworks = [
  { title: '三角関数 練習問題', deadline: '2025/01/15', subject: '数学', className: '1年A組' },
  { title: '古文読解 宿題', deadline: '2025/01/14', subject: '国語', className: '1年A組' },
  
  { title: '二次関数 問題集', deadline: '2025/01/15', subject: '数学', className: '1年B組' },
  { title: '漢文 宿題', deadline: '2025/01/14', subject: '国語', className: '1年B組' },
  
  { title: 'ベクトル 演習問題', deadline: '2025/01/15', subject: '数学', className: '2年A組' },
  { title: '現代文 宿題', deadline: '2025/01/14', subject: '国語', className: '2年A組' },
  
  { title: '微分 練習問題', deadline: '2025/01/15', subject: '数学', className: '2年B組' },
  { title: '小説読解 宿題', deadline: '2025/01/14', subject: '国語', className: '2年B組' },
  
  { title: '積分応用問題', deadline: '2025/01/15', subject: '数学', className: '3年A組' },
  { title: '論説文 宿題', deadline: '2025/01/14', subject: '国語', className: '3年A組' },
  
  { title: '確率統計問題', deadline: '2025/01/15', subject: '数学', className: '3年B組' },
  { title: '古典演習 宿題', deadline: '2025/01/14', subject: '国語', className: '3年B組' },
];

// ダミー質問（クラスごと）
const dummyQna = [
  { subject: '数学', title: '三角関数の公式がわかりません', status: 'unanswered', className: '1年A組' },
  { subject: '国語', title: '古文の助動詞について', status: 'answered', className: '1年A組' },
  
  { subject: '数学', title: '二次関数の頂点の求め方', status: 'unanswered', className: '1年B組' },
  { subject: '英語', title: '現在完了形の使い方', status: 'answered', className: '1年B組' },
  
  { subject: '数学', title: 'ベクトルの内積について', status: 'unanswered', className: '2年A組' },
  { subject: '国語', title: '現代文の要約のコツ', status: 'answered', className: '2年A組' },
  
  { subject: '数学', title: '微分の計算方法', status: 'unanswered', className: '2年B組' },
  { subject: '英語', title: '関係代名詞の使い分け', status: 'answered', className: '2年B組' },
  
  { subject: '数学', title: '積分の応用問題', status: 'unanswered', className: '3年A組' },
  { subject: '国語', title: '論説文の読み方', status: 'answered', className: '3年A組' },
  
  { subject: '数学', title: '確率の計算問題', status: 'unanswered', className: '3年B組' },
  { subject: '英語', title: '英作文のコツ', status: 'answered', className: '3年B組' },
];

// 提出物のダミーデータ（クラスごと）
const dummySubmissions = [
  {
    homeworkId: 'test-hw-1',
    studentId: 'test-student-1',
    studentName: '山田太郎',
    subject: '数学',
    homeworkTitle: '三角関数 練習問題',
    status: 'submitted',
    comment: '難しかったですが、頑張りました',
    fileUrl: null,
    grade: null,
    feedback: null,
    className: '1年A組'
  },
  {
    homeworkId: 'test-hw-2',
    studentId: 'test-student-2',
    studentName: '佐藤花子',
    subject: '英語',
    homeworkTitle: '不定詞 ワークブック P10-12',
    status: 'submitted',
    comment: '復習もしっかりやりました！',
    fileUrl: null,
    grade: 'A',
    feedback: 'よくできています。次も頑張りましょう。',
    className: '1年A組'
  },
  {
    homeworkId: 'test-hw-3',
    studentId: 'test-student-3',
    studentName: '鈴木一郎',
    subject: '数学',
    homeworkTitle: '二次関数 問題集',
    status: 'submitted',
    comment: 'わからない問題がありました',
    fileUrl: null,
    grade: null,
    feedback: null,
    className: '1年B組'
  },
  {
    homeworkId: 'test-hw-4',
    studentId: 'test-student-4',
    studentName: '田中美咲',
    subject: '国語',
    homeworkTitle: '現代文 宿題',
    status: 'submitted',
    comment: '感想文を書きました',
    fileUrl: null,
    grade: 'B',
    feedback: '良い視点で書けています。',
    className: '2年A組'
  },
  {
    homeworkId: 'test-hw-5',
    studentId: 'test-student-5',
    studentName: '高橋健',
    subject: '数学',
    homeworkTitle: '微分 練習問題',
    status: 'submitted',
    comment: '時間がかかりました',
    fileUrl: null,
    grade: null,
    feedback: null,
    className: '2年B組'
  },
  {
    homeworkId: 'test-hw-6',
    studentId: 'test-student-6',
    studentName: '伊藤さくら',
    subject: '数学',
    homeworkTitle: '積分応用問題',
    status: 'submitted',
    comment: '楽しく学習できました',
    fileUrl: null,
    grade: 'A',
    feedback: '素晴らしい出来です！',
    className: '3年A組'
  }
];

// ダミーお知らせ（クラスごと）
const dummyNotices = [
  { title: '中間テストについて', content: '来週の月曜日に中間テストを実施します。範囲は教科書P1-50です。', subject: '数学', noticeType: 'important', date: '2025-12-20', showInCalendar: true, className: '1年A組' },
  { title: '宿題の提出期限', content: '宿題の提出期限は今週金曜日です。', subject: '国語', noticeType: 'normal', date: '2025-12-18', showInCalendar: true, className: '1年A組' },
  
  { title: '授業変更のお知らせ', content: '明日の2時間目は自習になります。', subject: '英語', noticeType: 'info', date: '2025-12-17', showInCalendar: false, className: '1年B組' },
  { title: '期末テスト範囲発表', content: '期末テストの範囲を発表します。', subject: '数学', noticeType: 'important', date: '2025-12-22', showInCalendar: true, className: '1年B組' },
  
  { title: '補習授業について', content: '放課後に補習授業を行います。', subject: '数学', noticeType: 'normal', date: '2025-12-19', showInCalendar: true, className: '2年A組' },
  { title: '課題図書の案内', content: '冬休みの課題図書リストを配布します。', subject: '国語', noticeType: 'info', date: '2025-12-21', showInCalendar: false, className: '2年A組' },
  
  { title: '小テスト実施', content: '明日、小テストを実施します。', subject: '英語', noticeType: 'important', date: '2025-12-18', showInCalendar: true, className: '2年B組' },
  { title: 'レポート提出について', content: 'レポートの提出方法を説明します。', subject: '理科', noticeType: 'normal', date: '2025-12-20', showInCalendar: false, className: '2年B組' },
  
  { title: '入試対策講座', content: '入試対策の特別講座を開催します。', subject: '数学', noticeType: 'important', date: '2025-12-23', showInCalendar: true, className: '3年A組' },
  { title: '進路相談会', content: '進路相談会を実施します。', subject: '国語', noticeType: 'info', date: '2025-12-24', showInCalendar: true, className: '3年A組' },
  
  { title: '模試の案内', content: '来月の模試について案内します。', subject: '英語', noticeType: 'important', date: '2025-12-25', showInCalendar: true, className: '3年B組' },
  { title: '冬期講習のお知らせ', content: '冬期講習の申し込みを開始します。', subject: '数学', noticeType: 'normal', date: '2025-12-26', showInCalendar: true, className: '3年B組' },
];

/**
 * Firestoreにダミーデータを投入する関数
 */
export const seedDatabase = async () => {
  try {
    console.log('ダミーデータの投入を開始します...');

    // 1. フォルダ (授業) を投入
    console.log('フォルダを投入中...');
    const foldersSnapshot = await getDocs(collection(db, 'folders'));
    if (foldersSnapshot.empty) {
      for (const folder of dummyFolders) {
        await addDoc(collection(db, 'folders'), {
          type: 'folder',
          title: folder.title,
          date: folder.date,
          subject: folder.subject,
          className: folder.className,
          imageUrl: folder.imageUrl,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`${dummyFolders.length}件のフォルダを投入しました`);
    } else {
      console.log('フォルダは既に存在します。スキップします。');
    }

    // 2. プリントを投入
    console.log('プリントを投入中...');
    const printsSnapshot = await getDocs(collection(db, 'prints'));
    if (printsSnapshot.empty) {
      for (const print of dummyPrints) {
        await addDoc(collection(db, 'prints'), {
          type: 'print',
          title: print.title,
          date: print.date,
          subject: print.subject,
          className: print.className,
          imageUrl: print.imageUrl,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`${dummyPrints.length}件のプリントを投入しました`);
    } else {
      console.log('プリントは既に存在します。スキップします。');
    }

    // 3. 宿題を投入
    console.log('宿題を投入中...');
    const homeworksSnapshot = await getDocs(collection(db, 'homeworks'));
    if (homeworksSnapshot.empty) {
      for (const homework of dummyHomeworks) {
        await addDoc(collection(db, 'homeworks'), {
          type: 'homework',
          title: homework.title,
          deadline: homework.deadline,
          subject: homework.subject,
          className: homework.className,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`${dummyHomeworks.length}件の宿題を投入しました`);
    } else {
      console.log('宿題は既に存在します。スキップします。');
    }

    // 4. 質問箱を投入
    console.log('質問箱を投入中...');
    const qnaSnapshot = await getDocs(collection(db, 'qna'));
    if (qnaSnapshot.empty) {
      for (const qna of dummyQna) {
        await addDoc(collection(db, 'qna'), {
          type: 'qna',
          subject: qna.subject,
          title: qna.title,
          status: qna.status,
          className: qna.className,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`${dummyQna.length}件の質問を投入しました`);
    } else {
      console.log('質問箱は既に存在します。スキップします。');
    }

    // 5. 提出物を投入
    console.log('提出物を投入中...');
    const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
    if (submissionsSnapshot.empty) {
      for (const submission of dummySubmissions) {
        await addDoc(collection(db, 'submissions'), {
          ...submission,
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      console.log(`${dummySubmissions.length}件の提出物を投入しました`);
    } else {
      console.log('提出物は既に存在します。スキップします。');
    }

    // 6. お知らせを投入
    console.log('お知らせを投入中...');
    const noticesSnapshot = await getDocs(collection(db, 'notices'));
    if (noticesSnapshot.empty) {
      for (const notice of dummyNotices) {
        await addDoc(collection(db, 'notices'), {
          type: 'notice',
          title: notice.title,
          content: notice.content,
          subject: notice.subject,
          noticeType: notice.noticeType,
          date: notice.date,
          showInCalendar: notice.showInCalendar,
          className: notice.className,
          createdAt: serverTimestamp()
        });
      }
      console.log(`${dummyNotices.length}件のお知らせを投入しました`);
    } else {
      console.log('お知らせは既に存在します。スキップします。');
    }

    console.log('ダミーデータの投入が完了しました!');
    return { success: true, message: 'データ投入完了' };

  } catch (error) {
    console.error('データ投入中にエラーが発生しました:', error);
    return { success: false, error: error.message };
  }
};