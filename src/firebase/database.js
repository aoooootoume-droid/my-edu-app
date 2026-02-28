import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';

// ========================================
// 📁 フォルダ (授業) 関連
// ========================================

/**
 * フォルダを追加
 */
export const addFolder = async (folderData) => {
  try {
    const docRef = await addDoc(collection(db, 'folders'), {
      ...folderData,
      type: 'folder',
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('フォルダ追加エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 全フォルダを取得
 */
export const getFolders = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'folders'), orderBy('date', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('フォルダ取得エラー:', error);
    return [];
  }
};

/**
 * フォルダをリアルタイムで監視
 */
export const onFoldersChange = (schoolCode, callback) => {
  const q = query(collection(db, 'folders'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(f => !f.schoolCode || f.schoolCode === schoolCode);
    callback(folders);
  });
};

// ========================================
// 📄 プリント関連
// ========================================

export const addPrint = async (printData) => {
  try {
    const docRef = await addDoc(collection(db, 'prints'), {
      ...printData,
      type: 'print',
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('プリント追加エラー:', error);
    return { success: false, error: error.message };
  }
};

export const getPrints = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'prints'), orderBy('date', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('プリント取得エラー:', error);
    return [];
  }
};

export const onPrintsChange = (schoolCode, callback) => {
  const q = query(collection(db, 'prints'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const prints = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => !p.schoolCode || p.schoolCode === schoolCode);
    callback(prints);
  });
};

// ========================================
// 📝 宿題関連
// ========================================

export const addHomework = async (homeworkData) => {
  try {
    const docRef = await addDoc(collection(db, 'homeworks'), {
      ...homeworkData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('宿題追加エラー:', error);
    return { success: false, error: error.message };
  }
};

export const getHomeworks = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'homeworks'), orderBy('deadline', 'asc'))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('宿題取得エラー:', error);
    return [];
  }
};

export const onHomeworksChange = (schoolCode, callback) => {
  const q = query(collection(db, 'homeworks'), orderBy('deadline', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const homeworks = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(h => !h.schoolCode || h.schoolCode === schoolCode);
    callback(homeworks);
  });
};

// ========================================
// ❓ 質問箱関連
// ========================================

export const addQuestion = async (questionData) => {
  try {
    const docRef = await addDoc(collection(db, 'qna'), {
      ...questionData,
      type: 'qna',
      status: 'unanswered',
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('質問追加エラー:', error);
    return { success: false, error: error.message };
  }
};

export const updateQuestionStatus = async (questionId, status) => {
  try {
    await updateDoc(doc(db, 'qna', questionId), { status });
    return { success: true };
  } catch (error) {
    console.error('質問ステータス更新エラー:', error);
    return { success: false, error: error.message };
  }
};

export const getQuestions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'qna'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('質問取得エラー:', error);
    return [];
  }
};

export const onQuestionsChange = (schoolCode, callback) => {
  return onSnapshot(collection(db, 'qna'), (snapshot) => {
    const questions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(q => !q.schoolCode || q.schoolCode === schoolCode);
    callback(questions);
  });
};

// ========================================
// 🗑️ 削除機能
// ========================================

