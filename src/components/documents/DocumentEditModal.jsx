import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, FileText, Plus, Sparkles, Tag } from 'lucide-react';
import { db } from '../../db/database';

export function DocumentEditModal({
  isOpen,
  onClose,
  doc,
  categories = [],
  tags = [],
  correspondents = [],
  documentTypes = [],
  onDocumentUpdated,
  onRefreshCategories
}) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [docTypeId, setDocTypeId] = useState('');
  const [correspondentId, setCorrespondentId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [ocrText, setOcrText] = useState('');
  const [createdDate, setCreatedDate] = useState('');

  // Inline Category Creation State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  useEffect(() => {
    if (doc) {
      setTitle(doc.title || '');
      setCategoryId(doc.categoryId ? String(doc.categoryId) : '');
      setDocTypeId(doc.docTypeId ? String(doc.docTypeId) : '');
      setCorrespondentId(doc.correspondentId ? String(doc.correspondentId) : '');
      setSelectedTagIds(doc.tags || []);
      setOcrText(doc.ocrText || '');
      setCreatedDate(doc.createdDate || '');
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const toggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

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
    if (onRefreshCategories) onRefreshCategories();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.documents.update(doc.id, {
        title: title.trim(),
        categoryId: categoryId ? Number(categoryId) : null,
        docTypeId: docTypeId ? Number(docTypeId) : null,
        correspondentId: correspondentId ? Number(correspondentId) : null,
        tags: selectedTagIds,
        ocrText,
        createdDate,
        updatedDate: new Date().toISOString()
      });
      onDocumentUpdated();
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar documento:', err);
      alert('Erro ao atualizar as informações do documento.');
    }
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
              <h3 className="font-bold text-base">Editar Documento</h3>
              <p className="text-xs text-slate-300">Atualize metadados, categorias e texto do OCR</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Document Preview Banner */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
            {doc.thumbnail ? (
              <img src={doc.thumbnail} alt="" className="w-10 h-12 object-cover rounded border border-slate-300" />
            ) : (
              <FileText className="w-6 h-6 text-emerald-600" />
            )}
            <div className="truncate">
              <span className="font-bold text-slate-800 text-xs block truncate">{doc.fileName}</span>
              <span className="text-[11px] text-slate-500">
                Cadastrado em {new Date(doc.addedDate).toLocaleDateString('pt-BR')} • {doc.pageCount || 1} pág.
              </span>
            </div>
          </div>

          {/* Title */}
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
            />
          </div>

          {/* Category with Inline Creation Option */}
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
                <span>Criar Nova Categoria</span>
              </button>
            </div>

            {isAddingCategory ? (
              <div className="bg-emerald-50/80 p-3 rounded-lg border border-emerald-200 flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nome da nova categoria..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-emerald-300 rounded-md text-xs text-slate-800"
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
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-emerald-500"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-slate-500 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : null}

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

          {/* Grid for Correspondent, Doc Type, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Tags */}
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

          {/* OCR Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Texto Extraído pelo OCR
            </label>
            <textarea
              rows={4}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md shadow-emerald-900/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
