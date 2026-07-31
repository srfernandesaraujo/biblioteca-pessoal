import React, { useState } from 'react';
import { X, Download, Upload, ShieldCheck, Database, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { exportDatabaseBackup, importDatabaseBackup } from '../../services/backupService';

export function BackupModal({
  isOpen,
  onClose
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setStatusText('Iniciando exportação...');
    setSuccessMessage('');

    try {
      await exportDatabaseBackup(({ status, progress }) => {
        setStatusText(status);
        setProgress(progress);
      });
      setSuccessMessage('✅ Backup exportado com sucesso! Arquivo salvo em downloads.');
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
      alert('Erro ao exportar o backup da biblioteca.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: A restauração de backup irá substituir a biblioteca atual pelos dados do arquivo. Deseja continuar?')) {
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setStatusText('Iniciando restauração...');
    setSuccessMessage('');

    try {
      await importDatabaseBackup(file, ({ status, progress }) => {
        setStatusText(status);
        setProgress(progress);
      });
      setSuccessMessage('🎉 Biblioteca restaurada com sucesso! Todos os documentos, livros e OCR foram importados.');
    } catch (err) {
      console.error('Erro ao restaurar backup:', err);
      alert('Arquivo de backup inválido ou corrompido.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Backup & Restauração da Biblioteca</h3>
              <p className="text-xs text-slate-300">Exportação e Importação 100% Local</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-950">Segurança & Privacidade dos seus Dados</p>
              <p className="text-blue-800 mt-0.5 leading-relaxed">
                O arquivo de backup gerado contém todos os seus documentos, livros em PDF, fotos de capa, textos extraídos do OCR, categorias e histórico de leitura em um único arquivo compactado.
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          {(isExporting || isImporting) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{statusText}</span>
                </div>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">Exportar Backup</h4>
                <p className="text-xs text-slate-500">
                  Baixe um arquivo JSON com todos os documentos, livros, PDFs e OCR.
                </p>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting || isImporting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all relative">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-800">Restaurar Backup</h4>
                <p className="text-xs text-slate-500">
                  Carregue um arquivo de backup baixado anteriormente para restaurar tudo.
                </p>
              </div>

              <label className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer text-center">
                <Upload className="w-4 h-4" />
                <span>Selecionar Arquivo .JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  disabled={isExporting || isImporting}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
