/**
 * Google Drive Direct Link, Picker & Streaming Service.
 * Allows selecting files directly from Google Drive, performing OCR, and viewing PDFs multi-device.
 */

const DRIVE_FOLDER_KEY = 'biblioteca_google_drive_folder_id';
const DRIVE_API_KEY_STORAGE = 'biblioteca_google_drive_api_key';

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

export function getStoredDriveApiKey() {
  return localStorage.getItem(DRIVE_API_KEY_STORAGE) || '';
}

export function saveDriveApiKey(apiKey) {
  const trimmed = (apiKey || '').trim();
  if (trimmed) {
    localStorage.setItem(DRIVE_API_KEY_STORAGE, trimmed);
  } else {
    localStorage.removeItem(DRIVE_API_KEY_STORAGE);
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

  // Fallback: return trimmed string if alphanumeric ID length >= 10
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Generates a thumbnail URL for Google Drive file.
 * @param {string} fileId 
 * @returns {string}
 */
export function getDriveThumbnailUrl(fileId) {
  const cleanId = extractDriveFileId(fileId);
  if (!cleanId) return '';
  return `https://drive.google.com/thumbnail?id=${cleanId}&sz=w400`;
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
 * Safe link opener for Google Drive Web.
 */
export function openGoogleDriveWeb() {
  window.open('https://drive.google.com/drive/my-drive', '_blank');
}

/**
 * Opens Google Drive Web Picker modal using Developer API Key.
 * @param {object} params - { apiKey, onFilePicked, onError }
 */
export function openGoogleDrivePicker({ apiKey, onFilePicked, onError }) {
  if (typeof window === 'undefined') return;

  const keyToUse = apiKey || getStoredDriveApiKey();
  if (!keyToUse) {
    if (onError) onError('API Key do Google Drive não configurada.');
    return;
  }

  if (!window.gapi) {
    if (onError) onError('Biblioteca gapi do Google não foi carregada.');
    return;
  }

  window.gapi.load('picker', {
    callback: () => {
      try {
        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes('application/pdf,image/png,image/jpeg,image/jpg');

        const builder = new window.google.picker.PickerBuilder()
          .addView(view)
          .setDeveloperKey(keyToUse)
          .setCallback((data) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const doc = data.docs[0];
              if (doc) {
                onFilePicked({
                  id: doc.id,
                  name: doc.name,
                  url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
                  iconUrl: doc.iconUrl
                });
              }
            }
          });

        const picker = builder.build();
        picker.setVisible(true);
      } catch (err) {
        console.error('Erro ao abrir Google Picker:', err);
        if (onError) onError(err.message || 'Erro ao inicializar o Google Drive Picker.');
      }
    }
  });
}

/**
 * Fetches a Google Drive PDF file as Blob for OCR processing.
 * @param {string} fileId 
 * @returns {Promise<Blob>}
 */
export async function fetchDriveFileBlob(fileId) {
  const cleanId = extractDriveFileId(fileId);
  if (!cleanId) {
    throw new Error('ID ou Link do Google Drive inválido.');
  }

  // Primary: Direct Google Drive UC download
  const directUrl = getDriveDirectDownloadUrl(cleanId);
  try {
    const res = await fetch(directUrl);
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 100) return blob; // Valid file payload
    }
  } catch (e) {
    console.warn('Direct Google Drive fetch failed, trying proxy...', e);
  }

  // Secondary: CORS proxy for public Google Drive files
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;
  const proxyRes = await fetch(proxyUrl);
  if (!proxyRes.ok) {
    throw new Error('Não foi possível baixar o arquivo do Google Drive. Certifique-se de que o compartilhamento do arquivo está como "Qualquer pessoa com o link".');
  }

  return await proxyRes.blob();
}
