import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import * as DocumentPicker from 'expo-document-picker';
import { PICKER_TYPES } from '../utils/pdfPages';

export const pickPrintDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: PICKER_TYPES,
    copyToCacheDirectory: true,
    base64: false,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const browserFile = asset.file;
  if (browserFile && asset.uri?.startsWith('blob:')) URL.revokeObjectURL(asset.uri);
  let size = asset.size ?? browserFile?.size;
  if (size == null && Platform.OS !== 'web') {
    const info = await FileSystem.getInfoAsync(asset.uri);
    if (info.exists && !info.isDirectory) size = info.size;
  }
  return { name: asset.name, size, mimeType: asset.mimeType, uri: asset.uri, browserFile };
};

const FOLDER = 'print-jobs/';
const STORE = 'documents';

const accessBrowserDocument = (access, mode = 'readwrite') => new Promise((resolve, reject) => {
  const request = globalThis.indexedDB.open('campusgo-print', 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE);
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const db = request.result;
    try {
      const transaction = db.transaction(STORE, mode);
      const operation = access(transaction.objectStore(STORE));
      transaction.oncomplete = () => { db.close(); resolve(operation.result); };
      transaction.onabort = () => { db.close(); reject(transaction.error); };
    } catch (error) {
      db.close();
      reject(error);
    }
  };
});

// Store file contents locally and keep only a small reference in the Bag and order history.
export const savePrintDocument = async (file, key) => {
  if (file.sample) return null;
  if (Platform.OS === 'web') {
    if (!file.browserFile) throw new Error('Document is unavailable');
    await accessBrowserDocument((documents) => documents.put(file.browserFile, key));
    return { browserFileKey: key };
  }
  if (!FileSystem.documentDirectory || !file.uri) throw new Error('Document storage is unavailable');
  const extension = /\.[a-z0-9]{1,10}$/i.exec(file.name)?.[0] ?? '';
  const localPath = FOLDER + key + extension;
  const destination = FileSystem.documentDirectory + localPath;
  await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + FOLDER, { intermediates: true });
  try {
    await FileSystem.copyAsync({ from: file.uri, to: destination });
  } catch (error) {
    await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => {});
    throw error;
  }
  return { localPath };
};

export const discardPrintDocument = async (reference) => {
  if (reference?.localPath) {
    await FileSystem.deleteAsync(FileSystem.documentDirectory + reference.localPath, { idempotent: true });
  } else if (reference?.browserFileKey) {
    await accessBrowserDocument((documents) => documents.delete(reference.browserFileKey));
  }
};

export const canReusePrintDocument = async (file) => {
  if (file?.sample) return true;
  try {
    if (Platform.OS === 'web') {
      return Boolean(file?.browserFileKey && await accessBrowserDocument(
        (documents) => documents.getKey(file.browserFileKey), 'readonly'
      ));
    }
    if (!file?.localPath || !FileSystem.documentDirectory) return false;
    const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory + file.localPath);
    return info.exists && !info.isDirectory;
  } catch {
    return false;
  }
};
