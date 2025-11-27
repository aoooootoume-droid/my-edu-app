import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config';
import { 
  dummyFolders, 
  dummyPrints, 
  dummyHomeworks, 
  dummyQna, 
  dummyLiveSessions 
} from './data';

// 提出物のダミーデータ
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
    feedback: null
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
    feedback: 'よくできています。次も頑張りましょう。'
  },
  {
    homeworkId: 'test-hw-3',
    studentId: 'test-student-3',
    studentName: '鈴木一郎',
    subject: '数学',
    homeworkTitle: 'ベクトル 練習問題',
    status: 'submitted',
    comment: 'わからない問題がありました',
    fileUrl: null,
    grade: null,
    feedback: null
  },
  {
    homeworkId: 'test-hw-4',
    studentId: 'test-student-4',
    studentName: '田中美咲',
    subject: '国語',
    homeworkTitle: '走れメロス 読解',
    status: 'submitted',
    comment: '感想文を書きました',
    fileUrl: null,
    grade: 'B',
    feedback: '良い視点で書けています。もう少し深く考察できると更に良いです。'
  },
  {
    homeworkId: 'test-hw-5',
    studentId: 'test-student-5',
    studentName: '高橋健',
    subject: '数学',
    homeworkTitle: '三角関数 練習問題',
    status: 'submitted',
    comment: '時間がかかりました',
    fileUrl: null,
    grade: null,
    feedback: null
  },
  {
    homeworkId: 'test-hw-6',
    studentId: 'test-student-6',
    studentName: '伊藤さくら',
    subject: '英語',
    homeworkTitle: '不定詞 ワークブック P10-12',
    status: 'submitted',
    comment: '楽しく学習できました',
    fileUrl: null,
    grade: 'A',
    feedback: '素晴らしい出来です！'
  }
];

/**
 * Firestoreにダミーデータを投入する関数
 */
export const seedDatabase = async () => {
  try {
    console.log('🌱 ダミーデータの投入を開始します...');

    // 1. フォルダ (授業) を投入
    console.log('📁 フォルダを投入中...');
    const foldersSnapshot = await getDocs(collection(db, 'folders'));
    if (foldersSnapshot.empty) {
      for (const folder of dummyFolders) {
        await addDoc(collection(db, 'folders'), {
          type: 'folder',
          title: folder.title,
          date: folder.date,
          subject: folder.subject,
          imageUrl: folder.imageUrl,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`✅ ${dummyFolders.length}件のフォルダを投入しました`);
    } else {
      console.log('⚠️ フォルダは既に存在します。スキップします。');
    }

    // 2. プリントを投入
    console.log('📄 プリントを投入中...');
    const printsSnapshot = await getDocs(collection(db, 'prints'));
    if (printsSnapshot.empty) {
      for (const print of dummyPrints) {
        await addDoc(collection(db, 'prints'), {
          type: 'print',
          title: print.title,
          date: print.date,
          subject: print.subject,
          imageUrl: print.imageUrl,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`✅ ${dummyPrints.length}件のプリントを投入しました`);
    } else {
      console.log('⚠️ プリントは既に存在します。スキップします。');
    }

    // 3. 宿題を投入
    console.log('📝 宿題を投入中...');
    const homeworksSnapshot = await getDocs(collection(db, 'homeworks'));
    if (homeworksSnapshot.empty) {
      for (const homework of dummyHomeworks) {
        await addDoc(collection(db, 'homeworks'), {
          title: homework.title,
          deadline: homework.deadline,
          subject: homework.subject,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`✅ ${dummyHomeworks.length}件の宿題を投入しました`);
    } else {
      console.log('⚠️ 宿題は既に存在します。スキップします。');
    }

    // 4. 質問箱を投入
    console.log('❓ 質問箱を投入中...');
    const qnaSnapshot = await getDocs(collection(db, 'qna'));
    if (qnaSnapshot.empty) {
      for (const qna of dummyQna) {
        await addDoc(collection(db, 'qna'), {
          type: 'qna',
          subject: qna.subject,
          title: qna.title,
          status: qna.status,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`✅ ${dummyQna.length}件の質問を投入しました`);
    } else {
      console.log('⚠️ 質問箱は既に存在します。スキップします。');
    }

    // 5. Live配信を投入
    console.log('🎥 Live配信を投入中...');
    const liveSnapshot = await getDocs(collection(db, 'liveSessions'));
    if (liveSnapshot.empty) {
      for (const live of dummyLiveSessions) {
        await addDoc(collection(db, 'liveSessions'), {
          type: 'live',
          title: live.title,
          status: live.status,
          subject: live.subject,
          date: live.date || null,
          createdAt: new Date().toISOString()
        });
      }
      console.log(`✅ ${dummyLiveSessions.length}件のLive配信を投入しました`);
    } else {
      console.log('⚠️ Live配信は既に存在します。スキップします。');
    }

    // 6. 提出物を投入
    console.log('📤 提出物を投入中...');
    const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
    if (submissionsSnapshot.empty) {
      for (const submission of dummySubmissions) {
        await addDoc(collection(db, 'submissions'), {
          ...submission,
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      console.log(`✅ ${dummySubmissions.length}件の提出物を投入しました`);
    } else {
      console.log('⚠️ 提出物は既に存在します。スキップします。');
    }

    console.log('🎉 ダミーデータの投入が完了しました!');
    return { success: true, message: 'データ投入完了' };

  } catch (error) {
    console.error('❌ データ投入中にエラーが発生しました:', error);
    return { success: false, error: error.message };
  }
};