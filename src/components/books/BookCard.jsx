import React from 'react';
import { BookOpen, Star, Download, Trash2, CheckCircle2, Bookmark, Eye, Pencil } from 'lucide-react';

export function BookCard({
  book,
  genre,
  onReadBook,
  onDownloadBook,
  onEditBook,
  onDeleteBook,
  onUpdateStatus,
  onUpdateRating
}) {
  const renderStars = (currentRating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdateRating(book.id, star);
        }}
        className="p-0.5 focus:outline-none group/star"
      >
        <Star
          className={`w-3.5 h-3.5 ${
            star <= (currentRating || 0)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-300 hover:text-amber-300'
          } transition-colors`}
        />
      </button>
    ));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'read':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Lido
          </span>
        );
      case 'reading':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-amber-600" />
            Lendo
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Bookmark className="w-3 h-3 text-slate-400" />
            Não lido
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-3 group">
      {/* Book Cover Container with Drop Shadow */}
      <div 
        onClick={() => onReadBook(book)}
        className="book-cover-shadow relative aspect-[2/3] bg-slate-200 rounded-lg overflow-hidden cursor-pointer border border-slate-300/80 group-hover:border-teal-500 transition-all"
      >
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-teal-800 to-slate-900 text-white text-center">
            <BookOpen className="w-10 h-10 mb-2 text-teal-300 opacity-80" />
            <span className="font-bold text-xs line-clamp-3">{book.title}</span>
            <span className="text-[10px] text-teal-200 mt-1">{book.author}</span>
          </div>
        )}

        {/* Hover overlay read button */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-teal-600" />
            Ler Livro PDF
          </span>
        </div>

        {/* Status Tag Overlay Top Left */}
        <div className="absolute top-2 left-2">
          {getStatusBadge(book.readStatus)}
        </div>

        {/* Reading Progress Bar Overlay at Bottom of Cover */}
        {book.lastReadPage > 1 && book.pageCount > 0 && (
          <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-xs p-1.5 text-white flex flex-col gap-1 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-200 px-0.5">
              <span>Pág. {book.lastReadPage}/{book.pageCount}</span>
              <span className="text-teal-300 font-bold">
                {Math.min(100, Math.round((book.lastReadPage / book.pageCount) * 100))}%
              </span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((book.lastReadPage / book.pageCount) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="space-y-1">
        <h3 
          onClick={() => onReadBook(book)}
          className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 hover:text-teal-600 cursor-pointer transition-colors"
          title={book.title}
        >
          {book.title}
        </h3>

        <p className="text-xs font-medium text-teal-700 truncate">
          {book.author || 'Autor desconhecido'}
        </p>

        {genre && (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {genre.name}
          </span>
        )}

        {/* Star Ratings */}
        <div className="flex items-center gap-0.5 pt-1">
          {renderStars(book.rating)}
        </div>
      </div>

      {/* Book Quick Actions */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
        {/* Toggle Reading Status Cycle */}
        <button
          onClick={() => {
            const nextStatus = book.readStatus === 'unread' ? 'reading' : book.readStatus === 'reading' ? 'read' : 'unread';
            onUpdateStatus(book.id, nextStatus);
          }}
          className="hover:text-teal-600 text-[11px] font-medium transition-colors"
        >
          Mudar status
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditBook(book)}
            title="Editar Informações do Livro"
            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDownloadBook(book)}
            title="Baixar Livro PDF"
            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteBook(book.id)}
            title="Excluir Livro"
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
