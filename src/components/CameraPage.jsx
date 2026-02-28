import { useState } from 'react';
import styles from './CameraPage.module.css';
import { mainSubjects, subSubjects } from '../data.js'; // 教科リストをインポート

const allSubjects = [...mainSubjects, ...subSubjects];

function CameraPage({ onSaveItem }) {
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(allSubjects[0] || '国語'); // デフォルト値
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagePreview(URL.createObjectURL(file));
      // (本来はここでファイルをアップロードする処理が入る)
      
      // 仮のタイトルをファイル名から設定
      if (!title) {
        setTitle(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title && subject && imagePreview) {
      
      // (仮の) 保存処理
      const newItem = {
        type: 'print', // (仮: プリントとして保存)
        title: title,
        subject: subject,
        date: new Date().toISOString().split('T')[0], // 今日の日付
        imageUrl: imagePreview, // (仮: プレビュー画像をそのまま使う)
      };
      
      onSaveItem(newItem);
    } else {
      alert('画像、タイトル、教科をすべて入力してください。');
    }
  };

  return (
    <div className={styles.cameraContainer}>
      <h2 className={styles.title}>カメラ / アップロード</h2>
      
      <form className={styles.formContainer} onSubmit={handleSubmit}>
        
        {/* --- 画像プレビュー / アップロード --- */}
        <div className={styles.imageUploadBox}>
          {imagePreview ? (
            <img src={imagePreview} alt="プレビュー" className={styles.imagePreview} />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span>カメラ</span>
              <p>画像を選択してください</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className={styles.fileInput}
          />
        </div>
        
        {/* --- 情報入力 --- */}
        <div className={styles.infoForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="title">タイトル</label>
            <input 
              id="title"
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 数学 プリント 4/15"
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="subject">教科</label>
            <select 
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              {allSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={!imagePreview || !title || !subject}
          >
            保存する (仮)
          </button>
        </div>
        
      </form>
    </div>
  );
}

export default CameraPage;