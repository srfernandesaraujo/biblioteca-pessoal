import React, { useState } from 'react';
import { X, Upload, BookOpen, CheckCircle2, Loader2, Sparkles, Plus, Cloud, ExternalLink, HelpCircle, Key } from 'lucide-react';
import { processPdfFile } from '../../services/pdfService';
import { extractDriveFileId, fetchDriveFileBlob, openGoogleDriveWeb, getDriveThumbnailUrl, requestGoogleDriveTokenAndPicker, getStoredDriveApiKey, saveDriveApiKey } from '../../services/googleDriveService';
import { db } from '../../db/database';

export function BookUploadModal({
  isOpen,
  onClose,
  categories = [],
  onBookAdded
}) {
  const [uploadSource, setUploadSource] = useState('local'); // 'local' | 'drive'
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [driveApiKey, setDriveApiKey] = useState(getStoredDriveApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(!getStoredDriveApiKey());

  const [file, setFile] = useState(null);
  const [driveFileId, setDriveFileId] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genreId, setGenreId] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [readStatus, setReadStatus] = useState('unread'); // 'unread' | 'reading' | 'read'
  const [rating, setRating] = useState(0);

  // Inline Genre Creation State
  const [isAddingGenre, setIsAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreColor, setNewGenreColor] = useState('#2563eb');

  const handleInlineCreateGenre = async () => {
    if (!newGenreName.trim()) return;
    const newId = await db.categories.add({
      name: newGenreName.trim(),
      type: 'book',
      color: newGenreColor
    });
    setGenreId(String(newId));
    setNewGenreName('');
    setIsAddingGenre(false);
  };

  if (!isOpen) return null;

  const processBookFile = async (blobFile, fileName, fileDriveId = '') => {
    setFile(blobFile);
    setTitle(fileName.replace(/\.[^/.]+$/, ""));
    setIsExtracting(true);

    try {
      // Extract 1st page cover canvas & total pages
      const result = await processPdfFile(blobFile);
      if (result.thumbnail) setCoverImage(result.thumbnail);
      setPageCount(result.pageCount);

    } catch (err) {
      console.warn('Erro ao extrair capa automática:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    await processBookFile(selectedFile, selectedFile.name);
  };

  const handleSaveApiKey = () => {
    saveDriveApiKey(driveApiKey);
    setShowApiKeyInput(false);
    alert('✓ Google Drive API Key salva com sucesso!');
  };

  const handleOpenPicker = () => {
    if (!driveApiKey.trim()) {
      setShowApiKeyInput(true);
      alert('Por favor insira sua Google Drive API Key para abrir o modal.');
      return;
    }

    saveDriveApiKey(driveApiKey);
    requestGoogleDriveTokenAndPicker({
      apiKey: driveApiKey.trim(),
      onFilePicked: async (pickedFile) => {
        setDriveUrlInput(pickedFile.url);
        setDriveFileId(pickedFile.id);
        setTitle(pickedFile.name.replace(/\.[^/.]+$/, ""));
        const thumb = getDriveThumbnailUrl(pickedFile.id);
        if (thumb) setCoverImage(thumb);

        setIsExtracting(true);
        try {
          const blob = await fetchDriveFileBlob(pickedFile.id);
          const namedFile = new File([blob], pickedFile.name, { type: blob.type || 'application/pdf' });
          await processBookFile(namedFile, pickedFile.name, pickedFile.id);
        } catch (err) {
          alert(err.message);
          setIsExtracting(false);
        }
      },
      onError: (err) => {
        alert(err);
      }
    });
  };

  const handleFetchFromDrive = async () => {
    const extractedId = extractDriveFileId(driveUrlInput);
    if (!extractedId) {
      alert('Por favor insira um link ou ID válido do Google Drive.');
      return;
    }
    setDriveFileId(extractedId);
    setCoverImage(getDriveThumbnailUrl(extractedId));
    setIsExtracting(true);

    try {
      const blob = await fetchDriveFileBlob(extractedId);
      const namedFile = new File([blob], `google_drive_book_${extractedId}.pdf`, { type: blob.type || 'application/pdf' });
      await processBookFile(namedFile, `Livro Google Drive`, extractedId);
    } catch (err) {
      alert(err.message);
      setIsExtracting(false);
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor informe o título do livro.');
      return;
    }

    const cleanDriveId = driveFileId || extractDriveFileId(driveUrlInput);
    const finalCover = coverImage || (cleanDriveId ? getDriveThumbnailUrl(cleanDriveId) : '');

    const newBook = {
      title: title.trim(),
      author: author.trim() || 'Autor Desconhecido',
      genreId: genreId ? parseInt(genreId) : null,
      description: description.trim(),
      coverImage: finalCover,
      pageCount,
      lastReadPage: 1,
      readStatus,
      rating,
      addedDate: new Date().toISOString(),
      fileName: file ? file.name : 'google_drive_book.pdf',
      fileBlob: file,
      fileType: file ? file.type : 'application/pdf',
      fileSize: file ? file.size : 0,
      driveFileId: cleanDriveId,
      driveLink: driveUrlInput.trim(),
      source: cleanDriveId ? 'google_drive' : 'local'
    };

    await db.books.add(newBook);
    onBookAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Cadastrar Novo Livro na Estante</h3>
              <p className="text-xs text-slate-300">Upload de PDF ou Modal do Google Drive com capa automática</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
          <button
            type="button"
            onClick={() => setUploadSource('local')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              uploadSource === 'local' ? 'bg-white text-teal-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload do Computador</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadSource('drive')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              uploadSource === 'drive' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-cyan-200" />
            <span>☁️ Selecionar do Google Drive</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Source 1: Local PDF Upload */}
          {uploadSource === 'local' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Arquivo do Livro em PDF</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/30">
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  className="hidden" 
                  id="bookFileInput"
                />
                <label htmlFor="bookFileInput" className="cursor-pointer block space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <span className="text-xs font-semibold text-slate-700 block">
                    {file ? file.name : 'Clique para selecionar o livro em PDF'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">A 1ª página será convertida em capa 3D automaticamente</span>
                </label>
              </div>
            </div>
          )}

          {/* Source 2: Google Drive Modal Picker & Key Config */}
          {uploadSource === 'drive' && (
            <div className="space-y-4 bg-blue-50/80 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-blue-600" /> Google Drive Picker Native Modal
                </label>
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{showApiKeyInput ? 'Ocultar Key' : 'Configurar API Key'}</span>
                </button>
              </div>

              {/* API Key Input Collapsible Box */}
              {showApiKeyInput && (
                <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    Sua Google Drive API Key:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={driveApiKey}
                      onChange={(e) => setDriveApiKey(e.target.value)}
                      placeholder="Cole sua API Key aqui (ex: AIzaSy...)"
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-xs font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                    >
                      Salvar Key
                    </button>
                  </div>
                </div>
              )}

              {/* Main Action Button to Trigger Google Picker Modal */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="w-full sm:w-auto flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Cloud className="w-4 h-4 text-cyan-200" />
                  <span>Abrir Modal do Google Drive ☁️</span>
                </button>

                <button
                  type="button"
                  onClick={openGoogleDriveWeb}
                  className="w-full sm:w-auto px-3 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Web ↗</span>
                </button>
              </div>

              {/* Manual Link Input Fallback */}
              <div className="pt-2 border-t border-blue-200/60 flex gap-2">
                <input
                  type="url"
                  value={driveUrlInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDriveUrlInput(val);
                    const id = extractDriveFileId(val);
                    if (id) {
                      setDriveFileId(id);
                      setCoverImage(getDriveThumbnailUrl(id));
                    }
                  }}
                  placeholder="Ou cole o link do Google Drive aqui..."
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleFetchFromDrive}
                  disabled={!driveUrlInput.trim() || isExtracting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Carregar Capa</span>
                </button>
              </div>
            </div>
          )}

          {/* Extracting Loader */}
          {isExtracting && (
            <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 flex items-center gap-2 text-xs font-bold text-teal-800">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Gerando capa 3D e contando páginas...</span>
            </div>
          )}

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Título do Livro</label>
              <input 
                type="text" 
                required
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Clean Code"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Autor</label>
              <input 
                type="text" 
                value={author} 
                onChange={(e) => setAuthor(e.target.value)} 
                placeholder="Ex: Robert C. Martin"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Genre Dropdown & Inline Creation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-600">Gênero / Categoria</label>
              <button
                type="button"
                onClick={() => setIsAddingGenre(!isAddingGenre)}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Novo Gênero</span>
              </button>
            </div>

            {isAddingGenre ? (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="text"
                  placeholder="Nome do gênero"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
                <input
                  type="color"
                  value={newGenreColor}
                  onChange={(e) => setNewGenreColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <button
                  type="button"
                  onClick={handleInlineCreateGenre}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <select 
                value={genreId} 
                onChange={(e) => setGenreId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Sem gênero</option>
                {categories.filter(c => c.type === 'book').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Cover Preview & Custom Image Upload */}
          <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            {coverImage ? (
              <img src={coverImage} alt="Capa" className="w-16 h-22 object-cover rounded shadow-md border border-slate-300 flex-shrink-0" />
            ) : (
              <div className="w-16 h-22 bg-slate-200 rounded flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                Sem capa
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Capa do Livro</label>
              <p className="text-[11px] text-slate-500">Capa gerada automaticamente da 1ª página. Você também pode enviar uma imagem personalizada:</p>
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="text-xs text-slate-600" />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!title.trim() || isExtracting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar na Estante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
