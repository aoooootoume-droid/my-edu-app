// テスト用の学校データを追加するスクリプト
// Firebase Consoleで直接追加するか、このスクリプトを使用

import { db } from './firebase/config';
import { doc, setDoc } from 'firebase/firestore';

// テスト用の学校データ
// studentPassword: 生徒用パスワード
// teacherPassword: 教師用パスワード
const testSchools = [
  {
    code: 'SCHOOL001',
    name: '〇〇中学校',
    studentPassword: 'student1234',
    teacherPassword: 'teacher1234',
    classes: ['1年A組', '1年B組', '1年C組', '1年D組', '2年A組', '2年B組', '2年C組', '2年D組', '3年A組', '3年B組', '3年C組', '3年D組'],
    createdAt: new Date()
  },
  {
    code: 'SCHOOL002',
    name: '△△高等学校',
    studentPassword: 'student5678',
    teacherPassword: 'teacher5678',
    classes: ['1年1組', '1年2組', '1年3組', '2年1組', '2年2組', '2年3組', '3年1組', '3年2組', '3年3組'],
    createdAt: new Date()
  },
  {
    code: 'DEMO',
    name: 'デモ学校',
    studentPassword: 'demo',
    teacherPassword: 'demoteacher',
    classes: ['1年A組', '1年B組', '2年A組', '2年B組'],
    createdAt: new Date()
  }
];

export const initializeSchools = async () => {
  try {
    for (const school of testSchools) {
      await setDoc(doc(db, 'schools', school.code), {
        name: school.name,
        studentPassword: school.studentPassword,
        teacherPassword: school.teacherPassword,
        classes: school.classes,
        createdAt: school.createdAt
      });
      console.log(`学校 ${school.name} (${school.code}) を追加しました`);
    }
    return { success: true };
  } catch (error) {
    console.error('学校データ初期化エラー:', error);
    return { success: false, error: error.message };
  }
};

// 使い方: 
// ブラウザのコンソールで initializeSchools() を実行
// または、HomePage等に初期化ボタンを追加