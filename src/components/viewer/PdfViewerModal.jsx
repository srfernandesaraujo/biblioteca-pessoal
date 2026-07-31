import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, FileText, BookOpen, ChevronLeft, ChevronRight, Bookmark, Cloud, AlertCircle } from 'lucide-react';
import { extractDriveFileId, getDriveEmbedPreviewUrl, getDriveDirectDownloadUrl } from '../../services/googleDriveService';
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

  const driveId = item ? (item.driveFileId || extractDriveFileId(item.driveLink)) : '';
  const isGoogleDrive = Boolean(driveId);

  useEffect(() => {
    if (item && item.fileBlob) {
      const url = URL.createObjectURL(item.fileBlob);
      setPdfUrl(url);

      const initialPage = item.lastReadPage || 1;
      setCurrentPage(initialPage);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl('');
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
    if (isGoogleDrive) {
      window.open(getDriveDirectDownloadUrl(driveId), '_blank');
      return;
    }
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

  const handleOpenGoogleDriveDirect = () => {
    if (driveId) {
      window.open(`https://drive.google.com/file/d/${driveId}/view`, '_blank');
    } else if (item.driveLink) {
      window.open(item.driveLink, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-between p-2 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white rounded-t-2xl px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            {type === 'book' ? <BookOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h3 className="font-bold text-sm text-slate-100 truncate flex items-center gap-2">
              {item.title}
              {isGoogleDrive && (
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-cyan-300" /> Google Drive
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {type === 'book' ? (item.author || 'Autor Desconhecido') : (item.fileName || 'Documento PDF')}
            </p>
          </div>
        </div>

        {/* Page navigation & Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {type === 'book' && totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 mr-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-0.5 hover:text-emerald-400 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Pág. {currentPage} de {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-0.5 hover:text-emerald-400 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {pdfUrl && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-300">{zoom}%</span>
              <button 
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          {isGoogleDrive && (
            <button
              onClick={handleOpenGoogleDriveDirect}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              title="Abrir no Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir no Google Drive</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Baixar Arquivo"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Viewer Body Area */}
      <div className="flex-1 bg-slate-950 rounded-b-2xl overflow-hidden flex flex-col items-center justify-center p-2 border-t border-slate-800 relative">
        {pdfUrl ? (
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <iframe
              src={`${pdfUrl}#page=${currentPage}`}
              className="w-full h-full rounded-xl border-0 shadow-2xl bg-white"
              title={item.title}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            />
          </div>
        ) : isGoogleDrive ? (
          <div className="w-full h-full flex flex-col">
            <iframe
              src={getDriveEmbedPreviewUrl(driveId)}
              className="w-full flex-1 rounded-xl border-0 shadow-2xl bg-white"
              title={item.title}
              allow="autoplay"
            />
            {/* Permission Helper Banner */}
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Está vendo um erro 403 do Google? Certifique-se de que o arquivo no Google Drive está compartilhado como <strong>"Qualquer pessoa com o link"</strong> ou clique ao lado:
                </span>
              </div>
              <button
                onClick={handleOpenGoogleDriveDirect}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs flex items-center gap-1 flex-shrink-0 ml-2"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Abrir em Nova Aba</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400 space-y-2">
            <FileText className="w-12 h-12 mx-auto text-slate-600" />
            <p className="text-sm font-semibold">Carregando arquivo PDF...</p>
          </div>
        )}
      </div>
    </div>
  );
}
