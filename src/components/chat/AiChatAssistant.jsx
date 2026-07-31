import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  FileText, 
  BookOpen, 
  Coins, 
  User, 
  ExternalLink,
  Trash2,
  Lightbulb,
  Search,
  MessageSquare
} from 'lucide-react';

// Helper to remove accents and normalize text
function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Helper to extract financial values from text (handles R$, VALOR:, and currency numbers)
function extractValuesFromText(text) {
  if (!text) return [];
  const values = [];

  // Match patterns like "VALOR:\s*9.600,00", "R$\s*9.600,00", "VALOR R$ 9.600,00", or standalone "9.600,00"
  const patterns = [
    /(?:VALOR|TOTAL|PAGO|QUANTIA)\s*:?\s*(?:R\$\s*)?([\d\.]+\,\d{2})/gi,
    /R\$\s*([\d\.]+\,\d{2})/gi,
    /([\d\.]{2,}\,\d{2})/g
  ];

  patterns.forEach(regex => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        const rawNum = match[1].replace(/\./g, '').replace(',', '.');
        const num = parseFloat(rawNum);
        if (!isNaN(num) && num > 0 && num < 10000000) {
          values.push({ formatted: `R$ ${match[1]}`, number: num });
        }
      }
    }
  });

  return values;
}

