/**
 * Google Drive Direct Link & Streaming Service.
 * Allows selecting files directly from Google Drive, performing OCR, and viewing PDFs multi-device.
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

export function extractFolderId(urlOrId) {
  if (!urlOrId) return '';
  const match = urlOrId.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return urlOrId.trim();
}

/**
 * Extracts a Google Drive File ID from a full shareable link or raw ID string.
 * Examples:
 * - https://drive.google.com/file/d/1ABC123xyz_456/view?usp=sharing
 * - https://drive.google.com/open?id=1ABC123xyz_456
 * - 1ABC123xyz_456
 */
export function extractDriveFileId(urlOrId) {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();

  // Pattern 1: /file/d/FILE_ID/
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: id=FILE_ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Pattern 3: /document/d/FILE_ID/
  const matchDocD = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (matchDocD && matchDocD[1]) return matchDocD[1];

  // Fallback: return trimmed string if alphanumeric ID length
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Generates an iframe embed URL for viewing PDF directly from Google Drive.
 * @param {string} fileId 
 * @returns {string}
 */
export function getDriveEmbedPreviewUrl(fileId) {
  const cleanId = extractDriveFileId(fileId);
  return `https://drive.google.com/file/d/${cleanId}/preview`;
}

/**
 * Generates a direct download URL for Google Drive file.
 * @param {string} fileId 
 * @returns {string}
 */
export function getDriveDirectDownloadUrl(fileId) {
  const cleanId = extractDriveFileId(fileId);
  return `https://drive.google.com/uc?export=download&id=${cleanId}`;
}

/**
 * Fetches a Google Drive PDF file as Blob for OCR processing.
 * @param {string} fileId 
 * @returns {Promise<Blob>}
 */
export async function fetchDriveFileBlob(fileId) {
  const cleanId = extractDriveFileId(fileId);
  
  // Try direct download URL
  const directUrl = getDriveDirectDownloadUrl(cleanId);
  try {
    const res = await fetch(directUrl);
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0) return blob;
    }
  } catch (e) {
    console.warn('Direct fetch failed, trying proxy...', e);
  }

  // Fallback CORS proxy for public Google Drive files
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;
  const proxyRes = await fetch(proxyUrl);
  if (!proxyRes.ok) {
    throw new Error('Não foi possível baixar o arquivo do Google Drive. Certifique-se de que o link é público ("Qualquer pessoa com o link").');
  }

  return await proxyRes.blob();
}
