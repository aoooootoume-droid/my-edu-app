import { useState, useEffect } from 'react';
import styles from './GroupDetailPage.module.css';
import { 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  FilePdf, 
  Copy,
  Trash,
  UploadSimple,
  X
} from '@phosphor-icons/react';
import {
  getGroup,
  onGroupCardsChange,
  onGroupFilesChange,
  addGroupCard,
  addGroupFile,
  deleteGroupCard,
  deleteGroupFile,
  leaveGroup
} from '../firebase/database';
import { uploadImage, uploadPDF } from '../firebase/storage';
import Card from './Card';

function GroupDetailPage({ currentUser, groupId, onBackClick }) {
  const [group, setGroup] = useState(null);
  const [cards, setCards] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('cards');
  const [loading, setLoading] = useState(true);

  const [showCardModal, setShowCardModal] = useState(false);
  const [newCard, setNewCard] = useState({
    type: 'folder',
    title: '',
    subject: '',
    date: '',
    thumbnail: '',
    content: ''
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    const unsubscribeCards = onGroupCardsChange(groupId, (newCards) => {
      setCards(newCards);
    });

    const unsubscribeFiles = onGroupFilesChange(groupId, (newFiles) => {
      setFiles(newFiles);
    });

    return () => {
      unsubscribeCards();
      unsubscribeFiles();
    };
  }, [groupId]);

  const loadGroupData = async () => {
    setLoading(true);
    const result = await getGroup(groupId);
    if (result.success) {
      setGroup(result.data);
    } else {
      alert('グループ情報の取得に失敗しました');
      onBackClick();
    }
    setLoading(false);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingThumbnail(true);
    const result = await uploadImage(file, 'group-thumbnails');
    if (result.success) {
      setNewCard({ ...newCard, thumbnail: result.url });
    } else {
      alert('画像のアップロードに失敗しました');
    }
    setUploadingThumbnail(false);
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newCard.title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    const result = await addGroupCard(groupId, currentUser.uid, {
      ...newCard,
      userName: currentUser.displayName || currentUser.email || '匿名'
    });

    if (result.success) {
      setShowCardModal(false);
      setNewCard({
        type: 'folder',
        title: '',
        subject: '',
        date: '',
        thumbnail: '',
        content: ''
      });
    } else {
      alert('カードの作成に失敗しました: ' + result.error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);

    let uploadResult;
    let fileType;

    if (file.type.startsWith('image/')) {
      uploadResult = await uploadImage(file, 'group-files');
      fileType = 'image';
    } else if (file.type === 'application/pdf') {
      uploadResult = await uploadPDF(file, 'group-files');
      fileType = 'pdf';
    } else {
      alert('画像またはPDFファイルのみアップロード可能です');
      setUploadingFile(false);
      return;
    }

    if (uploadResult.success) {
      const fileData = {
        fileName: file.name,
        fileUrl: uploadResult.url,
        fileType,
        userName: currentUser.displayName || currentUser.email || '匿名'
      };

      const result = await addGroupFile(groupId, currentUser.uid, fileData);
      if (!result.success) {
        alert('ファイルの保存に失敗しました');
      }
    } else {
      alert('ファイルのアップロードに失敗しました');
    }

    setUploadingFile(false);
    e.target.value = '';
  };

  const handleDeleteCard = async (cardId, userId) => {
    if (userId !== currentUser.uid) {
      alert('自分が作成したカードのみ削除できます');
      return;
    }

    if (!confirm('このカードを削除しますか？')) return;

    const result = await deleteGroupCard(cardId);
    if (!result.success) {
      alert('削除に失敗しました');
    }
  };

  const handleDeleteFile = async (fileId, userId) => {
    if (userId !== currentUser.uid) {
      alert('自分がアップロードしたファイルのみ削除できます');
      return;
    }

    if (!confirm('このファイルを削除しますか？')) return;

    const result = await deleteGroupFile(fileId);
    if (!result.success) {
      alert('削除に失敗しました');
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    alert('招待コードをコピーしました！');
  };

  const handleLeaveGroup = async () => {
    if (!confirm('このグループから退出しますか？')) return;

    const result = await leaveGroup(groupId, currentUser.uid);
    if (result.success) {
      alert('グループから退出しました');
      onBackClick();
    } else {
      alert('退出に失敗しました: ' + result.error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBackClick}>
          <ArrowLeft size={24} weight="bold" />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.groupName}>{group?.name}</h1>
          <div className={styles.headerMeta}>
            <span className={styles.memberCount}>
              {group?.members?.length || 0}人のメンバー
            </span>
            <button 
              className={styles.inviteCodeButton}
              onClick={handleCopyInviteCode}
            >
              <Copy size={16} />
              {group?.inviteCode}
            </button>
          </div>
        </div>
        <button className={styles.leaveButton} onClick={handleLeaveGroup}>
          退出
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'cards' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          カード ({cards.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'files' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('files')}
        >
          ファイル ({files.length})
        </button>
      </div>

      {activeTab === 'cards' && (
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <button 
              className={styles.addButton}
              onClick={() => setShowCardModal(true)}
            >
              <Plus size={20} weight="bold" />
              カードを作成
            </button>
          </div>

          {cards.length === 0 ? (
            <div className={styles.emptyState}>
              <p>まだカードがありません</p>
              <p className={styles.emptyHint}>カードを作成して共有しましょう</p>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {cards.map(card => (
                <div key={card.id} className={styles.cardWrapper}>
                  <Card 
                    card={{
                      ...card,
                      id: card.id
                    }} 
                    onClick={() => {}} 
                  />
                  <div className={styles.cardFooter}>
                    <span className={styles.cardAuthor}>{card.userName}</span>
                    {card.userId === currentUser.uid && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteCard(card.id, card.userId)}
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <label className={styles.uploadButton}>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploadingFile}
              />
              <UploadSimple size={20} weight="bold" />
              {uploadingFile ? 'アップロード中...' : 'ファイルをアップロード'}
            </label>
          </div>

          {files.length === 0 ? (
            <div className={styles.emptyState}>
              <p>まだファイルがありません</p>
              <p className={styles.emptyHint}>画像やPDFを共有しましょう</p>
            </div>
          ) : (
            <div className={styles.fileGrid}>
              {files.map(file => (
                <div key={file.id} className={styles.fileCard}>
                  <a 
                    href={file.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.fileLink}
                  >
                    <div className={styles.fileIcon}>
                      {file.fileType === 'image' ? (
                        <ImageIcon size={32} weight="fill" />
                      ) : (
                        <FilePdf size={32} weight="fill" />
                      )}
                    </div>
                    <div className={styles.fileInfo}>
                      <p className={styles.fileName}>{file.fileName}</p>
                      <p className={styles.fileAuthor}>{file.userName}</p>
                    </div>
                  </a>
                  {file.userId === currentUser.uid && (
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteFile(file.id, file.userId)}
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCardModal && (
        <div className={styles.modal} onClick={() => setShowCardModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>カードを作成</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCardModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateCard}>
              <div className={styles.formGroup}>
                <label>タイプ</label>
                <select
                  value={newCard.type}
                  onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
                >
                  <option value="folder">フォルダ</option>
                  <option value="print">プリント</option>
                  <option value="homework">宿題</option>
                  <option value="qna">質問</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>タイトル *</label>
                <input
                  type="text"
                  value={newCard.title}
                  onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                  placeholder="タイトルを入力"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>科目</label>
                <input
                  type="text"
                  value={newCard.subject}
                  onChange={(e) => setNewCard({ ...newCard, subject: e.target.value })}
                  placeholder="例: 数学"
                />
              </div>

              <div className={styles.formGroup}>
                <label>日付</label>
                <input
                  type="text"
                  value={newCard.date}
                  onChange={(e) => setNewCard({ ...newCard, date: e.target.value })}
                  placeholder="例: 2024/01/15"
                />
              </div>

              {(newCard.type === 'folder' || newCard.type === 'print') && (
                <div className={styles.formGroup}>
                  <label>サムネイル画像</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={uploadingThumbnail}
                  />
                  {uploadingThumbnail && <p>アップロード中...</p>}
                  {newCard.thumbnail && (
                    <img 
                      src={newCard.thumbnail} 
                      alt="サムネイル" 
                      className={styles.thumbnailPreview}
                    />
                  )}
                </div>
              )}

              <div className={styles.formGroup}>
                <label>内容（任意）</label>
                <textarea
                  value={newCard.content}
                  onChange={(e) => setNewCard({ ...newCard, content: e.target.value })}
                  placeholder="カードの説明..."
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowCardModal(false)}
                >
                  キャンセル
                </button>
                <button type="submit" className={styles.submitButton}>
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetailPage;