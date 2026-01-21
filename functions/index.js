const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Firebase Admin初期化
admin.initializeApp();
const db = admin.firestore();

// シークレット定義
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// グローバル設定
setGlobalOptions({ 
  maxInstances: 10,
  region: "asia-northeast1"
});

/**
 * まとめノート生成のHTTPエンドポイント
 */
exports.generateQuiz = onRequest(
  { secrets: [geminiApiKey], cors: true },
  async (req, res) => {
    try {
      const { 
        transcript,
        imageUrls,
        schoolCode,
        classCode,
        subjectName,
        recordingId,
        title
      } = req.body;

      if (!transcript || !schoolCode || !classCode) {
        res.status(400).json({ error: "必須パラメータが不足しています" });
        return;
      }

      // Gemini APIでまとめノート生成
      const noteData = await generateNoteWithGemini(
        geminiApiKey.value(),
        transcript,
        imageUrls || [],
        subjectName
      );

      // Firestoreに保存
      const quizData = {
        schoolCode,
        classCode,
        subjectName: subjectName || "",
        recordingId: recordingId || null,
        title: title || `${subjectName} - まとめノート`,
        ...noteData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection("quizzes").add(quizData);

      res.json({ 
        success: true, 
        quizId: docRef.id
      });

    } catch (error) {
      logger.error("ノート生成エラー:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * 録画ドキュメント作成時に自動で生成
 */
exports.onRecordingCreated = onDocumentCreated(
  { 
    document: "recordings/{recordingId}",
    secrets: [geminiApiKey]
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("データがありません");
      return;
    }

    const recording = snapshot.data();
    const recordingId = event.params.recordingId;

    if (!recording.transcript) {
      logger.log("文字起こしがないためスキップ:", recordingId);
      return;
    }

    try {
      logger.log("ノート生成開始:", recordingId);

      const noteData = await generateNoteWithGemini(
        geminiApiKey.value(),
        recording.transcript,
        recording.thumbnailUrls || [],
        recording.subjectName
      );

      const quizData = {
        schoolCode: recording.schoolCode,
        classCode: recording.classCode,
        subjectName: recording.subjectName || "",
        recordingId: recordingId,
        title: recording.title || `${recording.subjectName} - まとめノート`,
        ...noteData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection("quizzes").add(quizData);
      await snapshot.ref.update({ quizId: docRef.id });

      logger.log("ノート生成完了:", docRef.id);

    } catch (error) {
      logger.error("自動ノート生成エラー:", error);
    }
  }
);

/**
 * Gemini APIでまとめノートを生成
 */
async function generateNoteWithGemini(apiKey, transcript, imageUrls, subjectName) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
あなたは教育の専門家です。以下の授業内容から、4段階の学習ノートを作成してください。

【教科】${subjectName || "不明"}

【授業内容（文字起こし）】
${transcript}

【作成するコンテンツ】

1. **神ノート（授業まとめ）**
   - 授業の内容を構造化してまとめる
   - 重要なキーワード（5〜8個）を抽出し、それを含む文章を作成
   - キーワードの位置を特定できるようにする

2. **Step1: 基礎用語（選択式）3問**
   - 基本的な用語や概念の確認問題
   - 4択形式

3. **Step2: 文脈理解（穴埋め）3問**
   - 授業内容の文章の一部を空欄にする
   - 空欄に入る正解を用意

4. **Step3: 思考力（記述式）2問**
   - 考えさせる問題
   - 模範解答を用意

【出力形式】
必ず以下のJSON形式で出力してください。他の説明は不要です。

{
  "summary": {
    "title": "授業のタイトル",
    "content": "授業の要約文（キーワードを含む。300文字程度）",
    "keywords": [
      { "word": "キーワード1", "startIndex": 10, "endIndex": 15 },
      { "word": "キーワード2", "startIndex": 30, "endIndex": 35 }
    ]
  },
  "step1": [
    {
      "question": "問題文",
      "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "correctIndex": 0
    }
  ],
  "step2": [
    {
      "sentence": "これは___の例です。",
      "blank": "___",
      "answer": "正解の単語"
    }
  ],
  "step3": [
    {
      "question": "問題文",
      "sampleAnswer": "模範解答"
    }
  ]
}

注意：
- keywordsのstartIndexとendIndexはcontentの文字位置です
- step2のsentenceには"___"で空欄を表現してください
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let jsonStr = text;
    if (text.includes("```json")) {
      jsonStr = text.split("```json")[1].split("```")[0];
    } else if (text.includes("```")) {
      jsonStr = text.split("```")[1].split("```")[0];
    }
    
    const parsed = JSON.parse(jsonStr.trim());
    return parsed;

  } catch (error) {
    logger.error("Gemini API エラー:", error);
    throw new Error("ノート生成に失敗しました: " + error.message);
  }
}

/**
 * 回答結果を保存するエンドポイント
 */
exports.saveQuizResult = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const {
        quizId,
        userId,
        studentName,
        schoolCode,
        classCode,
        step1Results,
        step2Results,
        step3Answers,
        totalScore
      } = req.body;

      if (!quizId || !userId) {
        res.status(400).json({ error: "必須パラメータが不足しています" });
        return;
      }

      const resultData = {
        quizId,
        userId,
        studentName: studentName || "",
        schoolCode,
        classCode,
        step1Results: step1Results || [],
        step2Results: step2Results || [],
        step3Answers: step3Answers || [],
        totalScore: totalScore || 0,
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const resultRef = await db.collection("quizResults").add(resultData);

      res.json({
        success: true,
        resultId: resultRef.id
      });

    } catch (error) {
      logger.error("結果保存エラー:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// 旧API互換性のため残す
exports.scoreQuiz = onRequest(
  { cors: true },
  async (req, res) => {
    // 新しいsaveQuizResultにリダイレクト
    try {
      const {
        quizId,
        userId,
        studentName,
        schoolCode,
        classCode,
        answers
      } = req.body;

      if (!quizId || !userId) {
        res.status(400).json({ error: "必須パラメータが不足しています" });
        return;
      }

      const resultData = {
        quizId,
        userId,
        studentName: studentName || "",
        schoolCode,
        classCode,
        answers: answers || [],
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const resultRef = await db.collection("quizResults").add(resultData);

      res.json({
        success: true,
        resultId: resultRef.id,
        totalScore: 0,
        answers: answers
      });

    } catch (error) {
      logger.error("採点エラー:", error);
      res.status(500).json({ error: error.message });
    }
  }
);