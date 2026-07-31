import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, FileText, BookOpen, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { db } from '../../db/database';

export function PdfViewerModal({
  isOpen,
  onClose,
  item, // document or book object
  type = 'document' // 'document' | 'book'
}) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = item?.pageCount || 1;

  useEffect(() => {
    if (item && item.fileBlob) {
      const url = URL.createObjectURL(item.fileBlob);
      setPdfUrl(url);

      const initialPage = item.lastReadPage || 1;
      setCurrentPage(initialPage);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const saveReadingProgress = async (page) => {
    if (type !== 'book' || !item.id) return;
    try {
      const isFinished = page >= totalPages && totalPages > 1;
      const newStatus = isFinished ? 'read' : item.readStatus === 'unread' ? 'reading' : item.readStatus;

      await db.books.update(item.id, {
        lastReadPage: page,
        readStatus: newStatus,
        lastReadDate: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao salvar progresso de leitura:', err);
    }
  };

  const handlePageChange = (newPage) => {
    const validPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(validPage);
    saveReadingProgress(validPage);
  };

  const handleClose = () => {
    saveReadingProgress(currentPage);
    onClose();
  };

  const handleDownload = () => {
    if (!item.fileBlob) return;
    const url = URL.createObjectURL(item.fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName || `${item.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    if (pdfUrl) {
      window.open(`${pdfUrl}#page=${currentPage}`, '_blank');
    }
  };

  const progressPercent = Math.min(100, Math.round((currentPage / totalPages) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Viewer Header */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        {/* Title & Author */}
        <div className="flex items-center gap-3 truncate max-w-md">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 ${
            type === 'document' ? 'bg-emerald-600' : 'bg-teal-600'
          }`}>
            {type === 'document' ? <FileText className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h3 className="font-bold text-sm text-white truncate" title={item.title}>
              {item.title}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {type === 'document' ? item.fileName : `${item.author || 'Autor'} • ${totalPages} pág.`}
            </p>
          </div>
        </div>

        {/* Book Page Progress Controls */}
        {type === 'book' && (
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition-colors"
              title="Página Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
              <span>Pág.</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="w-12 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-xs text-white font-bold focus:outline-none focus:border-teal-500"
              />
              <span className="text-slate-400">/ {totalPages}</span>
              <span className="bg-teal-900/60 text-teal-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-teal-700/50 ml-1">
                {progressPercent}%
              </span>
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition-colors"
              title="Próxima Página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 15))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-300">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 15))}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* External Tab */}
          <button
            onClick={handleOpenNewTab}
            title="Abrir em Nova Aba"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline">Nova Aba</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            title="Baixar PDF Localmente"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo</span>
          </button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF View Container */}
      <div className="flex-1 bg-slate-900/90 p-4 flex flex-col items-center justify-center overflow-auto relative">
        {pdfUrl ? (
          <div 
            className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden transition-transform duration-200"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            <iframe
              key={`${pdfUrl}-p${currentPage}`}
              src={`${pdfUrl}#page=${currentPage}`}
              title={item.title}
              className="w-full h-full border-none rounded-xl"
            />
          </div>
        ) : (
          <div className="text-slate-400 text-sm">Carregando visualizador de PDF...</div>
        )}
      </div>
    </div>
  );
}
