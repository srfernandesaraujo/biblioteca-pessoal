import React from 'react';
import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';

export function Header({
  activeTab,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  totalItems = 0
}) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
      {/* Title & Stats */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          {activeTab === 'documents' ? 'Documentos' : 'Biblioteca de Livros'}
        </h2>
        <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
          {totalItems} {activeTab === 'documents' ? 'documentos' : 'livros'}
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-xl w-full">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'documents'
                ? 'Pesquisar título, conteúdo lido no OCR, emissor ou tags...'
                : 'Pesquisar por título, autor, gênero ou editora...'
            }
            className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Controls & Options */}
      <div className="flex items-center gap-3">
        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="title_asc">Título (A-Z)</option>
            <option value="title_desc">Título (Z-A)</option>
            {activeTab === 'books' && <option value="rating_desc">Maior Avaliação</option>}
          </select>
        </div>

        {/* View Mode Toggle (For Documents) */}
        {activeTab === 'documents' && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              title="Visualização em Grade"
              className={`p-1.5 rounded-md text-slate-600 transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela"
              className={`p-1.5 rounded-md text-slate-600 transition-all ${
                viewMode === 'table' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
