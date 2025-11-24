import { useState, useEffect } from 'react';
import styles from './GroupPage.module.css';
import { Plus, Users, SignIn, X } from '@phosphor-icons/react';
import { createGroup, joinGroupByCode, getUserGroups } from '../firebase/database';

function GroupPage({ currentUser, onGroupClick }) {
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    loadGroups();
  }, [currentUser]);

  const loadGroups = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    const userGroups = await getUserGroups(currentUser.uid);
    setGroups(userGroups);
    setLoading(false);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('グループ名を入力してください');
      return;
    }

    const result = await createGroup(
      {
        name: newGroupName,
        description: newGroupDescription
      },
      currentUser.uid
    );

    if (result.success) {
      alert(`グループを作成しました！\n招待コード: ${result.inviteCode}`);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      loadGroups();
    } else {
      alert('グループ作成に失敗しました: ' + result.error);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      alert('招待コードを入力してください');
      return;
    }

    const result = await joinGroupByCode(inviteCode.toUpperCase(), currentUser.uid);

    if (result.success) {
      alert(`「${result.groupName}」に参加しました！`);
      setShowJoinModal(false);
      setInviteCode('');
      loadGroups();
    } else {
      alert('参加に失敗しました: ' + result.error);
    }
  };

  const handleGroupClick = (groupId) => {
    onGroupClick(groupId);
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
        <h1 className={styles.title}>
          <Users size={32} weight="fill" />
          グループ学習
        </h1>
        <div className={styles.actions}>
          <button 
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} weight="bold" />
            グループ作成
          </button>
          <button 
            className={styles.joinButton}
            onClick={() => setShowJoinModal(true)}
          >
            <SignIn size={20} weight="bold" />
            グループ参加
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={64} weight="thin" />
          <p>参加しているグループがありません</p>
          <p className={styles.emptyHint}>
            グループを作成するか、招待コードで参加してください
          </p>
        </div>
      ) : (
        <div className={styles.groupGrid}>
          {groups.map(group => (
            <div 
              key={group.id} 
              className={styles.groupCard}
              onClick={() => handleGroupClick(group.id)}
            >
              <div className={styles.groupIcon}>
                <Users size={32} weight="fill" />
              </div>
              <div className={styles.groupInfo}>
                <h3 className={styles.groupName}>{group.name}</h3>
                {group.description && (
                  <p className={styles.groupDescription}>{group.description}</p>
                )}
                <div className={styles.groupMeta}>
                  <span className={styles.memberCount}>
                    {group.members?.length || 0}人のメンバー
                  </span>
                  <span className={styles.inviteCode}>
                    コード: {group.inviteCode}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>グループを作成</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className={styles.formGroup}>
                <label>グループ名 *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="例: 数学グループA"
                  maxLength={50}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>説明（任意）</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="グループの説明を入力..."
                  rows={3}
                  maxLength={200}
                />
              </div>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
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

      {showJoinModal && (
        <div className={styles.modal} onClick={() => setShowJoinModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>グループに参加</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowJoinModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleJoinGroup}>
              <div className={styles.formGroup}>
                <label>招待コード *</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="例: ABC123"
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                <p className={styles.hint}>
                  6桁の招待コードを入力してください
                </p>
              </div>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowJoinModal(false)}
                >
                  キャンセル
                </button>
                <button type="submit" className={styles.submitButton}>
                  参加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupPage;