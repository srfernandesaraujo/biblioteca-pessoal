import React from 'react';
import { 
  FileText, 
  BookOpen, 
  Folder, 
  Tag, 
  User, 
  Plus, 
  Library, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Layers,
  Database,
  BarChart3,
  Bot,
  Sparkles,
  Cloud
} from 'lucide-react';

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  docCount = 0, 
  bookCount = 0,
  categories = [],
  tags = [],
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
  onOpenUploadDoc,
  onOpenUploadBook,
  onOpenCategoryManager,
  onOpenBackup,
  onOpenDriveSync
}) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
          <Library className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-base leading-tight">Biblioteca Pessoal</h1>
          <p className="text-xs text-slate-400">Documentos & Livros Local</p>
        </div>
      </div>

      {/* Main Module Selector */}
      <div className="p-3 space-y-1 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-4 h-4 text-blue-300" />
            <span>Dashboard / Estatísticas</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'chat'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-purple-300" />
            <span>Assistente IA (Chat)</span>
          </div>
          <span className="bg-purple-500/30 text-purple-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-purple-400/30">
            IA
          </span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'documents'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4" />
            <span>Documentos (Paperless)</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'documents' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
          }`}>
            {docCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('books')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === 'books'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40'
              : 'hover:bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4" />
            <span>Estante de Livros</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'books' ? 'bg-teal-700 text-teal-100' : 'bg-slate-800 text-slate-400'
          }`}>
            {bookCount}
          </span>
        </button>
      </div>

      {/* Quick Action Upload Buttons */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <button
          onClick={onOpenUploadDoc}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs transition-colors border border-emerald-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Documento</span>
        </button>

        <button
          onClick={onOpenUploadBook}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 font-semibold text-xs transition-colors border border-teal-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Livro PDF</span>
        </button>
      </div>

      {/* Dynamic Filters Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Categories Section */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
            <span>{activeTab === 'books' ? 'Gêneros' : 'Categorias'}</span>
            <button
              onClick={onOpenCategoryManager}
              className="hover:text-emerald-400 transition-colors p-1"
              title="Gerenciar Categorias & Regras"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {categories
              .filter(cat => activeTab === 'books' ? cat.type === 'book' : cat.type === 'document')
              .map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    selectedCategory === cat.id ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: cat.color || '#3b82f6' }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Tags Section (For Documents) */}
        {activeTab === 'documents' && (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5 px-1">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                  className={`px-2 py-0.5 rounded text-xs transition-all flex items-center gap-1 ${
                    selectedTag === tag.id
                      ? 'ring-2 ring-white font-semibold text-white'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: tag.color || '#6b7280', color: '#fff' }}
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Multi-Device Sync Buttons */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        <button
          onClick={onOpenDriveSync}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 font-semibold text-xs transition-colors border border-blue-700/60"
        >
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          <span>Sincronizar Google Drive ☁️</span>
        </button>

        <button
          onClick={onOpenBackup}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors border border-slate-700/80"
        >
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>Backup Local</span>
        </button>
      </div>
    </aside>
  );
}
