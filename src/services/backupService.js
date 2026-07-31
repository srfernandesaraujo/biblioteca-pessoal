import { db } from '../db/database';

/**
 * Converts a Blob to a Base64 string.
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a Base64 string back to a Blob.
 * @param {string} base64Data 
 * @param {string} contentType 
 * @returns {Blob}
 */
function base64ToBlob(base64Data, contentType = 'application/pdf') {
  const parts = base64Data.split(';base64,');
  const mime = parts[0] ? parts[0].replace('data:', '') : contentType;
  const byteCharacters = atob(parts[1] || parts[0]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

/**
 * Exports all database contents (documents, books, categories, tags, rules) into a single JSON backup.
 * @param {function} onProgress - Progress callback ({ status, progress })
 */
export async function exportDatabaseBackup(onProgress = () => {}) {
  onProgress({ status: 'Coletando metadados...', progress: 10 });

  const categories = await db.categories.toArray();
  const tags = await db.tags.toArray();
  const correspondents = await db.correspondents.toArray();
  const documentTypes = await db.documentTypes.toArray();
  const automationRules = await db.automationRules.toArray();

  onProgress({ status: 'Processando documentos e PDFs...', progress: 30 });
  const rawDocuments = await db.documents.toArray();
  const documents = [];

  for (let i = 0; i < rawDocuments.length; i++) {
    const doc = rawDocuments[i];
    let fileBase64 = null;
    if (doc.fileBlob) {
      fileBase64 = await blobToBase64(doc.fileBlob);
    }
    documents.push({
      ...doc,
      fileBlob: fileBase64 // Store as base64 in backup JSON
    });
    onProgress({ 
      status: `Convertendo documentos (${i + 1}/${rawDocuments.length})...`, 
      progress: 30 + Math.round(((i + 1) / (rawDocuments.length || 1)) * 30) 
    });
  }

  onProgress({ status: 'Processando biblioteca de livros...', progress: 60 });
  const rawBooks = await db.books.toArray();
  const books = [];

  for (let i = 0; i < rawBooks.length; i++) {
    const book = rawBooks[i];
    let fileBase64 = null;
    if (book.fileBlob) {
      fileBase64 = await blobToBase64(book.fileBlob);
    }
    books.push({
      ...book,
      fileBlob: fileBase64
    });
    onProgress({ 
      status: `Convertendo livros (${i + 1}/${rawBooks.length})...`, 
      progress: 60 + Math.round(((i + 1) / (rawBooks.length || 1)) * 35) 
    });
  }

  const backupData = {
    version: 1,
    exportDate: new Date().toISOString(),
    categories,
    tags,
    correspondents,
    documentTypes,
    automationRules,
    documents,
    books
  };

  onProgress({ status: 'Gerando arquivo de backup final...', progress: 95 });

  const jsonString = JSON.stringify(backupData);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_biblioteca_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  onProgress({ status: 'Backup exportado com sucesso!', progress: 100 });
}

/**
 * Imports a JSON backup file and restores database content.
 * @param {File} file 
 * @param {function} onProgress - Progress callback
 */
export async function importDatabaseBackup(file, onProgress = () => {}) {
  onProgress({ status: 'Lendo arquivo de backup...', progress: 10 });
  
  const jsonText = await file.text();
  const data = JSON.parse(jsonText);

  if (!data.documents || !data.books) {
    throw new Error('Arquivo de backup inválido.');
  }

  onProgress({ status: 'Limpando dados antigos do banco...', progress: 25 });
  await db.transaction('rw', db.documents, db.books, db.categories, db.tags, db.correspondents, db.documentTypes, db.automationRules, async () => {
    await db.documents.clear();
    await db.books.clear();
    await db.categories.clear();
    await db.tags.clear();
    await db.correspondents.clear();
    await db.documentTypes.clear();
    await db.automationRules.clear();

    if (data.categories?.length) await db.categories.bulkAdd(data.categories);
    if (data.tags?.length) await db.tags.bulkAdd(data.tags);
    if (data.correspondents?.length) await db.correspondents.bulkAdd(data.correspondents);
    if (data.documentTypes?.length) await db.documentTypes.bulkAdd(data.documentTypes);
    if (data.automationRules?.length) await db.automationRules.bulkAdd(data.automationRules);
  });

  onProgress({ status: 'Restaurando documentos...', progress: 50 });
  for (let i = 0; i < data.documents.length; i++) {
    const doc = data.documents[i];
    let blob = null;
    if (doc.fileBlob && typeof doc.fileBlob === 'string') {
      blob = base64ToBlob(doc.fileBlob, doc.fileType || 'application/pdf');
    }
    await db.documents.add({
      ...doc,
      fileBlob: blob
    });
  }

  onProgress({ status: 'Restaurando livros e capas...', progress: 75 });
  for (let i = 0; i < data.books.length; i++) {
    const book = data.books[i];
    let blob = null;
    if (book.fileBlob && typeof book.fileBlob === 'string') {
      blob = base64ToBlob(book.fileBlob, book.fileType || 'application/pdf');
    }
    await db.books.add({
      ...book,
      fileBlob: blob
    });
  }

  onProgress({ status: 'Restauração concluída!', progress: 100 });
}
