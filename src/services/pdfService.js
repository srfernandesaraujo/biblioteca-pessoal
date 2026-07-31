import * as pdfjsLib from 'pdfjs-dist';

// Define PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Renders the first page of a PDF file to a Data URL (base64 image) for thumbnails & covers.
 * @param {File | Blob} file 
 * @returns {Promise<{ thumbnail: string, pageCount: number, extractedText: string }>}
 */
export async function processPdfFile(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    // 1. Render First Page to Canvas for Thumbnail
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.2 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    const thumbnail = canvas.toDataURL('image/jpeg', 0.85);

    // 2. Extract embedded text across all pages
    let extractedText = '';
    const maxPagesToExtract = Math.min(pageCount, 15); // Extract first 15 pages for speed
    for (let i = 1; i <= maxPagesToExtract; i++) {
      const p = await pdfDoc.getPage(i);
      const textContent = await p.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      extractedText += `\n--- Página ${i} ---\n` + pageText;
    }

    return {
      thumbnail,
      pageCount,
      extractedText: extractedText.trim()
    };
  } catch (err) {
    console.error('Erro ao processar PDF:', err);
    throw err;
  }
}

/**
 * Converts a PDF page to an Image Blob for OCR processing with Tesseract.js if needed.
 * @param {File | Blob} file 
 * @param {number} pageNum 
 * @returns {Promise<Blob>}
 */
export async function convertPdfPageToImage(file, pageNum = 1) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNum);
  
  const viewport = page.getViewport({ scale: 2.0 }); // higher resolution for OCR
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({ canvasContext: context, viewport }).promise;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}
