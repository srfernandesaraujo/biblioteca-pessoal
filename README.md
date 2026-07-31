# 📚 Biblioteca Pessoal & Gestão de Documentos (Paperless + Calibre Web)

Um sistema web completo, moderno e de alta performance para gerenciamento local de **documentos pessoais** (notas fiscais, recibos, contratos, certidões) e **estante de livros digitais em PDF**, inspirado nas melhores ferramentas do mercado como **Paperless-ngx** e **Calibre-Web**.

---

## 🌟 Principais Funcionalidades

### 📄 Módulo de Documentos (Estilo Paperless-ngx)
- **Leitura em OCR Local (Tesseract.js)**: Reconhecimento óptico de caracteres em Português e Inglês executado 100% no seu dispositivo sem enviar dados para a nuvem.
- **Extração Inteligente de Metadados**: Auto-detecção de datas, valores em R$ e sugestão de títulos a partir do texto do OCR.
- **Organização & Tags**: Categorias coloridas, tags customizadas (*Urgente, Pago, Pendente*), correspondentes/emissores e tipos de documento.
- **Visualização Flexível**: Grade de cards com miniaturas geradas da 1ª página do PDF e visão em tabela compacta.
- **Leitor PDF & OCR**: Visualizador interno de PDF com zoom, download e exportação do texto do OCR em `.txt`.

### 📚 Módulo de Livros (Estilo Calibre-Web)
- **Estante Virtual 3D**: Exibição de capas de livros com efeito de profundidade e sombra realística.
- **Geração Automática de Capas**: Renderização da 1ª página do PDF como capa ou upload de foto customizada.
- **Controle de Leitura & Progresso**:
  - Memorização automática da **última página lida** ao reabrir qualquer livro.
  - Indicador visual e barra de progresso de leitura em % na estante.
  - Classificação de 1 a 5 estrelas e status (*Não lido, Lendo, Concluído*).

### ⚡ Automação Inteligente & Regras por OCR
- **Auto-Tagging e Classificação Automática**: Regras com gatilhos de palavras-chave do OCR que atribuem categoria, emissor e tags automaticamente durante o cadastro do documento.
- **Gerenciador de Regras**: Interface para criar, ativar/desativar e personalizar regras de automação.

### 💾 Backup & Restauração em 1 Clique
- **Exportação Completa (JSON)**: Baixe toda a sua biblioteca (documentos, livros, capas, PDFs em Base64, OCR e configurações) em um único arquivo compactado.
- **Restauração Rápida**: Carregue o arquivo de backup para restaurar seus dados a qualquer momento.

### 📊 Dashboard & Métricas Visuais
- **Painel de KPIs**: Total de documentos, páginas no OCR, livros lidos e **soma financeira total extraída de faturas/recibos**.
- **Gráficos Visuais**: Distribuição de documentos por categoria, estante por gênero e frequência de tags.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide Icons
- **Banco de Dados**: IndexedDB com Dexie.js (Armazenamento local persistente)
- **Processamento de PDF**: PDF.js (`pdfjs-dist`)
- **OCR Engine**: Tesseract.js (`por` + `eng`)

---

## 🚀 Como Executar Localmente

1. **Clonar o repositório**:
   ```bash
   git clone https://github.com/SEU_USUARIO/biblioteca-pessoal.git
   cd biblioteca-pessoal
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. Acesse a aplicação no seu navegador: **http://localhost:5174/**

---

## 📝 Licença
Este projeto é de código aberto sob a licença MIT.
