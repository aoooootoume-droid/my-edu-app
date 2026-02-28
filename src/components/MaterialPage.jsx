import { useState, useEffect } from 'react';
import styles from './MaterialPage.module.css';
import { db, storage } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

function MaterialPage({ filterSubject, searchTerm = '', onCardClick, currentUser, selectedClass }) {
  const [materials, setMaterials] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const isTeacher = currentUser?.role === 'teacher';
  const term = searchTerm.toLowerCase();

  // 資料をリアルタイムで取得
  useEffect(() => {
    const q = query(
      collection(db, 'materials'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const materialsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      setMaterials(materialsData);
    });

    return () => unsubscribe();
  }, []);

  // フィルタリング
  const filteredMaterials = materials.filter(material => {
    const subjectMatch = filterSubject ? material.subject === filterSubject : true;
    const classMatch = selectedClass ? (material.className === selectedClass || !material.className) : true;
    const titleMatch = material.title.toLowerCase().includes(term);
    return subjectMatch && classMatch && titleMatch;
  });

  // ファイル選択
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  // フォーム入力
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // アップロード
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('ファイルを選択してください');
      return;
    }

    if (!formData.title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const filename = `materials/${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'materials'), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: filterSubject,
        className: selectedClass,
        fileUrl: downloadURL,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        createdBy: currentUser?.uid,
        createdAt: serverTimestamp()
      });

      setFormData({ title: '', description: '' });
      setSelectedFile(null);
      setShowUploadForm(false);
      alert('資料をアップロードしました！');
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  // 削除
  const handleDelete = async (e, material) => {
    e.stopPropagation();

    if (!window.confirm(`「${material.title}」を削除しますか？`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'materials', material.id));

      if (material.fileUrl) {
        try {
          const fileRef = ref(storage, material.fileUrl);
          await deleteObject(fileRef);
        } catch (err) {
          console.log('ファイル削除スキップ:', err);
        }
      }

      alert('削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  // ファイルを開く
  const handleOpenFile = (material) => {
    window.open(material.fileUrl, '_blank');
  };

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ファイルタイプからアイコンを取得
  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return 'PDF';
    if (fileType?.includes('image')) return 'IMG';
    if (fileType?.includes('video')) return 'VID';
    if (fileType?.includes('audio')) return 'AUD';
    if (fileType?.includes('word') || fileType?.includes('document')) return 'DOC';
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return 'XLS';
    if (fileType?.includes('presentation') || fileType?.includes('powerpoint')) return 'PPT';
    return 'FILE';
  };

  return (
    <div className={styles.materialContainer}>
      
      {/* 教員用：アップロードボタン */}
      {isTeacher && (
        <div className={styles.uploadButtonWrapper}>
          <button 
            className={styles.uploadButton}
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            {showUploadForm ? 'キャンセル' : '資料をアップロード'}
          </button>
        </div>
      )}

      {/* アップロードフォーム */}
      {isTeacher && showUploadForm && (
        <div className={styles.uploadForm}>
          <h3 className={styles.formTitle}>資料をアップロード</h3>
          
          <form onSubmit={handleUpload}>
            <div className={styles.formGroup}>
              <label>ファイル *</label>
              <div className={styles.fileInputWrapper}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  id="fileInput"
                />
                <label htmlFor="fileInput" className={styles.fileInputLabel}>
                  {selectedFile ? selectedFile.name : 'ファイルを選択'}
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">タイトル *</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="資料のタイトル"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">説明</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="資料の説明..."
                rows={3}
                className={styles.textarea}
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isUploading}
            >
              {isUploading ? 'アップロード中...' : 'アップロード'}
            </button>
          </form>
        </div>
      )}

      {/* 資料一覧 */}
      <div className={styles.materialList}>
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map(material => (
            <div 
              key={material.id} 
              className={styles.materialCard}
              onClick={() => handleOpenFile(material)}
            >
              <div className={styles.fileIcon}>
                {getFileIcon(material.fileType)}
              </div>
              <div className={styles.materialInfo}>
                <h4 className={styles.materialTitle}>{material.title}</h4>
                {material.description && (
                  <p className={styles.materialDescription}>{material.description}</p>
                )}
                <div className={styles.materialMeta}>
                  <span className={styles.fileName}>{material.fileName}</span>
                  <span className={styles.fileSize}>{formatFileSize(material.fileSize)}</span>
                </div>
              </div>
              {isTeacher && (
                <button 
                  className={styles.deleteButton}
                  onClick={(e) => handleDelete(e, material)}
                >
                  削除
                </button>
              )}
            </div>
          ))
        ) : (
          <div className={styles.noData}>
            <p>資料はまだありません</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialPage;