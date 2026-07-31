import React, { useState } from 'react';
import { X, Cloud, CloudUpload, CloudDownload, Folder, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, HardDrive } from 'lucide-react';
import { exportDatabaseBackup, importDatabaseBackup } from '../../services/backupService';
import { getStoredDriveFolderId, saveDriveFolderId, extractFolderId } from '../../services/googleDriveService';

export function GoogleDriveSyncModal({
  isOpen,
  onClose,
  currentUser
}) {
  const [folderInput, setFolderInput] = useState(getStoredDriveFolderId());
  const [statusMsg, setStatusMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveFolder = () => {
    const cleanId = extractFolderId(folderInput);
    saveDriveFolderId(cleanId);
    setFolderInput(cleanId);
    setStatusMsg('✓ ID da pasta salvo com sucesso!');
    setErrorMsg('');
  };

  // 1. Export local DB and Sync to Google Drive / Download Sync JSON
  const handleExportToDrive = async () => {
    try {
      setIsUploading(true);
      setStatusMsg('Gerando cópia de sincronização local...');
      setErrorMsg('');

      const backupObj = await exportDatabaseBackup(({ status }) => setStatusMsg(status));
      const jsonString = JSON.stringify(backupObj);

      // Download file locally to place in Google Drive folder manually or via API
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biblioteca_sync.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMsg('✅ Arquivo "biblioteca_sync.json" baixado! Basta movê-lo para sua pasta do Google Drive para disponibilizar em qualquer dispositivo.');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao sincronizar com Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Restore from Google Drive Sync File
  const handleImportFromDriveFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsDownloading(true);
      setStatusMsg('Restaurando documentos e livros do arquivo do Google Drive...');
      setErrorMsg('');

      await importDatabaseBackup(file, ({ status }) => setStatusMsg(status));
      setStatusMsg(`🎉 Sucesso! Documentos e livros sincronizados com este dispositivo!`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao restaurar do Google Drive.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/40">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Sincronização Multi-Dispositivo (Google Drive ☁️)
              </h3>
              <p className="text-xs text-slate-300">Acesse seus documentos e livros em qualquer computador ou celular</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Explanation Box */}
          <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-2">
            <p className="font-bold text-sm flex items-center gap-1.5 text-blue-950">
              <HardDrive className="w-4 h-4 text-blue-600" /> Como funciona o acesso em outros dispositivos:
            </p>
            <p className="leading-relaxed">
              Como não usamos bancos de dados pagos na nuvem, você pode salvar seu arquivo de sincronização <strong><code className="text-blue-900 font-bold bg-white px-1 py-0.5 rounded border border-blue-200">biblioteca_sync.json</code></strong> no seu <strong>Google Drive gratuito</strong>.
            </p>
            <p className="leading-relaxed">
              Ao abrir o site em qualquer outro computador ou celular, basta carregar o arquivo da sua pasta do Google Drive para sincronizar todos os seus livros, capas, PDFs, notas fiscais e leitura em 1 clique!
            </p>
          </div>

          {/* Action Step 1: Export to Google Drive */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Sincronizar dados para o Google Drive</h4>
                <p className="text-xs text-slate-500">
                  Gera e baixa seu arquivo <code className="font-mono text-slate-700 font-bold">biblioteca_sync.json</code> completo para você guardar na sua pasta do Google Drive.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportToDrive}
              disabled={isUploading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              <span>Gerar & Baixar Arquivo para o Google Drive</span>
            </button>
          </div>

          {/* Action Step 2: Import from Google Drive in another device */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Restaurar no novo dispositivo</h4>
                <p className="text-xs text-slate-500">
                  Abriu o site em outro celular ou computador? Selecione o arquivo do seu Google Drive para carregar sua biblioteca completa.
                </p>
              </div>
            </div>

            <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-center">
              {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
              <span>Selecionar Arquivo do Google Drive no Novo Dispositivo</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFromDriveFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Status Feedback */}
          {statusMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