export function AiChatAssistant({
  documents = [],
  books = [],
  categories = [],
  tags = [],
  onViewDocPdf,
  onViewBookPdf
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Olá! Sou o seu **Assistente de Inteligência Artificial** da sua biblioteca pessoal. Posso analisar todos os seus documentos (notas fiscais, recibos, contratos) e consultar seus livros em PDF.\n\nComo posso ajudar você hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Preset suggested prompts
  const quickPrompts = [
    { label: '👨‍💼 Valor pago ao corretor André', prompt: 'Qual valor pago ao corretor André?' },
    { label: '💰 Total gasto em notas e recibos', prompt: 'Qual o valor total acumulado das minhas faturas e recibos?' },
    { label: '📄 Resumo de Contratos', prompt: 'Liste os contratos cadastrados no sistema e seus detalhes.' },
    { label: '📖 Livros em leitura', prompt: 'Quais livros estou lendo e qual meu progresso de leitura?' }
  ];

  // Advanced Local RAG Search & Response Generator
  const generateAiResponse = (userQuery) => {
    const normQuery = normalize(userQuery);
    
    // Stopwords to filter out when searching for specific names or terms
    const stopwords = ['qual', 'quais', 'valor', 'pago', 'pagou', 'quanto', 'custou', 'gasto', 'foi', 'para', 'como', 'onde', 'qual', 'este', 'esta', 'meu', 'minha', 'sobre', 'que', 'dos', 'das', 'com'];
    const queryTokens = normQuery.split(/\s+/).filter(token => token.length > 2 && !stopwords.includes(token));

    // 1. Search across Documents (OCR text, title, filename)
    const matchingDocs = documents.filter(doc => {
      const normTitle = normalize(doc.title);
      const normFile = normalize(doc.fileName);
      const normOcr = normalize(doc.ocrText);

      // Check token matches
      return queryTokens.some(token => 
        normTitle.includes(token) || normFile.includes(token) || normOcr.includes(token)
      );
    });

    // 2. Search across Books
    const matchingBooks = books.filter(book => {
      const normTitle = normalize(book.title);
      const normAuthor = normalize(book.author);
      return queryTokens.some(token => normTitle.includes(token) || normAuthor.includes(token));
    });

    // If specific document matches were found!
    if (matchingDocs.length > 0) {
      let text = `Encontrei **${matchingDocs.length} documento(s)** relevante(s) para sua pergunta:\n\n`;

      matchingDocs.forEach((doc, idx) => {
        text += `📄 **${idx + 1}. ${doc.title || doc.fileName}**\n`;

        // Extract values from OCR text
        const vals = extractValuesFromText(doc.ocrText);
        if (vals.length > 0) {
          text += `• **Valor identificado**: ${vals[0].formatted}\n`;
        }

        // Snippet extraction around query token
        if (doc.ocrText) {
          const lines = doc.ocrText.split('\n');
          const relevantLines = lines.filter(line => {
            const normLine = normalize(line);
            return queryTokens.some(token => normLine.includes(token));
          }).slice(0, 4);

          if (relevantLines.length > 0) {
            text += `• **Trecho extraído do OCR**:\n`;
            relevantLines.forEach(l => {
              text += `> "${l.trim()}"\n`;
            });
          }
        }
        text += `\n`;
      });

      return { text, relevantDocs: matchingDocs };
    }

    // Special handler for global financial total (if query is purely about total money spent)
    if (normQuery.includes('total') || normQuery.includes('acumulado') || normQuery.includes('soma')) {
      let totalSum = 0;
      const docList = [];

      documents.forEach(doc => {
        const vals = extractValuesFromText(doc.ocrText);
        if (vals.length > 0) {
          totalSum += vals[0].number;
          docList.push({ doc, val: vals[0].formatted });
        }
      });

      const formattedTotal = totalSum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      let text = `Com base na leitura de OCR dos seus documentos, o valor total extraído é **${formattedTotal}**.\n\n`;
      if (docList.length > 0) {
        text += `**Documentos com valores:**\n`;
        docList.forEach(({ doc, val }) => {
          text += `• **${doc.title}**: ${val}\n`;
        });
      } else {
        text += `Não identifiquei valores numéricos explícitos nos **${documents.length} documentos** cadastrados.`;
      }

      return { text, relevantDocs: docList.map(d => d.doc) };
    }

    // Special handler for Contracts
    if (normQuery.includes('contrato')) {
      const contractCategory = categories.find(c => normalize(c.name).includes('contrato'));
      const contractDocs = documents.filter(d => 
        (contractCategory && d.categoryId === contractCategory.id) || 
        normalize(d.title).includes('contrato') || 
        normalize(d.ocrText).includes('contrato')
      );

      if (contractDocs.length > 0) {
        let text = `Encontrei **${contractDocs.length} contrato(s)** na sua biblioteca:\n\n`;
        contractDocs.forEach(d => {
          text += `• **${d.title}** (${d.createdDate || d.addedDate ? new Date(d.createdDate || d.addedDate).toLocaleDateString('pt-BR') : 'Sem data'})\n`;
        });
        return { text, relevantDocs: contractDocs };
      }
    }

    // Special handler for Books
    if (normQuery.includes('livro') || normQuery.includes('estante') || normQuery.includes('lendo')) {
      const reading = books.filter(b => b.readStatus === 'reading');
      let text = `Sua estante virtual possui **${books.length} obras**.\n\n`;
      if (reading.length > 0) {
        text += `📖 **Lendo atualmente (${reading.length})**:\n`;
        reading.forEach(b => {
          const prog = b.pageCount ? Math.round(((b.lastReadPage || 1) / b.pageCount) * 100) : 0;
          text += `• *${b.title}* de ${b.author || 'Autor desconhecido'} (Pág. ${b.lastReadPage || 1} de ${b.pageCount || '?'} • ${prog}%)\n`;
        });
      }
      return { text, relevantBooks: books.slice(0, 5) };
    }

    // General fallback search across all document text
    if (documents.length > 0) {
      let text = `Não encontrei referências exatas para **"${userQuery}"** nos seus documentos.\n\n`;
      text += `Você tem **${documents.length} documento(s)** cadastrado(s). Verifique se o documento desejado foi escaneado com OCR e se o texto extraído contém o termo pesquisado.`;
      return { text, relevantDocs: documents.slice(0, 3) };
    }

    return {
      text: `Nenhum documento cadastrado no sistema ainda. Adicione um PDF ou imagem no módulo Documentos para que a IA possa ler e responder suas perguntas!`
    };
  };

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const response = generateAiResponse(query);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        relevantDocs: response.relevantDocs,
        relevantBooks: response.relevantBooks,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-7rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              Assistente de IA da Biblioteca
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> IA Local RAG
              </span>
            </h2>
            <p className="text-xs text-slate-400">Busca semântica avançada em notas fiscais, recibos, contratos e livros PDF</p>
          </div>
        </div>

        <button
          onClick={() => setMessages(messages.slice(0, 1))}
          className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          title="Limpar conversa"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Limpar Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-xs border border-slate-700">
                <Bot className="w-5 h-5" />
              </div>
            )}

            <div className={`max-w-2xl space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {/* Citations & Relevant Document Cards Attached by AI */}
              {msg.relevantDocs && msg.relevantDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.relevantDocs.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => onViewDocPdf(doc)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{doc.title}</span>
                      <ExternalLink className="w-3 h-3 text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}

              {msg.relevantBooks && msg.relevantBooks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.relevantBooks.map(book => (
                    <button
                      key={book.id}
                      onClick={() => onViewBookPdf(book)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>{book.title}</span>
                      <ExternalLink className="w-3 h-3 text-teal-500" />
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-400 font-semibold block px-1">
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-slate-700">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-6 py-2.5 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.prompt)}
              className="px-3 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all flex-shrink-0 shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte à IA sobre faturas, contratos, exames ou livros em PDF..."
            className="flex-1 px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <span>Enviar</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
