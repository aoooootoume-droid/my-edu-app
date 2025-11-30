// 1. 授業のダミーデータ
export const dummyFolders = [
  { id: 1, type: 'folder', title: '三角関数 導入', date: '2025/04/10', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=1' },
  { id: 2, type: 'folder', title: '走れメロス 読解', date: '2025/04/09', subject: '国語', imageUrl: 'https://picsum.photos/240/135?random=2' },
  { id: 3, type: 'folder', title: '不定詞の基本', date: '2025/04/08', subject: '英語', imageUrl: 'https://picsum.photos/240/135?random=3' },
  { id: 4, type: 'folder', title: 'イオンと化学式', date: '2025/04/08', subject: '理科', imageUrl: 'https://picsum.photos/240/135?random=4' },
  { id: 5, type: 'folder', title: 'ベクトルの内積', date: '2025/04/07', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=5' },
  { id: 6, type: 'folder', title: '枕草子 暗唱', date: '2025/04/07', subject: '国語', imageUrl: 'https://picsum.photos/240/135?random=6' },
  { id: 7, type: 'folder', title: '関係代名詞', date: '2025/04/06', subject: '英語', imageUrl: 'https://picsum.photos/240/135?random=7' },
  { id: 8, type: 'folder', title: '明治維新', date: '2025/04/05', subject: '社会', imageUrl: 'https://picsum.photos/240/135?random=8' },
  { id: 9, type: 'folder', title: '三角関数 演習', date: '2025/04/11', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=9' },
  { id: 10, type: 'folder', title: '動詞の活用', date: '2025/04/10', subject: '国語', imageUrl: 'https://picsum.photos/240/135?random=10' },
  { id: 11, type: 'folder', title: '現在完了形', date: '2025/04/10', subject: '英語', imageUrl: 'https://picsum.photos/240/135?random=11' },
  { id: 12, type: 'folder', title: '化学反応式', date: '2025/04/12', subject: '理科', imageUrl: 'https://picsum.photos/240/135?random=12' },
  { id: 13, type: 'folder', title: '鎌倉時代', date: '2025/04/11', subject: '社会', imageUrl: 'https://picsum.photos/240/135?random=13' },
  { id: 14, type: 'folder', title: '三角関数 応用編', date: '2025/04/12', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=14' },
  { id: 15, type: 'folder', title: '三角関数 まとめ', date: '2025/04/13', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=15' },
  { id: 16, type: 'folder', title: '三角関数 テスト', date: '2025/04/14', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=16' },
];

// 2. 教科リスト
export const mainSubjects = ['国語', '数学', '英語', '理科', '社会'];
export const subSubjects = ['音楽', '美術', '保健体育', '技術・家庭'];

// 3. 宿題のダミーデータ
export const dummyHomeworks = [
  { id: 101, type: 'homework', title: '三角関数 練習問題', deadline: '2025/04/15', subject: '数学' },
  { id: 102, type: 'homework', title: '走れメロス 読解', deadline: '2025/04/16', subject: '国語' },
  { id: 103, type: 'homework', title: '不定詞 ワークブック P10-12', deadline: '2025/04/18', subject: '英語' },
  { id: 104, type: 'homework', title: 'ベクトル 練習問題', deadline: '2025/04/20', subject: '数学' },
];

// 4. プリントのダミーデータ
export const dummyPrints = [
  { id: 201, type: 'print', title: '三角関数 練習プリント', date: '2025/04/11', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=201' },
  { id: 202, type: 'print', title: '走れメロス 漢字テスト', date: '2025/04/09', subject: '国語', imageUrl: 'https://picsum.photos/240/135?random=202' },
  { id: 203, type: 'print', title: '不定詞 穴埋め問題', date: '2025/04/08', subject: '英語', imageUrl: 'https://picsum.photos/240/135?random=203' },
  { id: 204, type: 'print', title: 'ベクトルの内積 演習', date: '2025/04/07', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=204' },
  { id: 205, type: 'print', title: '三角関数 応用プリント', date: '2025/04/12', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=205' },
  { id: 206, type: 'print', title: '三角関数 穴埋め', date: '2025/04/13', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=206' },
  { id: 207, type: 'print', title: '三角関数 小テスト', date: '2025/04/14', subject: '数学', imageUrl: 'https://picsum.photos/240/135?random=207' },
];

// 5. 質問箱のダミーデータ
export const dummyQna = [
  { id: 401, type: 'qna', subject: '数学', title: 'ベクトルの内積がよく分かりません。', status: 'answered' },
  { id: 402, type: 'qna', subject: '数学', title: '三角関数の合成の使い所は？', status: 'unanswered' },
  { id: 403, type: 'qna', subject: '英語', title: '関係代名詞の "what" と "which" の違い', status: 'answered' },
  { id: 404, type: 'qna', subject: '国語', title: '走れメロスの主題を教えてください。', status: 'answered' },
  { id: 405, type: 'qna', subject: '数学', title: '微分と積分の関係性', status: 'unanswered' },
  { id: 406, type: 'qna', subject: '数学', title: '三角関数の公式が覚えられません。', status: 'unanswered' },
];