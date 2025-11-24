import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/**
 * 画像をアップロード
 * @param {File} file - アップロードするファイル
 * @param {string} folder - 保存先フォルダ名 ('prints', 'folders', etc.)
 * @returns {Promise<string>} - アップロード後の画像URL
 */
export const uploadImage = async (file, folder = 'images') => {
  try {
    // ファイル名を一意にする (タイムスタンプ + 元のファイル名)
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // ファイルをアップロード
    const snapshot = await uploadBytes(storageRef, file);
    
    // アップロード後のURLを取得
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 複数の画像を一括アップロード
 * @param {FileList} files - アップロードするファイルのリスト
 * @param {string} folder - 保存先フォルダ名
 * @returns {Promise<Array<string>>} - アップロード後の画像URLの配列
 */
export const uploadMultipleImages = async (files, folder = 'images') => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);
    
    const successResults = results.filter(r => r.success);
    const urls = successResults.map(r => r.url);
    
    return { success: true, urls };
  } catch (error) {
    console.error('複数画像アップロードエラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 画像を削除
 * @param {string} imageUrl - 削除する画像のURL
 */
export const deleteImage = async (imageUrl) => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    return { success: true };
  } catch (error) {
    console.error('画像削除エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * PDFファイルをアップロード
 * @param {File} file - アップロードするPDFファイル
 * @param {string} folder - 保存先フォルダ名
 */
export const uploadPDF = async (file, folder = 'pdfs') => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('PDFアップロードエラー:', error);
    return { success: false, error: error.message };
  }
};