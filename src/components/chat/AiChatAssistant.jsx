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
    { label: '💰 Total gasto em notas fiscais', prompt: 'Qual o valor total acumulado das minhas notas fiscais e recibos?' },
    { label: '📄 Resumo de Contratos', prompt: 'Liste os contratos cadastrados no sistema e seus detalhes.' },
    { label: '📖 Livros em leitura', prompt: 'Quais livros estou lendo e qual meu progresso de leitura?' },
    { label: '🏥 Documentos de Saúde', prompt: 'Exiba meus exames e documentos da categoria Saúde.' }
  ];

  // AI Knowledge Search & Response Generator
  const generateAiResponse = (query) => {
    const q = query.toLowerCase();
    
    // 1. Query about financial total / invoices
    if (q.includes('gastos') || q.includes('valor') || q.includes('fatura') || q.includes('nota') || q.includes('recibo') || q.includes('dinheiro') || q.includes('total')) {
      let totalValue = 0;
      const nfDocs = [];

      documents.forEach(doc => {
        if (doc.ocrText) {
          const match = doc.ocrText.match(/(?:R\$\s*|Total\s*:?\s*R\$\s*|VALOR\s*:?\s*R\$\s*)([\d\.\,]+)/i);
          if (match && match[1]) {
            const rawNum = match[1].replace(/\./g, '').replace(',', '.');
            const val = parseFloat(rawNum);
            if (!isNaN(val) && val < 1000000) {
              totalValue += val;
              nfDocs.push({ doc, val });
            }
          }
        }
      });

      const formattedTotal = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      
      let text = `Com base na leitura OCR dos seus documentos, o valor total extraído das suas faturas e recibos é **${formattedTotal}**.\n\n`;
      if (nfDocs.length > 0) {
        text += `**Documentos identificados com valores:**\n`;
        nfDocs.slice(0, 5).forEach(({ doc, val }) => {
          text += `• **${doc.title}**: ${val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
        });
      } else {
        text += `Você tem **${documents.length} documentos** cadastrados no sistema.`;
      }

      return { text, relevantDocs: nfDocs.map(n => n.doc) };
    }

    // 2. Query about Contracts
    if (q.includes('contrato') || q.includes('contratos') || q.includes('acordo')) {
      const contractCategory = categories.find(c => c.name.toLowerCase().includes('contrato'));
      const contractDocs = documents.filter(d => 
        (contractCategory && d.categoryId === contractCategory.id) || 
        d.title?.toLowerCase().includes('contrato') || 
        d.ocrText?.toLowerCase().includes('contrato')
      );

      if (contractDocs.length === 0) {
        return { text: `Não encontrei contratos cadastrados no momento. Você possui **${documents.length} documentos totais** na biblioteca.` };
      }

      let text = `Encontrei **${contractDocs.length} contrato(s)** na sua biblioteca:\n\n`;
      contractDocs.forEach(d => {
        text += `• **${d.title}** (${d.createdDate || d.addedDate ? new Date(d.createdDate || d.addedDate).toLocaleDateString('pt-BR') : 'Sem data'})\n`;
      });
      return { text, relevantDocs: contractDocs };
    }

    // 3. Query about Books & Reading Progress
    if (q.includes('livro') || q.includes('livros') || q.includes('lendo') || q.includes('estante') || q.includes('leitura') || q.includes('autor')) {
      const reading = books.filter(b => b.readStatus === 'reading');
      const read = books.filter(b => b.readStatus === 'read');
      const unread = books.filter(b => b.readStatus === 'unread');

      let text = `Sua estante virtual possui **${books.length} obras** cadastrais:\n\n`;
      text += `• 📖 **Lendo atualmente (${reading.length})**:\n`;
      if (reading.length > 0) {
        reading.forEach(b => {
          const prog = b.pageCount ? Math.round(((b.lastReadPage || 1) / b.pageCount) * 100) : 0;
          text += `  - *${b.title}* de ${b.author || 'Autor desconhecido'} (Pág. ${b.lastReadPage || 1} de ${b.pageCount || '?'} • ${prog}%)\n`;
        });
      } else {
        text += `  - Nenhum livro marcado como "Lendo".\n`;
      }

      text += `\n• ✅ **Concluídos**: ${read.length} livro(s)\n`;
      text += `• 📌 **Não Lidos**: ${unread.length} livro(s)\n`;

      return { text, relevantBooks: reading.length > 0 ? reading : books.slice(0, 3) };
    }

    // 4. Query about Health or specific categories
    if (q.includes('saúde') || q.includes('exame') || q.includes('médico') || q.includes('laudo')) {
      const saudeCategory = categories.find(c => c.name.toLowerCase().includes('saúde'));
      const saudeDocs = documents.filter(d => 
        (saudeCategory && d.categoryId === saudeCategory.id) || 
        d.title?.toLowerCase().includes('exame') || 
        d.ocrText?.toLowerCase().includes('exame') ||
        d.ocrText?.toLowerCase().includes('paciente')
      );

      if (saudeDocs.length === 0) {
        return { text: `Não encontrei documentos na categoria Saúde/Exames.` };
      }

      let text = `Encontrei **${saudeDocs.length} documento(s) de Saúde**:\n\n`;
      saudeDocs.forEach(d => {
        text += `• **${d.title}**\n`;
      });
      return { text, relevantDocs: saudeDocs };
    }

    // 5. Search specific query terms
    const matchedDocs = documents.filter(d => 
      d.title?.toLowerCase().includes(q) || 
      d.ocrText?.toLowerCase().includes(q)
    );

    const matchedBooks = books.filter(b => 
      b.title?.toLowerCase().includes(q) || 
      b.author?.toLowerCase().includes(q)
    );

    if (matchedDocs.length > 0 || matchedBooks.length > 0) {
      let text = `Analisei sua biblioteca para o termo **"${query}"**:\n\n`;
      if (matchedDocs.length > 0) {
        text += `📄 **Documentos encontrados (${matchedDocs.length}):**\n`;
        matchedDocs.slice(0, 4).forEach(d => {
          text += `• **${d.title}**\n`;
        });
      }
      if (matchedBooks.length > 0) {
        text += `\n📚 **Livros encontrados (${matchedBooks.length}):**\n`;
        matchedBooks.slice(0, 4).forEach(b => {
          text += `• **${b.title}** (${b.author})\n`;
        });
      }
      return { text, relevantDocs: matchedDocs, relevantBooks: matchedBooks };
    }

    // Default Fallback Response
    return {
      text: `Entendi sua pergunta sobre **"${query}"**. Atualmente sua biblioteca conta com **${documents.length} documentos** com OCR indexado e **${books.length} livros** na estante.\n\nPosso ajudar você a buscar faturas, contratos, relatórios de saúde ou informações sobre o progresso dos seus livros!`
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
    }, 700);
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
            <p className="text-xs text-slate-400">Pergunte sobre seus documentos, recibos, faturas e livros em PDF</p>
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
