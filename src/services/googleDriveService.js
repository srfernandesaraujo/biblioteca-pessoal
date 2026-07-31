/**
 * Google Drive API Service for Multi-Device Sync without external database.
 * Uses Google Drive REST API v3 directly from the browser.
 */

const DRIVE_FOLDER_KEY = 'biblioteca_google_drive_folder_id';

export function getStoredDriveFolderId() {
  return localStorage.getItem(DRIVE_FOLDER_KEY) || '';
}

export function saveDriveFolderId(folderId) {
  const trimmed = (folderId || '').trim();
  if (trimmed) {
    localStorage.setItem(DRIVE_FOLDER_KEY, trimmed);
  } else {
    localStorage.removeItem(DRIVE_FOLDER_KEY);
  }
}

/**
 * Extracts Google Drive Folder ID from a full Google Drive URL or raw ID string.
 * Example URL: https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i
 */
export function extractFolderId(urlOrId) {
  if (!urlOrId) return '';
  const match = urlOrId.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return urlOrId.trim();
}

/**
 * Lists PDF files and backups inside a Google Drive folder.
 */
export async function listDriveFolderFiles(folderId, accessToken) {
  const cleanId = extractFolderId(folderId);
  if (!cleanId) throw new Error('ID da pasta do Google Drive inválido.');

  const query = `'${cleanId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,thumbnailLink,webContentLink)&pageSize=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro HTTP ${response.status} ao acessar a pasta do Google Drive.`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Downloads a file from Google Drive as Blob.
 */
export async function downloadDriveFileBlob(fileId, accessToken) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao baixar arquivo do Google Drive.`);
  }

  return await response.blob();
}

/**
 * Uploads or updates the library backup file (biblioteca_sync.json) to Google Drive.
 */
export async function syncBackupToDrive(folderId, jsonBackupString, accessToken) {
  const cleanId = extractFolderId(folderId);
  if (!cleanId) throw new Error('ID da pasta do Google Drive inválido.');

  // Check if biblioteca_sync.json already exists in the folder
  const existingFiles = await listDriveFolderFiles(cleanId, accessToken);
  const syncFile = existingFiles.find(f => f.name === 'biblioteca_sync.json');

  const metadata = {
    name: 'biblioteca_sync.json',
    mimeType: 'application/json',
    parents: syncFile ? undefined : [cleanId]
  };

  const fileBlob = new Blob([jsonBackupString], { type: 'application/json' });
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);

  const endpoint = syncFile
    ? `https://www.googleapis.com/upload/drive/v3/files/${syncFile.id}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  const method = syncFile ? 'PATCH' : 'POST';

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: form
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao salvar biblioteca_sync.json no Google Drive.`);
  }

  return await response.json();
}

/**
 * Downloads the biblioteca_sync.json file content from Google Drive.
 */
export async function fetchBackupFromDrive(folderId, accessToken) {
  const cleanId = extractFolderId(folderId);
  if (!cleanId) throw new Error('ID da pasta do Google Drive inválido.');

  const files = await listDriveFolderFiles(cleanId, accessToken);
  const syncFile = files.find(f => f.name === 'biblioteca_sync.json');

  if (!syncFile) {
    throw new Error('Nenhum arquivo biblioteca_sync.json encontrado nesta pasta do Google Drive.');
  }

  const blob = await downloadDriveFileBlob(syncFile.id, accessToken);
  const text = await blob.text();
  return JSON.parse(text);
}
