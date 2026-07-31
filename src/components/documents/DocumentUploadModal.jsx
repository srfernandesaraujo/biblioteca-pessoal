import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Loader2, Sparkles, Tag, Plus, Zap } from 'lucide-react';
import { performOcrOnFile, extractSmartMetadataFromOcr } from '../../services/ocrService';
import { runAutomationRules } from '../../services/automationService';
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
  const [file, setFile] = useState(null);
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

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    setIsProcessingOcr(true);
    setOcrProgress(10);
    setOcrStatusText('Iniciando processamento...');

    try {
      const result = await performOcrOnFile(selectedFile, ({ status, progress }) => {
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
      const autoResult = await runAutomationRules(result.ocrText, selectedFile.name, {
        categoryId,
        correspondentId,
        docTypeId,
        tags: selectedTagIds
      });

      if (autoResult.categoryId) setCategoryId(String(autoResult.categoryId));
      if (autoResult.correspondentId) setCorrespondentId(String(autoResult.correspondentId));
      if (autoResult.docTypeId) setDocTypeId(String(autoResult.docTypeId));
      if (autoResult.tags && autoResult.tags.length > 0) setSelectedTagIds(autoResult.tags);
      setAppliedRules(autoResult.matchedRules || []);
    } catch (err) {
      console.error('Erro no OCR:', err);
      alert('Não foi possível concluir o OCR automaticamente. Você ainda pode salvar o documento manualmente.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const toggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Por favor, selecione um arquivo de documento.');
      return;
    }

    try {
      const docData = {
        title: title || file.name,
        categoryId: categoryId ? Number(categoryId) : (categories.find(c => c.type === 'document')?.id || null),
        docTypeId: docTypeId ? Number(docTypeId) : null,
        correspondentId: correspondentId ? Number(correspondentId) : null,
        tags: selectedTagIds,
        ocrText,
        fileBlob: file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        thumbnail,
        pageCount,
        createdDate,
        addedDate: new Date().toISOString()
      };

      await db.documents.add(docData);
      onDocumentAdded();
      handleClose();
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
      alert('Erro ao salvar no banco de dados local.');
    }
  };

  const handleClose = () => {
    setFile(null);
    setOcrText('');
    setThumbnail('');
    setTitle('');
    setSelectedTagIds([]);
    setIsProcessingOcr(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Cadastrar Novo Documento</h3>
              <p className="text-xs text-slate-300">Com Leitura de OCR Local e Metadados</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Upload Zone */}
          {!file ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 text-center transition-colors bg-slate-50 hover:bg-emerald-50/30 cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Clique ou arraste um PDF ou Imagem para cadastrar</p>
                  <p className="text-xs text-slate-500 mt-1">Notas fiscais, recibos, contratos ou certificados (PDF, PNG, JPG)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 truncate">
                {thumbnail ? (
                  <img src={thumbnail} alt="" className="w-12 h-14 object-cover rounded border border-slate-300" />
                ) : (
                  <FileText className="w-8 h-8 text-emerald-600" />
                )}
                <div className="truncate">
                  <p className="font-bold text-slate-800 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • {pageCount} página(s)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-rose-600 font-semibold hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
              >
                Trocar arquivo
              </button>
            </div>
          )}

          {/* OCR Progress Indicator */}
          {isProcessingOcr && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>{ocrStatusText}</span>
                </div>
                <span>{ocrProgress}%</span>
              </div>
              <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
              </div>
            </div>
          )}

          {/* Applied Automation Rules Banner */}
          {!isProcessingOcr && appliedRules.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900 shadow-xs">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">⚡ Automação Aplicada:</span>
                <span className="ml-1">
                  O sistema identificou palavras-chave do OCR e aplicou automaticamente a(s) regra(s): <strong>{appliedRules.join(', ')}</strong>
                </span>
              </div>
            </div>
          )}

          {file && !isProcessingOcr && (
            <>
              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título do Documento
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Nota Fiscal Energia Junho 2026"
                />
              </div>

              {/* Grid of Category, Doc Type, Correspondent, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Categoria
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(!isAddingCategory)}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Categoria</span>
                    </button>
                  </div>

                  {isAddingCategory && (
                    <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Nome da categoria..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-md text-xs text-slate-800"
                      />
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-7 h-7 rounded border border-emerald-300 p-0.5 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleInlineCreateCategory}
                        className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-emerald-500"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="text-slate-500 hover:text-slate-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">Selecione uma Categoria</option>
                    {categories.filter(c => c.type === 'document').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Emissor / Correspondente
                  </label>
                  <select
                    value={correspondentId}
                    onChange={(e) => setCorrespondentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">Selecione o Emissor</option>
                    {correspondents.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={docTypeId}
                    onChange={(e) => setDocTypeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">Selecione o Tipo</option>
                    {documentTypes.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Data do Documento
                  </label>
                  <input
                    type="date"
                    value={createdDate}
                    onChange={(e) => setCreatedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tags Multi-select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => {
                    const isSelected = selectedTagIds.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTag(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isSelected ? 'ring-2 ring-slate-900 shadow-xs' : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: t.color, color: '#fff' }}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OCR Extracted Text Preview */}
              {ocrText && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Texto Extraído pelo OCR</span>
                  </div>
                  <textarea
                    rows={4}
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </>
          )}

          {/* Form Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || isProcessingOcr}
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg shadow-md shadow-emerald-900/20 transition-all flex items-center gap-2"
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
