import { db } from './config';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

// WebRTC設定
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

/**
 * ライブ配信を開始（配信者側）
 */
export const startLiveStream = async (liveId, userId, userName) => {
  try {
    // カメラとマイクを取得
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // Firestoreにライブ配信情報を保存
    await setDoc(doc(db, 'liveStreams', liveId), {
      hostId: userId,
      hostName: userName,
      isActive: true,
      startedAt: serverTimestamp(),
      viewers: []
    });

    return { success: true, stream };
  } catch (error) {
    console.error('配信開始エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 画面共有を開始
 */
export const startScreenShare = async () => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always'
      },
      audio: false
    });

    return { success: true, stream: screenStream };
  } catch (error) {
    console.error('画面共有エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * WebRTC接続を作成（配信者 → 視聴者）
 */
export const createPeerConnection = async (liveId, viewerId, localStream) => {
  try {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);

    // ローカルストリームを追加
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // ICE Candidateの処理
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(collection(db, `liveStreams/${liveId}/viewers/${viewerId}/iceCandidates`), {
          candidate: event.candidate.toJSON(),
          timestamp: serverTimestamp()
        });
      }
    };

    // Offerを作成
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Offerを保存
    await setDoc(doc(db, `liveStreams/${liveId}/viewers/${viewerId}`), {
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      createdAt: serverTimestamp()
    });

    // Answerを待つ
    const viewerDoc = doc(db, `liveStreams/${liveId}/viewers/${viewerId}`);
    const unsubscribe = onSnapshot(viewerDoc, async (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !peerConnection.currentRemoteDescription) {
        const answer = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(answer);
      }
    });

    // ICE Candidatesを監視
    const candidatesCollection = collection(db, `liveStreams/${liveId}/viewers/${viewerId}/hostIceCandidates`);
    const candidatesUnsubscribe = onSnapshot(candidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data().candidate);
          await peerConnection.addIceCandidate(candidate);
        }
      });
    });

    return {
      success: true,
      peerConnection,
      cleanup: () => {
        unsubscribe();
        candidatesUnsubscribe();
      }
    };
  } catch (error) {
    console.error('PeerConnection作成エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ライブ配信に参加（視聴者側）
 */
export const joinLiveStream = async (liveId, viewerId) => {
  try {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);

    // リモートストリームを受信
    const remoteStream = new MediaStream();
    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
    };

    // Offerを取得
    const viewerDoc = doc(db, `liveStreams/${liveId}/viewers/${viewerId}`);
    const viewerSnapshot = await getDoc(viewerDoc);

    if (!viewerSnapshot.exists()) {
      throw new Error('配信情報が見つかりません');
    }

    const offerData = viewerSnapshot.data().offer;
    const offer = new RTCSessionDescription(offerData);
    await peerConnection.setRemoteDescription(offer);

    // Answerを作成
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Answerを保存
    await updateDoc(viewerDoc, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      }
    });

    // ICE Candidateの処理
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await addDoc(collection(db, `liveStreams/${liveId}/viewers/${viewerId}/hostIceCandidates`), {
          candidate: event.candidate.toJSON(),
          timestamp: serverTimestamp()
        });
      }
    };

    // ICE Candidatesを監視
    const candidatesCollection = collection(db, `liveStreams/${liveId}/viewers/${viewerId}/iceCandidates`);
    const candidatesUnsubscribe = onSnapshot(candidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data().candidate);
          await peerConnection.addIceCandidate(candidate);
        }
      });
    });

    return {
      success: true,
      peerConnection,
      remoteStream,
      cleanup: candidatesUnsubscribe
    };
  } catch (error) {
    console.error('配信参加エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ライブ配信を終了
 */
export const endLiveStream = async (liveId) => {
  try {
    await updateDoc(doc(db, 'liveStreams', liveId), {
      isActive: false,
      endedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('配信終了エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * チャットメッセージを送信
 */
export const sendChatMessage = async (liveId, userId, userName, message) => {
  try {
    await addDoc(collection(db, `liveStreams/${liveId}/chat`), {
      userId,
      userName,
      message,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('メッセージ送信エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * チャットメッセージを監視
 */
export const onChatMessages = (liveId, callback) => {
  const chatCollection = collection(db, `liveStreams/${liveId}/chat`);
  return onSnapshot(chatCollection, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};