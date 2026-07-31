import React, { useState } from 'react';
import { BookCard } from './BookCard';
import { BookOpen, Plus, Filter, ArrowUpDown } from 'lucide-react';

export function BookGrid({
  books = [],
  categories = [],
  selectedCategory,
  setSelectedCategory,
  onReadBook,
  onDownloadBook,
  onEditBook,
  onDeleteBook,
  onUpdateStatus,
  onUpdateRating,
  onOpenUploadBook
}) {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'reading' | 'read'
  const genresMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const filteredBooks = books.filter(book => {
    if (statusFilter !== 'all' && book.readStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Calibre Web Filter & Sort Bar (Estilo Calibre-Web Imagem 2) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Reading Status Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({books.length})
          </button>
          <button
            onClick={() => setStatusFilter('unread')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'unread' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📌 Não Lidos ({books.filter(b => b.readStatus === 'unread').length})
          </button>
          <button
            onClick={() => setStatusFilter('reading')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'reading' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📖 Lendo ({books.filter(b => b.readStatus === 'reading').length})
          </button>
          <button
            onClick={() => setStatusFilter('read')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              statusFilter === 'read' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✅ Concluídos ({books.filter(b => b.readStatus === 'read').length})
          </button>
        </div>

        {/* Genre Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">📚 Todos os Gêneros</option>
            {categories.filter(c => c.type === 'book').map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Nenhum livro encontrado na biblioteca</h3>
            <p className="text-slate-500 text-sm max-w-md mt-1">
              Adicione seus livros em PDF para formar sua estante digital personalizada com leitura e capas automáticas.
            </p>
          </div>
          <button
            onClick={onOpenUploadBook}
            className="bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-md shadow-teal-900/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Livro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              genre={genresMap[book.genreId]}
              onReadBook={onReadBook}
              onDownloadBook={onDownloadBook}
              onEditBook={onEditBook}
              onDeleteBook={onDeleteBook}
              onUpdateStatus={onUpdateStatus}
              onUpdateRating={onUpdateRating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
