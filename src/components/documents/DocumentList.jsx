import React from 'react';
import { DocumentCard } from './DocumentCard';
import { FileText, Filter, RotateCcw, Plus, Download, Eye, FileCode, Trash2, Pencil } from 'lucide-react';

export function DocumentList({
  documents = [],
  categories = [],
  tags = [],
  correspondents = [],
  documentTypes = [],
  viewMode = 'grid',
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  selectedCorrespondent,
  setSelectedCorrespondent,
  selectedDocType,
  setSelectedDocType,
  searchQuery,
  onViewPdf,
  onViewOcr,
  onDownload,
  onEditDoc,
  onDelete,
  onOpenUploadDoc
}) {
  const categoriesMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const tagsMap = Object.fromEntries(tags.map(t => [t.id, t]));
  const correspondentsMap = Object.fromEntries(correspondents.map(c => [c.id, c]));
  const docTypesMap = Object.fromEntries(documentTypes.map(d => [d.id, d]));

  const hasActiveFilters = selectedCategory !== null || selectedTag !== null || selectedCorrespondent !== null || selectedDocType !== null || searchQuery !== '';

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSelectedCorrespondent(null);
    setSelectedDocType(null);
  };

  return (
    <div className="space-y-6">
      {/* Paperless Top Filter Bar (Estilo Paperless-ngx Imagem 1) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Categoria Selector Filter */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">📁 Todas as Categorias</option>
            {categories.filter(c => c.type === 'document').map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tags Selector Filter */}
          <select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">🏷️ Todas as Tags</option>
            {tags.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Emissor / Correspondent Filter */}
          <select
            value={selectedCorrespondent || ''}
            onChange={(e) => setSelectedCorrespondent(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">👤 Todos os Emissores</option>
            {correspondents.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tipo de Documento Filter */}
          <select
            value={selectedDocType || ''}
            onChange={(e) => setSelectedDocType(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">📄 Todos os Tipos</option>
            {documentTypes.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-rose-600 font-semibold hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Nenhum documento encontrado</h3>
            <p className="text-slate-500 text-sm max-w-md mt-1">
              {hasActiveFilters
                ? 'Nenhum documento corresponde aos filtros aplicados. Tente limpar os filtros ou mudar os termos da busca.'
                : 'Você ainda não cadastrou nenhum documento na sua biblioteca. Adicione notas fiscais, recibos, contratos ou registros!'}
            </p>
          </div>
          <button
            onClick={onOpenUploadDoc}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-md shadow-emerald-900/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Documento</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              category={categoriesMap[doc.categoryId]}
              tagsMap={tagsMap}
              correspondent={correspondentsMap[doc.correspondentId]}
              docType={docTypesMap[doc.docTypeId]}
              onViewPdf={onViewPdf}
              onViewOcr={onViewOcr}
              onDownload={onDownload}
              onEditDoc={onEditDoc}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* Table View (Visão em Tabela) */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Documento</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Emissor</th>
                  <th className="p-3.5">Tags</th>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const category = categoriesMap[doc.categoryId];
                  const correspondent = correspondentsMap[doc.correspondentId];
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-medium text-slate-800">
                        <div className="flex items-center gap-2.5">
                          {doc.thumbnail ? (
                            <img src={doc.thumbnail} alt="" className="w-8 h-10 object-cover rounded border border-slate-200" />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-400" />
                          )}
                          <span 
                            onClick={() => onViewPdf(doc)}
                            className="font-bold text-slate-800 hover:text-emerald-600 cursor-pointer truncate max-w-xs"
                          >
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {category && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: category.color }}>
                            {category.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-700">{correspondent?.name || '-'}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {doc.tags && doc.tags.map(tId => {
                            const t = tagsMap[tId];
                            if (!t) return null;
                            return (
                              <span key={tId} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white" style={{ backgroundColor: t.color }}>
                                {t.name}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500">{doc.createdDate || new Date(doc.addedDate).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3.5 text-right space-x-1">
                        <button onClick={() => onViewOcr(doc)} title="Ver OCR" className="p-1.5 text-slate-500 hover:text-emerald-600">
                          <FileCode className="w-4 h-4" />
                        </button>
                        <button onClick={() => onViewPdf(doc)} title="Ver PDF" className="p-1.5 text-slate-500 hover:text-emerald-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEditDoc(doc)} title="Editar Documento" className="p-1.5 text-slate-500 hover:text-amber-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDownload(doc)} title="Baixar PDF" className="p-1.5 text-slate-500 hover:text-blue-600">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(doc.id)} title="Excluir" className="p-1.5 text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
