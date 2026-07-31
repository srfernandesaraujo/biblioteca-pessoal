import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, BookOpen, Plus, Star, Image as ImageIcon } from 'lucide-react';
import { db } from '../../db/database';

export function BookEditModal({
  isOpen,
  onClose,
  book,
  categories = [],
  onBookUpdated,
  onRefreshCategories
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genreId, setGenreId] = useState('');
  const [series, setSeries] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [rating, setRating] = useState(0);
  const [readStatus, setReadStatus] = useState('unread');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Inline Category Creation State
  const [isAddingGenre, setIsAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreColor, setNewGenreColor] = useState('#2563eb');

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setAuthor(book.author || '');
      setGenreId(book.genreId ? String(book.genreId) : '');
      setSeries(book.series || '');
      setPublisher(book.publisher || '');
      setPublishYear(book.publishYear ? String(book.publishYear) : '');
      setRating(book.rating || 0);
      setReadStatus(book.readStatus || 'unread');
      setDescription(book.description || '');
      setCoverImage(book.coverImage || '');
    }
  }, [book]);

  if (!isOpen || !book) return null;

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
    if (onRefreshCategories) onRefreshCategories();
  };

  const handleCustomCoverUpload = (e) => {
    const customFile = e.target.files[0];
    if (customFile) {
      const reader = new FileReader();
      reader.onload = (event) => setCoverImage(event.target.result);
      reader.readAsDataURL(customFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.books.update(book.id, {
        title: title.trim(),
        author: author.trim(),
        genreId: genreId ? Number(genreId) : null,
        series: series.trim(),
        publisher: publisher.trim(),
        publishYear: publishYear ? Number(publishYear) : null,
        rating,
        readStatus,
        description: description.trim(),
        coverImage
      });
      onBookUpdated();
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar livro:', err);
      alert('Erro ao atualizar as informações do livro.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-teal-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Editar Livro</h3>
              <p className="text-xs text-teal-200">Atualize dados da obra, gênero, avaliação e status</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-300 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Cover & General info preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {coverImage ? (
                <img src={coverImage} alt="" className="w-14 h-20 object-cover rounded shadow-md border border-slate-300" />
              ) : (
                <BookOpen className="w-10 h-10 text-teal-600" />
              )}
              <div>
                <p className="font-bold text-slate-800 text-sm truncate">{book.fileName || book.title}</p>
                <p className="text-xs text-slate-500">{book.pageCount ? `${book.pageCount} páginas` : 'PDF do Livro'}</p>
                
                <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 mt-1 cursor-pointer">
                  <ImageIcon className="w-3 h-3" />
                  <span>Alterar imagem da Capa</span>
                  <input type="file" accept="image/*" onChange={handleCustomCoverUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título do Livro
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Autor
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Genre / Category with Inline Creation Option */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Gênero / Categoria
              </label>
              <button
                type="button"
                onClick={() => setIsAddingGenre(!isAddingGenre)}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Novo Gênero</span>
              </button>
            </div>

            {isAddingGenre && (
              <div className="bg-teal-50/80 p-3 rounded-lg border border-teal-200 flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Nome do novo gênero..."
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-teal-300 rounded-md text-xs text-slate-800"
                />
                <input
                  type="color"
                  value={newGenreColor}
                  onChange={(e) => setNewGenreColor(e.target.value)}
                  className="w-7 h-7 rounded border border-teal-300 p-0.5 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleInlineCreateGenre}
                  className="bg-teal-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-teal-500"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingGenre(false)}
                  className="text-slate-500 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <select
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">Selecione o Gênero</option>
              {categories.filter(c => c.type === 'book').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Series & Publisher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Série / Coleção
              </label>
              <input
                type="text"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Editora
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Status & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status de Leitura
              </label>
              <select
                value={readStatus}
                onChange={(e) => setReadStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="unread">📌 Não Lido</option>
                <option value="reading">📖 Lendo</option>
                <option value="read">✅ Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Avaliação
              </label>
              <div className="flex items-center gap-1 pt-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sinopse / Notas
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
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
              className="px-5 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg shadow-md shadow-teal-900/20 transition-all flex items-center gap-2"
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
