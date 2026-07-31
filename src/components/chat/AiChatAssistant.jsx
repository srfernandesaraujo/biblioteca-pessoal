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
  MessageSquare,
  Key,
  Settings,
  X,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { getStoredGeminiApiKey, saveGeminiApiKey, queryGeminiRAG } from '../../services/geminiService';

// Helper to remove accents and normalize text
function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Helper to extract financial values from text
function extractValuesFromText(text) {
  if (!text) return [];
  const values = [];
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
  const [geminiKey, setGeminiKey] = useState(getStoredGeminiApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState(geminiKey);

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

  const handleSaveApiKey = () => {
    saveGeminiApiKey(tempKeyInput);
    setGeminiKey(tempKeyInput.trim());
    setIsKeyModalOpen(false);
  };

  // Preset suggested prompts
  const quickPrompts = [
    { label: '👨‍💼 Valor pago ao corretor André', prompt: 'Qual valor pago ao corretor André?' },
    { label: '💰 Total gasto em notas e recibos', prompt: 'Qual o valor total acumulado das minhas faturas e recibos?' },
    { label: '📄 Resumo de Contratos', prompt: 'Liste os contratos cadastrados no sistema e seus detalhes.' },
    { label: '📖 Livros em leitura', prompt: 'Quais livros estou lendo e qual meu progresso de leitura?' }
  ];

  // Local RAG Retrieval (Filters matching documents and books to attach as context)
  const getRelevantContext = (userQuery) => {
    const normQuery = normalize(userQuery);
    const stopwords = ['qual', 'quais', 'valor', 'pago', 'pagou', 'quanto', 'custou', 'gasto', 'foi', 'para', 'como', 'onde', 'este', 'esta', 'meu', 'minha', 'sobre', 'que', 'dos', 'das', 'com'];
    const queryTokens = normQuery.split(/\s+/).filter(token => token.length > 2 && !stopwords.includes(token));

    const matchedDocs = documents.filter(doc => {
      const normTitle = normalize(doc.title);
      const normFile = normalize(doc.fileName);
      const normOcr = normalize(doc.ocrText);
      return queryTokens.some(token => normTitle.includes(token) || normFile.includes(token) || normOcr.includes(token));
    });

    const matchedBooks = books.filter(book => {
      const normTitle = normalize(book.title);
      const normAuthor = normalize(book.author);
      return queryTokens.some(token => normTitle.includes(token) || normAuthor.includes(token));
    });

    return {
      docs: matchedDocs.length > 0 ? matchedDocs : documents.slice(0, 5),
      books: matchedBooks.length > 0 ? matchedBooks : books.slice(0, 3)
    };
  };

  // Local Fallback RAG Engine
  const generateLocalResponse = (userQuery, matchedDocs, matchedBooks) => {
    const normQuery = normalize(userQuery);

    if (matchedDocs.length > 0) {
      let text = `Encontrei **${matchedDocs.length} documento(s)** relevante(s) para sua pergunta:\n\n`;

      matchedDocs.forEach((doc, idx) => {
        text += `📄 **${idx + 1}. ${doc.title || doc.fileName}**\n`;

        const vals = extractValuesFromText(doc.ocrText);
        if (vals.length > 0) {
          text += `• **Valor identificado**: ${vals[0].formatted}\n`;
        }

        if (doc.ocrText) {
          const lines = doc.ocrText.split('\n');
          const relevantLines = lines.filter(line => {
            const normLine = normalize(line);
            return normLine.length > 3 && (normQuery.includes(normLine) || normLine.includes('valor') || normLine.includes('pago') || normLine.includes('nome'));
          }).slice(0, 4);

          if (relevantLines.length > 0) {
            text += `• **Trecho do OCR**:\n`;
            relevantLines.forEach(l => {
              text += `> "${l.trim()}"\n`;
            });
          }
        }
        text += `\n`;
      });

      return text;
    }

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
      }
      return text;
    }

    return `Não encontrei referências exatas para **"${userQuery}"** nos seus **${documents.length} documentos** cadastrados.`;
  };

  const handleSendMessage = async (textToSend) => {
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

    const { docs, books: relBooks } = getRelevantContext(query);

    try {
      let answerText = '';
      let isGeminiPowered = false;

      if (geminiKey.trim()) {
        try {
          answerText = await queryGeminiRAG(query, docs, relBooks, geminiKey);
          isGeminiPowered = true;
        } catch (geminiError) {
          console.warn('Gemini API Error, falling back to Local RAG:', geminiError);
          answerText = generateLocalResponse(query, docs, relBooks);
        }
      } else {
        answerText = generateLocalResponse(query, docs, relBooks);
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: answerText,
        isGemini: isGeminiPowered,
        relevantDocs: docs,
        relevantBooks: relBooks,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
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
              {geminiKey ? (
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-400/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-300" /> Google Gemini AI
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> IA Local RAG
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">Análise de notas fiscais, recibos, contratos e livros em PDF</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gemini API Key Button */}
          <button
            onClick={() => {
              setTempKeyInput(geminiKey);
              setIsKeyModalOpen(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              geminiKey
                ? 'bg-purple-900/60 text-purple-200 border-purple-700/60 hover:bg-purple-900'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{geminiKey ? 'Chave Gemini Conectada' : 'Inserir API Key Gemini'}</span>
          </button>

          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            className="text-xs text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Limpar conversa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border ${
                msg.isGemini
                  ? 'bg-gradient-to-tr from-purple-900 to-blue-900 text-purple-300 border-purple-700'
                  : 'bg-slate-900 text-emerald-400 border-slate-700'
              }`}>
                <Bot className="w-5 h-5" />
              </div>
            )}

            <div className={`max-w-2xl space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.isGemini && (
                <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 inline-flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-600" /> Resposta gerada pelo Google Gemini 1.5 Flash
                </span>
              )}

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
            placeholder="Pergunte ao Gemini sobre suas faturas, recibos, contratos ou livros em PDF..."
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

      {/* Gemini API Key Configuration Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Chave da API do Google Gemini</h3>
              </div>
              <button onClick={() => setIsKeyModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Insira sua API Key gratuita do Google Gemini obtida no **Google AI Studio**. Quando cadastrada, a IA do Gemini responderá suas perguntas com compreensão profunda em linguagem natural!
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gemini API Key</label>
              <input
                type="password"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-amber-400">💡 Como pegar uma chave grátis no Google AI Studio:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-400 underline">aistudio.google.com/app/apikey</a></li>
                <li>Clique em <strong>Get API Key</strong> (Criar chave de API)</li>
                <li>Copie a chave criada e cole aqui acima!</li>
              </ol>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {geminiKey && (
                <button
                  onClick={() => {
                    saveGeminiApiKey('');
                    setGeminiKey('');
                    setTempKeyInput('');
                    setIsKeyModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 mr-auto"
                >
                  Remover Chave
                </button>
              )}
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-md"
              >
                Salvar Chave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
