import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialData } from './db/database';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DocumentList } from './components/documents/DocumentList';
import { BookGrid } from './components/books/BookGrid';
import { DocumentUploadModal } from './components/documents/DocumentUploadModal';
import { DocumentEditModal } from './components/documents/DocumentEditModal';
import { BookUploadModal } from './components/books/BookUploadModal';
import { BookEditModal } from './components/books/BookEditModal';
import { PdfViewerModal } from './components/viewer/PdfViewerModal';
import { OcrViewerModal } from './components/viewer/OcrViewerModal';
import { CategoryManagerModal } from './components/categories/CategoryManagerModal';
import { BackupModal } from './components/backup/BackupModal';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { AdminDashboardModal } from './components/admin/AdminDashboardModal';
import { PendingApprovalScreen } from './components/auth/PendingApprovalScreen';
import { getCurrentUser, logoutUser } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState('documents'); // 'dashboard' | 'documents' | 'books'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedCorrespondent, setSelectedCorrespondent] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  // Modals state
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isUploadBookOpen, setIsUploadBookOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(null); // { item, type: 'document' | 'book' }
  const [viewingOcrDoc, setViewingOcrDoc] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editingBook, setEditingBook] = useState(null);

  // Seed DB on initial load
  useEffect(() => {
    seedInitialData();
  }, []);

  // Reactive Dexie Queries
  const rawDocuments = useLiveQuery(() => db.documents.toArray(), []) || [];
  const rawBooks = useLiveQuery(() => db.books.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const tags = useLiveQuery(() => db.tags.toArray(), []) || [];
  const correspondents = useLiveQuery(() => db.correspondents.toArray(), []) || [];
  const documentTypes = useLiveQuery(() => db.documentTypes.toArray(), []) || [];

  // 1. If not logged in -> Show Landing Page
  if (!currentUser) {
    return <LandingPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // 2. If logged in but pending or blocked -> Show Pending Approval Screen
  if (currentUser.status !== 'approved') {
    return (
      <PendingApprovalScreen
        currentUser={currentUser}
        onUserUpdated={(user) => setCurrentUser(user)}
        onLogout={() => {
          logoutUser();
          setCurrentUser(null);
        }}
      />
    );
  }

  // Filter & Sort Documents
  const filteredDocuments = rawDocuments.filter(doc => {
    if (selectedCategory !== null && doc.categoryId !== selectedCategory) return false;
    if (selectedTag !== null && (!doc.tags || !doc.tags.includes(selectedTag))) return false;
    if (selectedCorrespondent !== null && doc.correspondentId !== selectedCorrespondent) return false;
    if (selectedDocType !== null && doc.docTypeId !== selectedDocType) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title?.toLowerCase().includes(q);
      const matchOcr = doc.ocrText?.toLowerCase().includes(q);
      const matchFile = doc.fileName?.toLowerCase().includes(q);
      if (!matchTitle && !matchOcr && !matchFile) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.addedDate || 0) - new Date(a.addedDate || 0);
    if (sortBy === 'oldest') return new Date(a.addedDate || 0) - new Date(b.addedDate || 0);
    if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'title_desc') return (b.title || '').localeCompare(a.title || '');
    return 0;
  });

  // Filter & Sort Books
  const filteredBooks = rawBooks.filter(book => {
    if (selectedCategory !== null && book.genreId !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = book.title?.toLowerCase().includes(q);
      const matchAuthor = book.author?.toLowerCase().includes(q);
      const matchDesc = book.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchDesc) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.addedDate || 0) - new Date(a.addedDate || 0);
    if (sortBy === 'oldest') return new Date(a.addedDate || 0) - new Date(b.addedDate || 0);
    if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'title_desc') return (b.title || '').localeCompare(a.title || '');
    if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  // Actions
  const handleDownload = (item) => {
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

  const handleDeleteDocument = async (id) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      await db.documents.delete(id);
    }
  };

  const handleDeleteBook = async (id) => {
    if (confirm('Tem certeza que deseja excluir este livro da estante?')) {
      await db.books.delete(id);
    }
  };

  const handleUpdateBookStatus = async (id, newStatus) => {
    await db.books.update(id, { readStatus: newStatus });
  };

  const handleUpdateBookRating = async (id, newRating) => {
    await db.books.update(id, { rating: newRating });
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        docCount={rawDocuments.length}
        bookCount={rawBooks.length}
        categories={categories}
        tags={tags}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        onOpenUploadDoc={() => setIsUploadDocOpen(true)}
        onOpenUploadBook={() => setIsUploadBookOpen(true)}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header & Search Bar */}
        <Header
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          totalItems={activeTab === 'documents' ? filteredDocuments.length : filteredBooks.length}
          currentUser={currentUser}
          onOpenAdminPanel={() => setIsAdminModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' ? (
            <AnalyticsDashboard
              documents={rawDocuments}
              books={rawBooks}
              categories={categories}
              tags={tags}
              correspondents={correspondents}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          ) : activeTab === 'documents' ? (
            <DocumentList
              documents={filteredDocuments}
              categories={categories}
              tags={tags}
              correspondents={correspondents}
              documentTypes={documentTypes}
              viewMode={viewMode}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              selectedCorrespondent={selectedCorrespondent}
              setSelectedCorrespondent={setSelectedCorrespondent}
              selectedDocType={selectedDocType}
              setSelectedDocType={setSelectedDocType}
              searchQuery={searchQuery}
              onViewPdf={(doc) => setViewingPdf({ item: doc, type: 'document' })}
              onViewOcr={(doc) => setViewingOcrDoc(doc)}
              onDownload={handleDownload}
              onEditDoc={(doc) => setEditingDocument(doc)}
              onDelete={handleDeleteDocument}
              onOpenUploadDoc={() => setIsUploadDocOpen(true)}
            />
          ) : (
            <BookGrid
              books={filteredBooks}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onReadBook={(book) => setViewingPdf({ item: book, type: 'book' })}
              onDownloadBook={handleDownload}
              onEditBook={(book) => setEditingBook(book)}
              onDeleteBook={handleDeleteBook}
              onUpdateStatus={handleUpdateBookStatus}
              onUpdateRating={handleUpdateBookRating}
              onOpenUploadBook={() => setIsUploadBookOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        categories={categories}
        tags={tags}
        correspondents={correspondents}
        documentTypes={documentTypes}
        onDocumentAdded={() => {}}
      />

      <DocumentEditModal
        isOpen={!!editingDocument}
        onClose={() => setEditingDocument(null)}
        doc={editingDocument}
        categories={categories}
        tags={tags}
        correspondents={correspondents}
        documentTypes={documentTypes}
        onDocumentUpdated={() => {}}
      />

      <BookUploadModal
        isOpen={isUploadBookOpen}
        onClose={() => setIsUploadBookOpen(false)}
        categories={categories}
        onBookAdded={() => {}}
      />

      <BookEditModal
        isOpen={!!editingBook}
        onClose={() => setEditingBook(null)}
        book={editingBook}
        categories={categories}
        onBookUpdated={() => {}}
      />

      <PdfViewerModal
        isOpen={!!viewingPdf}
        onClose={() => setViewingPdf(null)}
        item={viewingPdf?.item}
        type={viewingPdf?.type}
      />

      <OcrViewerModal
        isOpen={!!viewingOcrDoc}
        onClose={() => setViewingOcrDoc(null)}
        doc={viewingOcrDoc}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        tags={tags}
        correspondents={correspondents}
        documentTypes={documentTypes}
        onRefresh={() => {}}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
