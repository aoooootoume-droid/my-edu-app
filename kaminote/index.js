const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Gemini APIキーをシークレットとして定義
const geminiKey = defineSecret("GEMINI_API_KEY");

/**
 * recordingsドキュメントが作成されたときに神ノートを生成
 */
exports.generateKamiNote = onDocumentCreated(
  {
    document: "recordings/{recordingId}",
    region: "asia-northeast1",
    secrets: [geminiKey],
  },
  async (event) => {
    const data = event.data.data();

    // transcriptionがない場合はスキップ
    if (!data.transcription) {
      console.log("No transcription found, skipping...");
      return null;
    }

    console.log(`Generating KamiNote for recording: ${event.params.recordingId}`);

    try {
      const genAI = new GoogleGenerativeAI(geminiKey.value());
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
あなたは教育の専門家です。以下の授業内容から、わかりやすい授業まとめを作成してください。

【教科】${data.subject || "不明"}
【クラス】${data.className || "不明"}

【授業内容（文字起こし）】
${data.transcription}

【作成するコンテンツ】
授業の内容を構造化してまとめてください（300〜800文字）。
- 重要なポイントを箇条書きで整理
- キーワードを明確に
- 初学者にもわかりやすく

【出力形式】
必ず以下のJSON形式のみで出力してください。

{
  "title": "授業のタイトル",
  "content": "授業の要約文",
  "keywords": ["キーワード1", "キーワード2", "キーワード3"]
}

【重要】
- JSONのみを出力
- 日本語で出力
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // JSONをパース
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const kamiNote = JSON.parse(text);

      // Firestoreに保存
      await event.data.ref.update({
        kamiNote: {
          ...kamiNote,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

      console.log(`KamiNote generated successfully for: ${event.params.recordingId}`);
      return { success: true };

    } catch (error) {
      console.error("Error generating KamiNote:", error);
      return { success: false, error: error.message };
    }
  }
);