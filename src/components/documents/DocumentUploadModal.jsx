import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Loader2, Sparkles, Tag, Plus, Zap, Cloud, ExternalLink } from 'lucide-react';
import { performOcrOnFile, extractSmartMetadataFromOcr } from '../../services/ocrService';
import { runAutomationRules } from '../../services/automationService';
import { extractDriveFileId, fetchDriveFileBlob, openGoogleDrivePicker, getDriveThumbnailUrl } from '../../services/googleDriveService';
import { db } from '../../db/database';

export function DocumentUploadModal({
  isOpen,
  onClose,
  categories = [],
  tags = [],
  correspondents = [],
  documentTypes = [],
  onDocumentAdded
}) {
  const [uploadSource, setUploadSource] = useState('local'); // 'local' | 'drive'
  const [driveUrlInput, setDriveUrlInput] = useState('');
  
  const [file, setFile] = useState(null);
  const [driveFileId, setDriveFileId] = useState('');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [docTypeId, setDocTypeId] = useState('');
  const [correspondentId, setCorrespondentId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [ocrText, setOcrText] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [createdDate, setCreatedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appliedRules, setAppliedRules] = useState([]);

  // Inline Category Creation State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  const handleInlineCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const newId = await db.categories.add({
      name: newCatName.trim(),
      type: 'document',
      color: newCatColor
    });
    setCategoryId(String(newId));
    setNewCatName('');
    setIsAddingCategory(false);
  };

  if (!isOpen) return null;

  const processBlobFile = async (blobFile, fileName, fileDriveId = '') => {
    setFile(blobFile);
    setTitle(fileName.replace(/\.[^/.]+$/, ""));
    setIsProcessingOcr(true);
    setOcrProgress(10);
    setOcrStatusText('Iniciando OCR...');

    try {
      const result = await performOcrOnFile(blobFile, ({ status, progress }) => {
        setOcrStatusText(status);
        setOcrProgress(progress);
      });

      setOcrText(result.ocrText);
      setThumbnail(result.thumbnail);
      setPageCount(result.pageCount);

      // Extract smart metadata
      const meta = extractSmartMetadataFromOcr(result.ocrText);
      if (meta.title && meta.title.length > 5) {
        setTitle(meta.title);
      }
      if (meta.date) {
        setCreatedDate(meta.date);
      }

      // Run Automation Rules
      const autoResult = await runAutomationRules(result.ocrText, fileName, {
        categories,
        correspondents,
        documentTypes,
        tags
      });

      if (autoResult.categoryId) setCategoryId(String(autoResult.categoryId));
      if (autoResult.correspondentId) setCorrespondentId(String(autoResult.correspondentId));
      if (autoResult.docTypeId) setDocTypeId(String(autoResult.docTypeId));
      if (autoResult.tagIds && autoResult.tagIds.length > 0) {
        setSelectedTagIds(prev => Array.from(new Set([...prev, ...autoResult.tagIds])));
      }
      if (autoResult.matchedRules && autoResult.matchedRules.length > 0) {
        setAppliedRules(autoResult.matchedRules);
      }

    } catch (err) {
      console.error(err);
      alert('Erro ao realizar OCR do arquivo: ' + err.message);
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    await processBlobFile(selectedFile, selectedFile.name);
  };

  const handleFetchFromDrive = async () => {
    const extractedId = extractDriveFileId(driveUrlInput);
    if (!extractedId) {
      alert('Por favor insira um link válido do Google Drive.');
      return;
    }
    setDriveFileId(extractedId);
    setIsProcessingOcr(true);
    setOcrStatusText('Baixando arquivo do Google Drive...');

    try {
      const blob = await fetchDriveFileBlob(extractedId);
      const namedFile = new File([blob], `google_drive_${extractedId}.pdf`, { type: blob.type || 'application/pdf' });
      await processBlobFile(namedFile, `Documento Google Drive (${extractedId.slice(0, 6)})`, extractedId);
    } catch (err) {
      alert(err.message);
      setIsProcessingOcr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor informe um título para o documento.');
      return;
    }

    const newDoc = {
      title: title.trim(),
      categoryId: categoryId ? parseInt(categoryId) : null,
      docTypeId: docTypeId ? parseInt(docTypeId) : null,
      correspondentId: correspondentId ? parseInt(correspondentId) : null,
      tags: selectedTagIds,
      ocrText,
      thumbnail,
      pageCount,
      createdDate,
      addedDate: new Date().toISOString(),
      fileName: file ? file.name : 'google_drive_doc.pdf',
      fileBlob: file,
      fileType: file ? file.type : 'application/pdf',
      fileSize: file ? file.size : 0,
      driveFileId: driveFileId || extractDriveFileId(driveUrlInput),
      driveLink: driveUrlInput.trim(),
      source: driveFileId ? 'google_drive' : 'local'
    };

    await db.documents.add(newDoc);
    onDocumentAdded();
    onClose();
  };

  const toggleTag = (tagId) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Cadastrar Novo Documento</h3>
              <p className="text-xs text-slate-300">Upload de PDF ou Link do Google Drive com OCR automático</p>
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
              uploadSource === 'local' ? 'bg-white text-emerald-700 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Source 1: Local File Upload */}
          {uploadSource === 'local' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Arquivo (PDF ou Imagem)</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30">
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  className="hidden" 
                  id="docFileInput"
                />
                <label htmlFor="docFileInput" className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <span className="text-xs font-semibold text-slate-700 block">
                    {file ? file.name : 'Clique para selecionar um arquivo PDF ou Imagem'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Tamanho máximo 50MB</span>
                </label>
              </div>
            </div>
          )}

          {/* Source 2: Google Drive Shareable Link & Native Picker */}
          {uploadSource === 'drive' && (
            <div className="space-y-3 bg-blue-50/80 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Arquivo do Google Drive
                </label>
                <button
                  type="button"
                  onClick={() => {
                    openGoogleDrivePicker(async (pickedFile) => {
                      setDriveUrlInput(pickedFile.url);
                      setDriveFileId(pickedFile.id);
                      setTitle(pickedFile.name.replace(/\.[^/.]+$/, ""));
                      const thumb = getDriveThumbnailUrl(pickedFile.id);
                      if (thumb) setThumbnail(thumb);
                      
                      setIsProcessingOcr(true);
                      setOcrStatusText('Carregando do Google Drive e lendo OCR...');
                      try {
                        const blob = await fetchDriveFileBlob(pickedFile.id);
                        const namedFile = new File([blob], pickedFile.name, { type: blob.type || 'application/pdf' });
                        await processBlobFile(namedFile, pickedFile.name, pickedFile.id);
                      } catch (err) {
                        alert(err.message);
                        setIsProcessingOcr(false);
                      }
                    });
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Navegar no Meu Google Drive ☁️</span>
                </button>
              </div>

              <p className="text-xs text-blue-800">
                Escolha o arquivo no seu Google Drive acima ou cole o link compartilhável abaixo:
              </p>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  value={driveUrlInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDriveUrlInput(val);
                    const id = extractDriveFileId(val);
                    if (id) {
                      setDriveFileId(id);
                      setThumbnail(getDriveThumbnailUrl(id));
                    }
                  }}
                  placeholder="https://drive.google.com/file/d/1ABC123xyz.../view?usp=sharing"
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleFetchFromDrive}
                  disabled={!driveUrlInput.trim() || isProcessingOcr}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Processar OCR</span>
                </button>
              </div>
            </div>
          )}

          {/* OCR Processing Loader Status */}
          {isProcessingOcr && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  {ocrStatusText || 'Processando OCR local...'}
                </span>
                <span>{ocrProgress}%</span>
              </div>
              <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
              </div>
            </div>
          )}

          {/* Banner for Auto-Applied Rules */}
          {appliedRules.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 shadow-2xs">
              <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold block">Regra de Automação Aplicada:</span>
                <span className="text-[11px] text-emerald-700">{appliedRules.map(r => r.name).join(', ')}</span>
              </div>
            </div>
          )}

          {/* Title & Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Título do Documento</label>
              <input 
                type="text" 
                required
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Ex: Nota Fiscal Energia Junho 2026"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Data de Emissão</label>
              <input 
                type="date" 
                value={createdDate} 
                onChange={(e) => setCreatedDate(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Category Dropdown & Inline Category Creation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-600">Categoria</label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Nova Categoria</span>
              </button>
            </div>

            {isAddingCategory ? (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="text"
                  placeholder="Nome da categoria"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <button
                  type="button"
                  onClick={handleInlineCreateCategory}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Sem categoria</option>
                {categories.filter(c => c.type === 'document').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Tags Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected ? 'ring-2 ring-emerald-500 shadow-xs' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: tag.color || '#6b7280', color: '#fff' }}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag.name}</span>
                  </button>
                );
              })}
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
              disabled={isProcessingOcr || !title.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Documento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
