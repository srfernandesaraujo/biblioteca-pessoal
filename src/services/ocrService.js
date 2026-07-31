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

  // 1. Check Explicit Keyword Date Patterns (Order of priority)
  const keywordPatterns = [
    /(?:data\s*(?:de\s*emiss[ãa]o|da\s*emiss[ãa]o|do\s*pagamento|da\s*operac[ãa]o|da\s*transac[ãa]o|da\s*transfer[êe]ncia|do\s*comprovante|do\s*evento|de\s*vencimento)?|emiss[ãa]o|emitido\s*em|data\/hora|data)\s*:?\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4}|\d{4}[\/\.-]\d{2}[\/\.-]\d{2})/i,
    /(?:comprovante\s*de\s*[\w\s]+\s*de)\s*(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/i
  ];

  for (const pattern of keywordPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsed = parseRawDateString(match[1]);
      if (parsed) {
        extractedDate = parsed;
        break;
      }
    }
  }

  // 2. Check Text Month Names (e.g. "15 de maio de 2025" or "10 de Março de 2024")
  if (!extractedDate) {
    const monthMap = {
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

    const writtenRegex = /(\d{1,2})\s+(?:de\s+)?([a-zç]+)\s+(?:de\s+)?(\d{4})/gi;
    let writtenMatch;
    while ((writtenMatch = writtenRegex.exec(text)) !== null) {
      const day = writtenMatch[1].padStart(2, '0');
      const monthRaw = writtenMatch[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const year = writtenMatch[3];
      if (monthMap[monthRaw]) {
        extractedDate = `${year}-${monthMap[monthRaw]}-${day}`;
        break;
      }
    }
  }

  // 3. Fallback: Find all dates matching DD/MM/YYYY or YYYY-MM-DD in text
  if (!extractedDate) {
    const allDatesRegex = /(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})|(\d{4}[\/\.-]\d{2}[\/\.-]\d{2})/g;
    const matches = text.match(allDatesRegex) || [];
    const validDates = matches.map(m => parseRawDateString(m)).filter(Boolean);

    const todayYmd = new Date().toISOString().split('T')[0];
    
    // Prefer dates that are NOT today's date (if document has original date)
    const historicalDates = validDates.filter(d => d !== todayYmd);
    if (historicalDates.length > 0) {
      extractedDate = historicalDates[0];
    } else if (validDates.length > 0) {
      extractedDate = validDates[0];
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
 * Helper to normalize raw date string (DD/MM/YYYY or YYYY/MM/DD) to YYYY-MM-DD for HTML date inputs.
 */
function parseRawDateString(raw) {
  if (!raw) return '';
  const clean = raw.replace(/\./g, '/').replace(/-/g, '/').trim();
  const parts = clean.split('/');
  if (parts.length !== 3) return '';

  let year = '';
  let month = '';
  let day = '';

  if (parts[0].length === 4) {
    // Format YYYY/MM/DD
    year = parts[0];
    month = parts[1].padStart(2, '0');
    day = parts[2].padStart(2, '0');
  } else if (parts[2].length === 4) {
    // Format DD/MM/YYYY
    day = parts[0].padStart(2, '0');
    month = parts[1].padStart(2, '0');
    year = parts[2];
  } else {
    return '';
  }

  const yNum = parseInt(year, 10);
  const mNum = parseInt(month, 10);
  const dNum = parseInt(day, 10);

  if (yNum >= 1900 && yNum <= 2100 && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
    return `${year}-${month}-${day}`;
  }

  return '';
}
