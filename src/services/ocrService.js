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

  let extractedDate = '';

  // 1. Explicit Keywords: Data de Emissão, Data do Pagamento, Data: DD/MM/YYYY
  const explicitDateRegex = /(?:Data\s*(?:de\s*emiss[ãa]o|do\s*pagamento|da\s*transfer[êe]ncia|do\s*comprovante)?|Emiss[ãa]o)\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4}|\d{4}[\/\.-]\d{2}[\/\.-]\d{2})/i;
  const explicitMatch = text.match(explicitDateRegex);

  if (explicitMatch && explicitMatch[1]) {
    extractedDate = parseRawDateString(explicitMatch[1]);
  }

  // 2. Text Month Names: Ex "15 de maio de 2025" or "10/MAIO/2026"
  if (!extractedDate) {
    const monthNames = {
      jan: '01', janeiro: '01',
      fev: '02', fevereiro: '02',
      mar: '03', marco: '03', março: '03',
      abr: '04', abril: '04',
      mai: '05', maio: '05',
      jun: '06', junho: '06',
      jul: '07', julho: '07',
      ago: '08', agosto: '08',
      set: '09', setembro: '09',
      out: '10', outubro: '10',
      nov: '11', novembro: '11',
      dez: '12', dezembro: '12'
    };

    const writtenDateRegex = /(\d{1,2})\s+(?:de\s+)?([a-zç]+)\s+(?:de\s+)?(\d{4})/i;
    const writtenMatch = text.match(writtenDateRegex);
    if (writtenMatch) {
      const day = writtenMatch[1].padStart(2, '0');
      const monthKey = writtenMatch[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const year = writtenMatch[3];
      if (monthNames[monthKey]) {
        extractedDate = `${year}-${monthNames[monthKey]}-${day}`;
      }
    }
  }

  // 3. Fallback: Any valid DD/MM/YYYY or YYYY-MM-DD in text
  if (!extractedDate) {
    const generalDateRegex = /(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})|(\d{4}[\/\.-]\d{2}[\/\.-]\d{2})/;
    const generalMatch = text.match(generalDateRegex);
    if (generalMatch && generalMatch[0]) {
      extractedDate = parseRawDateString(generalMatch[0]);
    }
  }

  // 4. Extract Currency Amount (R$ X.XXX,XX or VALOR: X.XXX,XX)
  const amountRegex = /(?:R\$\s*|Total\s*:?\s*R\$\s*|VALOR\s*:?\s*R\$\s*|VALOR\s*:?\s*)([\d\.\,]{3,})/i;
  const amountMatch = text.match(amountRegex);
  const amount = amountMatch ? `R$ ${amountMatch[1]}` : '';

  // 5. Extract Title Candidate
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.includes('---'));
  const title = lines.length > 0 ? lines[0].slice(0, 80) : '';

  return {
    date: extractedDate,
    amount,
    title
  };
}

/**
 * Helper to normalize raw date string to YYYY-MM-DD format for HTML date inputs.
 */
function parseRawDateString(raw) {
  if (!raw) return '';
  const clean = raw.replace(/\./g, '/').replace(/-/g, '/').trim();
  const parts = clean.split('/');
  if (parts.length !== 3) return '';

  if (parts[0].length === 4) {
    // YYYY/MM/DD
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  } else {
    // DD/MM/YYYY
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    // Sanity check year
    if (parseInt(year) > 1900 && parseInt(year) < 2100) {
      return `${year}-${month}-${day}`;
    }
  }
  return '';
}
