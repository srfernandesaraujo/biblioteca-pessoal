import { createWorker } from 'tesseract.js';
import { convertPdfPageToImage, processPdfFile } from './pdfService';

/**
 * Performs OCR text recognition on an image or PDF file locally.
 * @param {File | Blob} file 
 * @param {function} onProgress - Progress callback callback({ status, progress })
 * @returns {Promise<{ ocrText: string, thumbnail: string, pageCount: number }>}
 */
export async function performOcrOnFile(file, onProgress = () => {}) {
  const fileType = file.type;
  let imageSource = file;
  let thumbnail = '';
  let pageCount = 1;
  let digitalPdfText = '';

  // Handle PDF files
  if (fileType === 'application/pdf') {
    onProgress({ status: 'Lendo estrutura do PDF...', progress: 10 });
    const pdfData = await processPdfFile(file);
    thumbnail = pdfData.thumbnail;
    pageCount = pdfData.pageCount;
    digitalPdfText = pdfData.extractedText;

    // If PDF contains sufficient digital text (> 100 chars), use digital text directly + run OCR for fallback
    if (digitalPdfText.length > 100) {
      onProgress({ status: 'Texto digital extraído com sucesso!', progress: 100 });
      return {
        ocrText: digitalPdfText,
        thumbnail,
        pageCount
      };
    }

    // Otherwise, PDF is likely scanned. Convert 1st page to image for OCR
    onProgress({ status: 'Documento escaneado detectado. Convertendo página para OCR...', progress: 25 });
    imageSource = await convertPdfPageToImage(file, 1);
  } else {
    // Standard Image file: Create thumbnail base64
    thumbnail = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  // Run Tesseract OCR on the image
  onProgress({ status: 'Inicializando motor OCR (Tesseract.js)...', progress: 40 });
  const worker = await createWorker('por+eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        const p = 40 + Math.round(m.progress * 55);
        onProgress({ status: `Reconhecendo texto OCR: ${Math.round(m.progress * 100)}%`, progress: p });
      }
    }
  });

  onProgress({ status: 'Executando leitura de caracteres (OCR)...', progress: 50 });
  const { data } = await worker.recognize(imageSource);
  await worker.terminate();

  onProgress({ status: 'Concluído!', progress: 100 });

  // Combine digital PDF text (if any) with OCR text
  const combinedText = [digitalPdfText, data.text].filter(Boolean).join('\n\n--- Texto OCR ---\n\n');

  return {
    ocrText: combinedText.trim() || data.text,
    thumbnail,
    pageCount
  };
}

/**
 * Intelligent helper to extract date, total amount, and key values from OCR text.
 * @param {string} text 
 * @returns {{ date: string, amount: string, title: string }}
 */
export function extractSmartMetadataFromOcr(text) {
  if (!text) return { date: '', amount: '', title: '' };

  // 1. Extract Date (DD/MM/YYYY or YYYY-MM-DD)
  const dateRegex = /(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})|(\d{4}[\/\.-]\d{2}[\/\.-]\d{2})/;
  const dateMatch = text.match(dateRegex);
  let date = '';
  if (dateMatch) {
    const rawDate = dateMatch[0].replace(/\./g, '/').replace(/-/g, '/');
    const parts = rawDate.split('/');
    if (parts[0].length === 4) {
      date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  // 2. Extract Currency Amount (R$ X.XXX,XX or Total X,XX)
  const amountRegex = /(?:R\$\s*|Total\s*:?\s*R\$\s*|VALOR\s*:?\s*R\$\s*)([\d\.\,]+)/i;
  const amountMatch = text.match(amountRegex);
  const amount = amountMatch ? `R$ ${amountMatch[1]}` : '';

  // 3. Extract Title suggestion (First non-empty meaningful line)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && !l.startsWith('---'));
  const title = lines[0] ? lines[0].substring(0, 60) : '';

  return { date, amount, title };
}
