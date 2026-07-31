/**
 * Google Drive Direct Link, Picker & Streaming Service.
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
 * Opens Google Drive Web Picker dialog directly inside the browser.
 */
export function openGoogleDrivePicker(onFilePicked) {
  if (typeof window === 'undefined') return;

  if (window.gapi) {
    window.gapi.load('picker', {
      callback: () => {
        try {
          const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
          view.setMimeTypes('application/pdf,image/png,image/jpeg,image/jpg');

          const picker = new window.google.picker.PickerBuilder()
            .addView(view)
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
            })
            .build();

          picker.setVisible(true);
        } catch (err) {
          console.warn('Google Picker fallback to manual URL input:', err);
        }
      }
    });
  }
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
