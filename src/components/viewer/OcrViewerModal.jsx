import React, { useState } from 'react';
import { X, Copy, Download, Check, Sparkles, FileText } from 'lucide-react';

export function OcrViewerModal({
  isOpen,
  onClose,
  doc
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !doc) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.ocrText || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([doc.ocrText || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}_ocr.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Texto Lido no OCR</h3>
              <p className="text-xs text-slate-300 truncate max-w-md">{doc.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
            <span>Extraído localmente via Tesseract.js (Português/Inglês)</span>
            <span>{doc.ocrText ? `${doc.ocrText.length} caracteres` : '0 caracteres'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[50vh] overflow-y-auto">
            <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
              {doc.ocrText || 'Nenhum texto extraído para este documento.'}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleDownloadTxt}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Baixar em .TXT</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
