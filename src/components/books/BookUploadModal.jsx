import React, { useState } from 'react';
import { X, Upload, BookOpen, CheckCircle2, Image as ImageIcon, Loader2, Star, Plus } from 'lucide-react';
import { processPdfFile } from '../../services/pdfService';
import { db } from '../../db/database';

export function BookUploadModal({
  isOpen,
  onClose,
  categories = [],
  onBookAdded
}) {
  const [file, setFile] = useState(null);
  const [isExtractingCover, setIsExtractingCover] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  
  // Metadata Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genreId, setGenreId] = useState('');
  const [series, setSeries] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [rating, setRating] = useState(0);
  const [readStatus, setReadStatus] = useState('unread'); // 'unread' | 'reading' | 'read'
  const [description, setDescription] = useState('');
  const [pageCount, setPageCount] = useState(0);

  // Inline Category Creation State
  const [isAddingGenre, setIsAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [newGenreColor, setNewGenreColor] = useState('#2563eb');

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
  };

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    setIsExtractingCover(true);

    try {
      const pdfData = await processPdfFile(selectedFile);
      setCoverImage(pdfData.thumbnail);
      setPageCount(pdfData.pageCount);
    } catch (err) {
      console.error('Erro ao gerar capa:', err);
    } finally {
      setIsExtractingCover(false);
    }
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
    if (!file) {
      alert('Por favor, selecione o arquivo PDF do livro.');
      return;
    }

    try {
      const bookData = {
        title: title || file.name,
        author: author || 'Autor Desconhecido',
        genreId: genreId ? Number(genreId) : (categories.find(c => c.type === 'book')?.id || null),
        series: series.trim(),
        publisher: publisher.trim(),
        publishYear: publishYear ? Number(publishYear) : null,
        rating,
        readStatus,
        description: description.trim(),
        fileBlob: file,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        coverImage,
        pageCount,
        addedDate: new Date().toISOString()
      };

      await db.books.add(bookData);
      onBookAdded();
      handleClose();
    } catch (err) {
      console.error('Erro ao salvar livro:', err);
      alert('Erro ao salvar o livro na biblioteca local.');
    }
  };

  const handleClose = () => {
    setFile(null);
    setCoverImage('');
    setTitle('');
    setAuthor('');
    setRating(0);
    setReadStatus('unread');
    setDescription('');
    setIsExtractingCover(false);
    onClose();
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
              <h3 className="font-bold text-base">Adicionar Livro à Biblioteca</h3>
              <p className="text-xs text-teal-200">Geração de Capa Automática & Leitura PDF</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-teal-300 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* File Upload Zone */}
          {!file ? (
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center transition-colors bg-slate-50 hover:bg-teal-50/30 cursor-pointer relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Selecione o arquivo PDF do Livro</p>
                  <p className="text-xs text-slate-500 mt-1">A capa do livro será extraída automaticamente da 1ª página</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {isExtractingCover ? (
                  <div className="w-14 h-20 bg-slate-200 rounded flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  </div>
                ) : coverImage ? (
                  <img src={coverImage} alt="" className="w-14 h-20 object-cover rounded shadow-md border border-slate-300" />
                ) : (
                  <BookOpen className="w-10 h-10 text-teal-600" />
                )}
                <div>
                  <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB • {pageCount} páginas</p>
                  
                  <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 mt-1 cursor-pointer">
                    <ImageIcon className="w-3 h-3" />
                    <span>Alterar foto da Capa</span>
                    <input type="file" accept="image/*" onChange={handleCustomCoverUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-rose-600 font-semibold hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
              >
                Trocar PDF
              </button>
            </div>
          )}

          {file && (
            <>
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
                    placeholder="Ex: Dom Casmurro"
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
                    placeholder="Ex: Machado de Assis"
                  />
                </div>
              </div>

              {/* Genre & Series */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <span>Novo Gênero</span>
                    </button>
                  </div>

                  {isAddingGenre && (
                    <div className="bg-teal-50/80 p-2.5 rounded-lg border border-teal-200 flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Nome do gênero..."
                        value={newGenreName}
                        onChange={(e) => setNewGenreName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-teal-300 rounded-md text-xs text-slate-800"
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
                        className="bg-teal-600 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-teal-500"
                      >
                        Criar
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Série / Coleção (Opcional)
                  </label>
                  <input
                    type="text"
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
                    placeholder="Ex: Volume 1"
                  />
                </div>
              </div>

              {/* Publisher & Status & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Editora
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
                    placeholder="Ex: Companhia das Letras"
                  />
                </div>

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
                  placeholder="Resumo ou anotações sobre o livro..."
                />
              </div>
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
              disabled={!file}
              className="px-5 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg shadow-md shadow-teal-900/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Adicionar à Estante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
