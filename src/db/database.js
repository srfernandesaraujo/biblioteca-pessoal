import Dexie from 'dexie';

export const db = new Dexie('BibliotecaPessoalDB');

// Define database schema
db.version(2).stores({
  documents: '++id, title, categoryId, docTypeId, correspondentId, createdDate, addedDate',
  books: '++id, title, author, genreId, readStatus, rating, addedDate',
  categories: '++id, &name, type', // type: 'document' | 'book'
  tags: '++id, &name',
  correspondents: '++id, &name',
  documentTypes: '++id, &name',
  automationRules: '++id, &name, enabled'
});

// Helper function to seed initial default categories, tags, correspondents and rules
export async function seedInitialData() {
  const categoriesCount = await db.categories.count();
  if (categoriesCount === 0) {
    await db.categories.bulkAdd([
      // Categorias de Documentos
      { name: 'Notas Fiscais', type: 'document', color: '#3b82f6', icon: 'FileText' },
      { name: 'Contratos', type: 'document', color: '#10b981', icon: 'FileCheck' },
      { name: 'Recibos', type: 'document', color: '#f59e0b', icon: 'Receipt' },
      { name: 'Registros & Documentos', type: 'document', color: '#8b5cf6', icon: 'Folder' },
      { name: 'Impostos & Taxas', type: 'document', color: '#ef4444', icon: 'Coins' },
      { name: 'Saúde & Exames', type: 'document', color: '#ec4899', icon: 'Activity' },
      
      // Categorias de Livros
      { name: 'Tecnologia & Programação', type: 'book', color: '#2563eb', icon: 'Code' },
      { name: 'Ficção & Romance', type: 'book', color: '#db2777', icon: 'BookOpen' },
      { name: 'Finanças & Negócios', type: 'book', color: '#059669', icon: 'TrendingUp' },
      { name: 'Desenvolvimento Pessoal', type: 'book', color: '#7c3aed', icon: 'Smile' },
      { name: 'História & Biografia', type: 'book', color: '#d97706', icon: 'Bookmark' },
      { name: 'Ciência & Filosofia', type: 'book', color: '#0891b2', icon: 'Compass' }
    ]);
  }

  const tagsCount = await db.tags.count();
  if (tagsCount === 0) {
    await db.tags.bulkAdd([
      { name: 'Urgente', color: '#ef4444' },
      { name: 'Importante', color: '#f59e0b' },
      { name: '2026', color: '#3b82f6' },
      { name: 'Pago', color: '#10b981' },
      { name: 'Pendente', color: '#8b5cf6' },
      { name: 'Arquivado', color: '#6b7280' }
    ]);
  }

  const correspondentsCount = await db.correspondents.count();
  if (correspondentsCount === 0) {
    await db.correspondents.bulkAdd([
      { name: 'Receita Federal' },
      { name: 'Prefeitura Municipal' },
      { name: 'Banco Santander / Itaú / Nubank' },
      { name: 'Concessionária de Energia / Água' },
      { name: 'Empresa / Empregador' }
    ]);
  }

  const docTypesCount = await db.documentTypes.count();
  if (docTypesCount === 0) {
    await db.documentTypes.bulkAdd([
      { name: 'Invoice / Fatura' },
      { name: 'Contrato de Prestação' },
      { name: 'Comprovante de Pagamento' },
      { name: 'Certidão / Registro' },
      { name: 'Relatório Médico' }
    ]);
  }

  const rulesCount = await db.automationRules.count();
  if (rulesCount === 0) {
    // Retrieve initial IDs
    const nfCategory = await db.categories.where('name').equals('Notas Fiscais').first();
    const impCategory = await db.categories.where('name').equals('Impostos & Taxas').first();
    const saudeCategory = await db.categories.where('name').equals('Saúde & Exames').first();
    const pagoTag = await db.tags.where('name').equals('Pago').first();
    const concEmissor = await db.correspondents.where({ name: 'Concessionária de Energia / Água' }).first();
    const recEmissor = await db.correspondents.where({ name: 'Receita Federal' }).first();
    const faturaType = await db.documentTypes.where({ name: 'Invoice / Fatura' }).first();
    const medicoType = await db.documentTypes.where({ name: 'Relatório Médico' }).first();

    await db.automationRules.bulkAdd([
      {
        name: 'Auto-classificar Notas Fiscais & Faturas',
        keywords: ['Nota Fiscal', 'NFe', 'DANFE', 'Valor Total', 'CNPJ'],
        matchType: 'any',
        assignCategory: nfCategory?.id || null,
        assignCorrespondent: null,
        assignDocType: faturaType?.id || null,
        assignTags: pagoTag ? [pagoTag.id] : [],
        enabled: true
      },
      {
        name: 'Auto-classificar Energia & Água',
        keywords: ['Equatorial', 'CPFL', 'KWh', 'Consumo', 'ENERGIA', 'SABESP'],
        matchType: 'any',
        assignCategory: nfCategory?.id || null,
        assignCorrespondent: concEmissor?.id || null,
        assignDocType: faturaType?.id || null,
        assignTags: [],
        enabled: true
      },
      {
        name: 'Auto-classificar Impostos (DARF / IPTU / IPVA)',
        keywords: ['DARF', 'IPTU', 'IPVA', 'Receita Federal', 'Tributo', 'Imposto'],
        matchType: 'any',
        assignCategory: impCategory?.id || null,
        assignCorrespondent: recEmissor?.id || null,
        assignDocType: null,
        assignTags: [],
        enabled: true
      },
      {
        name: 'Auto-classificar Exames & Laudos Médicos',
        keywords: ['Exame', 'Laudo', 'Paciente', 'CRM', 'Laboratório', 'Diagnóstico'],
        matchType: 'any',
        assignCategory: saudeCategory?.id || null,
        assignCorrespondent: null,
        assignDocType: medicoType?.id || null,
        assignTags: [],
        enabled: true
      }
    ]);
  }
}
