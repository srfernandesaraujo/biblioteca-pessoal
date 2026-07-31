import React from 'react';
import { 
  FileText, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Tag as TagIcon, 
  Layers, 
  Star, 
  Sparkles,
  BarChart3,
  Bookmark
} from 'lucide-react';

export function AnalyticsDashboard({
  documents = [],
  books = [],
  categories = [],
  tags = [],
  correspondents = [],
  onNavigateToTab
}) {
  // 1. Calculate KPI Metrics
  const totalDocs = documents.length;
  const totalBooks = books.length;
  
  const completedBooks = books.filter(b => b.readStatus === 'read').length;
  const readingBooks = books.filter(b => b.readStatus === 'reading').length;
  const unreadBooks = books.filter(b => b.readStatus === 'unread').length;

  const totalDocPages = documents.reduce((sum, d) => sum + (d.pageCount || 1), 0);
  const totalBookPages = books.reduce((sum, b) => sum + (b.pageCount || 0), 0);

  // Extract financial values (R$) from OCR text / smart metadata
  let totalFinancialValue = 0;
  documents.forEach(doc => {
    if (doc.ocrText) {
      const match = doc.ocrText.match(/(?:R\$\s*|Total\s*:?\s*R\$\s*|VALOR\s*:?\s*R\$\s*)([\d\.\,]+)/i);
      if (match && match[1]) {
        // Convert R$ format 1.234,56 to float
        const rawNum = match[1].replace(/\./g, '').replace(',', '.');
        const val = parseFloat(rawNum);
        if (!isNaN(val) && val < 1000000) {
          totalFinancialValue += val;
        }
      }
    }
  });

  // 2. Documents Breakdown by Category
  const docCategories = categories.filter(c => c.type === 'document');
  const docsByCategory = docCategories.map(cat => {
    const count = documents.filter(d => d.categoryId === cat.id).length;
    const percent = totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0;
    return { ...cat, count, percent };
  }).sort((a, b) => b.count - a.count);

  // 3. Books Breakdown by Genre
  const bookGenres = categories.filter(c => c.type === 'book');
  const booksByGenre = bookGenres.map(genre => {
    const count = books.filter(b => b.genreId === genre.id).length;
    const percent = totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0;
    return { ...genre, count, percent };
  }).sort((a, b) => b.count - a.count);

  // 4. Tags Usage Breakdown
  const tagsUsage = tags.map(tag => {
    const count = documents.filter(d => d.tags && d.tags.includes(tag.id)).length;
    return { ...tag, count };
  }).sort((a, b) => b.count - a.count);

  // 5. Top Rated Books
  const topRatedBooks = [...books]
    .filter(b => (b.rating || 0) > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard & Visão Geral</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Estatísticas da sua Biblioteca</h2>
          <p className="text-xs text-slate-300">Resumo executivo de documentos, finanças extraídas e progresso de leitura.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab('documents')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/40 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Ir para Documentos</span>
          </button>
          <button
            onClick={() => onNavigateToTab('books')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-950/40 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ir para Estante</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Documents KPI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4 hover:border-emerald-400 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Documentos</span>
            <h3 className="text-2xl font-extrabold text-slate-800">{totalDocs}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold">{totalDocPages} páginas no OCR</span>
          </div>
        </div>

        {/* Total Financial Value Extracted */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4 hover:border-blue-400 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total em Faturas/Notas</span>
            <h3 className="text-2xl font-extrabold text-blue-900">
              {totalFinancialValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <span className="text-[11px] text-blue-600 font-semibold">Extraído via OCR</span>
          </div>
        </div>

        {/* Total Books KPI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4 hover:border-teal-400 transition-all">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Livros na Estante</span>
            <h3 className="text-2xl font-extrabold text-slate-800">{totalBooks}</h3>
            <span className="text-[11px] text-teal-600 font-semibold">{totalBookPages.toLocaleString('pt-BR')} páginas totais</span>
          </div>
        </div>

        {/* Books Read Progress KPI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4 hover:border-purple-400 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Livros Concluídos</span>
            <h3 className="text-2xl font-extrabold text-purple-900">{completedBooks}</h3>
            <span className="text-[11px] text-purple-600 font-semibold">{readingBooks} lendo atualmente</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Charts & Progress Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Categories Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Documentos por Categoria</h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{docCategories.length} categorias</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {docsByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum documento cadastrado ainda.</p>
            ) : (
              docsByCategory.map(cat => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="text-slate-500 font-mono">{cat.count} doc ({cat.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${cat.percent}%`, backgroundColor: cat.color || '#3b82f6' }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reading Status & Genres Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-800 text-sm">Status da Biblioteca de Livros</h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{totalBooks} obras</span>
          </div>

          {/* Reading Status Bars */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">📌 Não Lidos</span>
              <span className="text-xl font-extrabold text-slate-700">{unreadBooks}</span>
            </div>
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">📖 Lendo</span>
              <span className="text-xl font-extrabold text-amber-900">{readingBooks}</span>
            </div>
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">✅ Concluídos</span>
              <span className="text-xl font-extrabold text-emerald-900">{completedBooks}</span>
            </div>
          </div>

          {/* Genres breakdown */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gêneros de Livros</h4>
            {booksByGenre.map(genre => (
              <div key={genre.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>{genre.name}</span>
                  <span className="text-slate-400 font-mono">{genre.count} livro(s)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${genre.percent}%`, backgroundColor: genre.color || '#0d9488' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid for Tags & Top Rated Books */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tags Frequency */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-sm">Frequência de Tags em Documentos</h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {tagsUsage.map(t => (
              <div 
                key={t.id}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-xs"
                style={{ backgroundColor: t.color || '#6b7280' }}
              >
                <span>{t.name}</span>
                <span className="bg-white/30 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Rated Books */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm">Livros Mais Bem Avaliados</h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {topRatedBooks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Nenhum livro avaliado ainda.</p>
            ) : (
              topRatedBooks.map(book => (
                <div key={book.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3 truncate">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt="" className="w-8 h-11 object-cover rounded shadow-xs" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-teal-600" />
                    )}
                    <div className="truncate">
                      <h4 className="font-bold text-xs text-slate-800 truncate">{book.title}</h4>
                      <p className="text-[11px] text-teal-700 truncate">{book.author}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 text-xs font-bold text-amber-700">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{book.rating}/5</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
