import React from 'react';
import { FileText, Eye, Download, FileCode, Tag, Calendar, User, Trash2, Pencil } from 'lucide-react';

export function DocumentCard({
  doc,
  category,
  tagsMap = {},
  correspondent,
  docType,
  onViewPdf,
  onViewOcr,
  onDownload,
  onEditDoc,
  onDelete
}) {
  return (
    <div className="doc-card bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 relative group">
      {/* Top Banner & Tags (Estilo Paperless) */}
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex flex-wrap gap-1 items-center min-h-[36px]">
        {category && (
          <span 
            className="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-xs"
            style={{ backgroundColor: category.color || '#3b82f6' }}
          >
            {category.name}
          </span>
        )}

        {doc.tags && doc.tags.map(tagId => {
          const t = tagsMap[tagId];
          if (!t) return null;
          return (
            <span
              key={t.id}
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white shadow-xs"
              style={{ backgroundColor: t.color || '#6b7280' }}
            >
              {t.name}
            </span>
          );
        })}
      </div>

      {/* Thumbnail Preview Area */}
      <div 
        onClick={() => onViewPdf(doc)}
        className="h-44 bg-slate-100 relative cursor-pointer group-hover:opacity-95 transition-opacity flex items-center justify-center overflow-hidden border-b border-slate-100"
      >
        {doc.thumbnail ? (
          <img 
            src={doc.thumbnail} 
            alt={doc.title} 
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <FileText className="w-12 h-12 stroke-1" />
            <span className="text-xs">Sem prévia</span>
          </div>
        )}

        {/* Page Count Badge */}
        {doc.pageCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <span>{doc.pageCount} pág.</span>
          </div>
        )}

        {/* Hover overlay button */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-emerald-600" />
            Visualizar PDF
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            onClick={() => onViewPdf(doc)}
            className="font-bold text-slate-800 text-sm line-clamp-2 hover:text-emerald-600 cursor-pointer transition-colors leading-snug mb-1"
            title={doc.title}
          >
            {doc.title}
          </h3>

          <div className="space-y-1 text-xs text-slate-500 mt-2">
            {correspondent && (
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{correspondent.name}</span>
              </div>
            )}

            {docType && (
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <FileCode className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{docType.name}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{doc.createdDate || new Date(doc.addedDate).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* OCR snippet badge if OCR text exists */}
        {doc.ocrText && (
          <div className="mt-3 bg-emerald-50 text-emerald-700 p-2 rounded-md text-[11px] font-mono border border-emerald-100 line-clamp-2">
            "{doc.ocrText.substring(0, 100)}..."
          </div>
        )}

        {/* Card Actions Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewOcr(doc)}
              title="Ver Texto do OCR"
              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors text-xs flex items-center gap-1 font-medium"
            >
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>OCR</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewPdf(doc)}
              title="Abrir no leitor"
              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => onEditDoc(doc)}
              title="Editar Informações do Documento"
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDownload(doc)}
              title="Baixar arquivo PDF"
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDelete(doc.id)}
              title="Excluir documento"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
