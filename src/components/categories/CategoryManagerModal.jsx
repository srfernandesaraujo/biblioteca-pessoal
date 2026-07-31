import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Plus, Trash2, Tag as TagIcon, Folder, User, FileCode, Check, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { db } from '../../db/database';

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories = [],
  tags = [],
  correspondents = [],
  documentTypes = [],
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'tags' | 'correspondents' | 'docTypes' | 'rules'

  // New Category Form
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('document');
  const [catColor, setCatColor] = useState('#3b82f6');

  // New Tag Form
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#10b981');

  // New Correspondent Form
  const [corrName, setCorrName] = useState('');

  // New Doc Type Form
  const [docTypeName, setDocTypeName] = useState('');

  // New Automation Rule Form
  const [ruleName, setRuleName] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [targetCatId, setTargetCatId] = useState('');
  const [targetCorrId, setTargetCorrId] = useState('');
  const [targetTagId, setTargetTagId] = useState('');

  // Fetch automation rules reactively
  const rules = useLiveQuery(() => db.automationRules.toArray(), []) || [];

  if (!isOpen) return null;

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    await db.categories.add({
      name: catName.trim(),
      type: catType,
      color: catColor
    });
    setCatName('');
    onRefresh();
  };

  const handleDeleteCategory = async (id) => {
    await db.categories.delete(id);
    onRefresh();
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    await db.tags.add({
      name: tagName.trim(),
      color: tagColor
    });
    setTagName('');
    onRefresh();
  };

  const handleDeleteTag = async (id) => {
    await db.tags.delete(id);
    onRefresh();
  };

  const handleAddCorrespondent = async (e) => {
    e.preventDefault();
    if (!corrName.trim()) return;
    await db.correspondents.add({ name: corrName.trim() });
    setCorrName('');
    onRefresh();
  };

  const handleDeleteCorrespondent = async (id) => {
    await db.correspondents.delete(id);
    onRefresh();
  };

  const handleAddDocType = async (e) => {
    e.preventDefault();
    if (!docTypeName.trim()) return;
    await db.documentTypes.add({ name: docTypeName.trim() });
    setDocTypeName('');
    onRefresh();
  };

  const handleDeleteDocType = async (id) => {
    await db.documentTypes.delete(id);
    onRefresh();
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!ruleName.trim() || !keywordsInput.trim()) return;

    const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);
    await db.automationRules.add({
      name: ruleName.trim(),
      keywords,
      matchType: 'any',
      assignCategory: targetCatId ? Number(targetCatId) : null,
      assignCorrespondent: targetCorrId ? Number(targetCorrId) : null,
      assignDocType: null,
      assignTags: targetTagId ? [Number(targetTagId)] : [],
      enabled: true
    });

    setRuleName('');
    setKeywordsInput('');
    setTargetCatId('');
    setTargetCorrId('');
    setTargetTagId('');
  };

  const handleToggleRule = async (id, currentStatus) => {
    await db.automationRules.update(id, { enabled: !currentStatus });
  };

  const handleDeleteRule = async (id) => {
    await db.automationRules.delete(id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-base">Gerenciador do Sistema & Automação</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 text-xs font-bold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'categories' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Categorias
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`pb-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tags' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Tags
          </button>
          <button
            onClick={() => setActiveTab('correspondents')}
            className={`pb-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'correspondents' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Emissores
          </button>
          <button
            onClick={() => setActiveTab('docTypes')}
            className={`pb-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'docTypes' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Tipos de Doc.
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rules' ? 'border-amber-500 text-amber-700 font-extrabold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Regras de Automação</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCategory} className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder="Nome da categoria..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <select
                  value={catType}
                  onChange={(e) => setCatType(e.target.value)}
                  className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="document">Para Docs</option>
                  <option value="book">Para Livros</option>
                </select>
                <input
                  type="color"
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <button type="submit" className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-500">
                  Adicionar
                </button>
              </form>

              <div className="space-y-1.5">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-slate-800">{cat.name}</span>
                      <span className="text-[10px] text-slate-400">({cat.type === 'document' ? 'Documento' : 'Livro'})</span>
                    </div>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <form onSubmit={handleAddTag} className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder="Nome da tag..."
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <button type="submit" className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-500">
                  Adicionar
                </button>
              </form>

              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <div key={t.id} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-white" style={{ backgroundColor: t.color }}>
                    <span>{t.name}</span>
                    <button onClick={() => handleDeleteTag(t.id)} className="hover:opacity-80 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correspondents Tab */}
          {activeTab === 'correspondents' && (
            <div className="space-y-4">
              <form onSubmit={handleAddCorrespondent} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome do emissor / correspondente..."
                  value={corrName}
                  onChange={(e) => setCorrName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <button type="submit" className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-500">
                  Adicionar
                </button>
              </form>

              <div className="space-y-1.5">
                {correspondents.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <button onClick={() => handleDeleteCorrespondent(c.id)} className="text-slate-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Types Tab */}
          {activeTab === 'docTypes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddDocType} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome do tipo de documento..."
                  value={docTypeName}
                  onChange={(e) => setDocTypeName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <button type="submit" className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-500">
                  Adicionar
                </button>
              </form>

              <div className="space-y-1.5">
                {documentTypes.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-800">{d.name}</span>
                    <button onClick={() => handleDeleteDocType(d.id)} className="text-slate-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automation Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Regras de Auto-Tagging e Classificação por OCR</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Quando um documento é escaneado no OCR, o sistema verifica as palavras-chave e atribui automaticamente a categoria, emissor e tags configurados!
                  </p>
                </div>
              </div>

              {/* Form to Add New Rule */}
              <form onSubmit={handleAddRule} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Criar Nova Regra de Automação</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nome da Regra</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Auto-classificar Faturas Nubank"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Palavras-chave no OCR (separadas por vírgula)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Nubank, Cartão, Fatura"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Atribuir Categoria</label>
                    <select
                      value={targetCatId}
                      onChange={(e) => setTargetCatId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Nenhuma</option>
                      {categories.filter(c => c.type === 'document').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Atribuir Emissor</label>
                    <select
                      value={targetCorrId}
                      onChange={(e) => setTargetCorrId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Nenhum</option>
                      {correspondents.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Atribuir Tag</label>
                    <select
                      value={targetTagId}
                      onChange={(e) => setTargetTagId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">Nenhuma</option>
                      {tags.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Regra de Automação</span>
                </button>
              </form>

              {/* Rules List */}
              <div className="space-y-2">
                {rules.map(rule => {
                  const targetCat = categories.find(c => c.id === rule.assignCategory);
                  const targetCorr = correspondents.find(c => c.id === rule.assignCorrespondent);
                  return (
                    <div
                      key={rule.id}
                      className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                        rule.enabled ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleRule(rule.id, rule.enabled)}
                            className="text-slate-700 hover:text-amber-600 transition-colors"
                            title={rule.enabled ? 'Desativar regra' : 'Ativar regra'}
                          >
                            {rule.enabled ? (
                              <ToggleRight className="w-6 h-6 text-amber-600" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-400" />
                            )}
                          </button>
                          <span className="font-bold text-slate-800">{rule.name}</span>
                        </div>

                        <button onClick={() => handleDeleteRule(rule.id)} className="text-slate-400 hover:text-rose-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Keywords Badges */}
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] font-semibold text-slate-400">Gatilhos:</span>
                        {rule.keywords?.map((kw, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-200">
                            "{kw}"
                          </span>
                        ))}
                      </div>

                      {/* Applied Actions */}
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        {targetCat && (
                          <span className="font-medium text-emerald-700">➜ Categoria: <b>{targetCat.name}</b></span>
                        )}
                        {targetCorr && (
                          <span className="font-medium text-blue-700">➜ Emissor: <b>{targetCorr.name}</b></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