export const deleteItem = async (collectionName, itemId) => {
  try {
    await deleteDoc(doc(db, collectionName, itemId));
    return { success: true };
  } catch (error) {
    console.error('削除エラー:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// 👥 グループ関連
// ========================================

/**
 * ランダムな招待コードを生成
 */
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * グループを作成
 */
export const createGroup = async (groupData, userId) => {
  try {
    const inviteCode = generateInviteCode();
    const docRef = await addDoc(collection(db, 'groups'), {
      name: groupData.name,
      description: groupData.description || '',
      inviteCode,
      createdBy: userId,
      members: [userId],
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id, inviteCode };
  } catch (error) {
    console.error('グループ作成エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 招待コードでグループに参加
 */
export const joinGroupByCode = async (inviteCode, userId) => {
  try {
    const q = query(collection(db, 'groups'), where('inviteCode', '==', inviteCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: '招待コードが無効です' };
    }
    
    const groupDoc = querySnapshot.docs[0];
    const groupData = groupDoc.data();
    
    if (groupData.members.includes(userId)) {
      return { success: false, error: '既にこのグループに参加しています' };
    }
    
    await updateDoc(doc(db, 'groups', groupDoc.id), {
      members: arrayUnion(userId)
    });
    
    return { success: true, groupId: groupDoc.id, groupName: groupData.name };
  } catch (error) {
    console.error('グループ参加エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ユーザーが参加しているグループ一覧を取得
 */
export const getUserGroups = async (userId) => {
  try {
    const q = query(
      collection(db, 'groups'), 
      where('members', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('グループ取得エラー:', error);
    return [];
  }
};

/**
 * グループ情報を取得
 */
export const getGroup = async (groupId) => {
  try {
    const docSnap = await getDoc(doc(db, 'groups', groupId));
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'グループが見つかりません' };
  } catch (error) {
    console.error('グループ情報取得エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * グループからメンバーを削除（退出）
 */
export const leaveGroup = async (groupId, userId) => {
  try {
    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayRemove(userId)
    });
    return { success: true };
  } catch (error) {
    console.error('グループ退出エラー:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// 📋 グループカード関連
// ========================================

/**
 * グループにカードを追加
 */
export const addGroupCard = async (groupId, userId, cardData) => {
  try {
    const docRef = await addDoc(collection(db, 'groupCards'), {
      groupId,
      userId,
      userName: cardData.userName || '匿名',
      type: cardData.type,
      title: cardData.title,
      subject: cardData.subject,
      date: cardData.date,
      thumbnail: cardData.thumbnail || null,
      content: cardData.content || '',
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('グループカード追加エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * グループのカード一覧を取得
 */
export const getGroupCards = async (groupId) => {
  try {
    const q = query(
      collection(db, 'groupCards'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('グループカード取得エラー:', error);
    return [];
  }
};

/**
 * グループカードをリアルタイムで監視
 */
export const onGroupCardsChange = (groupId, callback) => {
  const q = query(
    collection(db, 'groupCards'),
    where('groupId', '==', groupId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(cards);
  });
};

/**
 * グループカードを削除
 */
export const deleteGroupCard = async (cardId) => {
  try {
    await deleteDoc(doc(db, 'groupCards', cardId));
    return { success: true };
  } catch (error) {
    console.error('グループカード削除エラー:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// 📁 グループファイル関連
// ========================================

/**
 * グループにファイルを追加
 */
export const addGroupFile = async (groupId, userId, fileData) => {
  try {
    const docRef = await addDoc(collection(db, 'groupFiles'), {
      groupId,
      userId,
      userName: fileData.userName || '匿名',
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileType: fileData.fileType,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('グループファイル追加エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * グループのファイル一覧を取得
 */
export const getGroupFiles = async (groupId) => {
  try {
    const q = query(
      collection(db, 'groupFiles'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('グループファイル取得エラー:', error);
    return [];
  }
};

/**
 * グループファイルをリアルタイムで監視
 */
export const onGroupFilesChange = (groupId, callback) => {
  const q = query(
    collection(db, 'groupFiles'),
    where('groupId', '==', groupId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(files);
  });
};

/**
 * グループファイルを削除
 */
export const deleteGroupFile = async (fileId) => {
  try {
    await deleteDoc(doc(db, 'groupFiles', fileId));
    return { success: true };
  } catch (error) {
    console.error('グループファイル削除エラー:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// 📤 提出物関連
// ========================================

/**
 * 宿題を提出
 */
export const submitHomework = async (submissionData) => {
  try {
    const docRef = await addDoc(collection(db, 'submissions'), {
      homeworkId: submissionData.homeworkId,
      studentId: submissionData.studentId,
      studentName: submissionData.studentName,
      subject: submissionData.subject,
      homeworkTitle: submissionData.homeworkTitle,
      submittedAt: serverTimestamp(),
      status: 'submitted',
      fileUrl: submissionData.fileUrl || null,
      comment: submissionData.comment || '',
      grade: null,
      feedback: null,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('提出エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 特定の宿題の全提出物を取得
 */
export const getHomeworkSubmissions = async (homeworkId) => {
  try {
    const q = query(
      collection(db, 'submissions'),
      where('homeworkId', '==', homeworkId),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('提出物取得エラー:', error);
    return [];
  }
};

/**
 * 全提出物を取得（教員用）
 */
export const getAllSubmissions = async () => {
  try {
    const q = query(
      collection(db, 'submissions'),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('全提出物取得エラー:', error);
    return [];
  }
};

/**
 * 提出物をリアルタイムで監視
 */
export const onSubmissionsChange = (callback) => {
  const q = query(
    collection(db, 'submissions'),
    orderBy('submittedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(submissions);
  });
};

/**
 * 生徒の提出物を取得
 */
export const getStudentSubmissions = async (studentId) => {
  try {
    const q = query(
      collection(db, 'submissions'),
      where('studentId', '==', studentId),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('生徒の提出物取得エラー:', error);
    return [];
  }
};

/**
 * 提出物に評価とフィードバックを追加
 */
export const gradeSubmission = async (submissionId, grade, feedback) => {
  try {
    await updateDoc(doc(db, 'submissions', submissionId), {
      grade,
      feedback,
      gradedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('評価エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 教科別の提出物統計を取得
 */
export const getSubmissionStats = async (subject) => {
  try {
    const q = query(
      collection(db, 'submissions'),
      where('subject', '==', subject)
    );
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => doc.data());
    
    const stats = {
      total: submissions.length,
      submitted: submissions.filter(s => s.status === 'submitted').length,
      late: submissions.filter(s => s.status === 'late').length,
      graded: submissions.filter(s => s.grade !== null).length,
      ungraded: submissions.filter(s => s.grade === null).length
    };
    
    return stats;
  } catch (error) {
    console.error('統計取得エラー:', error);
    return null;
  }
};

// ========================================
// 📢 お知らせ関連
// ========================================

/**
 * お知らせを追加
 */
export const addNotice = async (noticeData) => {
  try {
    const docRef = await addDoc(collection(db, 'notices'), {
      type: 'notice',
      title: noticeData.title,
      content: noticeData.content,
      subject: noticeData.subject,
      noticeType: noticeData.noticeType,
      date: noticeData.date,
      showInCalendar: noticeData.showInCalendar || false,
      createdBy: noticeData.createdBy,
      className: noticeData.className || null,  // ← この行を追加！
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('お知らせ追加エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 全お知らせを取得
 */
export const getNotices = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'notices'), orderBy('date', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('お知らせ取得エラー:', error);
    return [];
  }
};

/**
 * お知らせをリアルタイムで監視
 */
export const onNoticesChange = (schoolCode, callback) => {
  const q = query(collection(db, 'notices'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const notices = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(n => !n.schoolCode || n.schoolCode === schoolCode);
    callback(notices);
  });
};

/**
 * お知らせを更新
 */
export const updateNotice = async (noticeId, updateData) => {
  try {
    await updateDoc(doc(db, 'notices', noticeId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('お知らせ更新エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * お知らせを削除
 */
export const deleteNotice = async (noticeId) => {
  try {
    await deleteDoc(doc(db, 'notices', noticeId));
    return { success: true };
  } catch (error) {
    console.error('お知らせ削除エラー:', error);
    return { success: false, error: error.message };
  }
};
// ========================================
// 🔔 通知関連（database.jsの末尾に追加）
// ========================================

/**
 * 通知を追加
 */
export const addNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      type: notificationData.type, // 'archive', 'homework', 'qna', 'notice', 'test'
      title: notificationData.title,
      message: notificationData.message,
      linkType: notificationData.linkType || null,
      linkId: notificationData.linkId || null,
      className: notificationData.className || null,
      isRead: false,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('通知追加エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 通知をリアルタイムで監視
 */
export const onNotificationsChange = (schoolCode, callback) => {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => {
      const data = doc.data();
      // createdAtから経過時間を計算
      let time = '';
      if (data.createdAt) {
        const now = new Date();
        const created = data.createdAt.toDate();
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) time = 'たった今';
        else if (diffMins < 60) time = `${diffMins}分前`;
        else if (diffHours < 24) time = `${diffHours}時間前`;
        else time = `${diffDays}日前`;
      }
      
      return {
        id: doc.id,
        ...data,
        time
      };
    }).filter(n => !n.schoolCode || n.schoolCode === schoolCode);
    callback(notifications);
  });
};

/**
 * 通知を既読にする
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true
    });
    return { success: true };
  } catch (error) {
    console.error('通知既読エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 全通知を既読にする
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    
    const updatePromises = snapshot.docs.map(docSnapshot => 
      updateDoc(doc(db, 'notifications', docSnapshot.id), { isRead: true })
    );
    
    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    console.error('全通知既読エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 通知を削除
 */
export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    return { success: true };
  } catch (error) {
    console.error('通知削除エラー:', error);
    return { success: false, error: error.message };
  }
};
// ========================================
// 📝 クイズ（まとめノート）関連
// ========================================

/**
 * クイズ一覧を取得（クラス別）
 */
export const getQuizzes = async (schoolCode, classCode) => {
  try {
    const q = query(
      collection(db, 'quizzes'),
      where('schoolCode', '==', schoolCode),
      where('classCode', '==', classCode),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('クイズ取得エラー:', error);
    return [];
  }
};

/**
 * クイズをリアルタイムで監視
 */
export const onQuizzesChange = (schoolCode, classCode, callback) => {
  const q = query(
    collection(db, 'quizzes'),
    where('schoolCode', '==', schoolCode),
    where('classCode', '==', classCode),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(quizzes);
  });
};

/**
 * 単一のクイズを取得
 */
export const getQuiz = async (quizId) => {
  try {
    const docSnap = await getDoc(doc(db, 'quizzes', quizId));
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'クイズが見つかりません' };
  } catch (error) {
    console.error('クイズ取得エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * クイズの回答を送信して採点
 */
export const submitQuizAnswers = async (quizId, userId, studentName, schoolCode, classCode, answers) => {
  try {
    const response = await fetch('https://asia-northeast1-my-edu-app-116ef.cloudfunctions.net/scoreQuiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId,
        userId,
        studentName,
        schoolCode,
        classCode,
        answers
      })
    });
    
    const result = await response.json();
    if (result.success) {
      return { success: true, ...result };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('回答送信エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 生徒のクイズ結果を取得
 */
export const getStudentQuizResults = async (userId) => {
  try {
    const q = query(
      collection(db, 'quizResults'),
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('クイズ結果取得エラー:', error);
    return [];
  }
};

/**
 * 特定クイズの全結果を取得（先生用）
 */
export const getQuizResults = async (quizId) => {
  try {
    const q = query(
      collection(db, 'quizResults'),
      where('quizId', '==', quizId),
      orderBy('submittedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('クイズ結果取得エラー:', error);
    return [];
  }
};

// ========================================
// 🎥 録画関連
// ========================================

/**
 * 録画をリアルタイムで監視
 */
export const onRecordingsChange = (schoolCode, callback) => {
  const q = query(collection(db, 'recordings'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const recordings = snapshot.docs
      .map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          type: 'recording',
          date: docData.createdAt?.toDate?.()?.toISOString().split('T')[0] || '',
          imageUrl: docData.thumbnailUrl || null,
        };
      })
      .filter(r => !r.schoolCode || r.schoolCode === schoolCode);
    callback(recordings);
  });
};