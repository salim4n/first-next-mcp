"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { extractAndRemoveChartJsonBlocks, isChartPayload, type AssistantRichContent as ChartContent } from '@/lib/chat/chart-json';

// Debug flag to log full LLM responses in browser console
const DEBUG_LOG = true;

// Render assistant text as sanitized HTML
function sanitizeHtml(input: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    // remove dangerous tags
    doc.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(el => el.remove());
    // remove dangerous attributes (on* handlers, javascript: URLs)
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode as Element | null;
    while (node) {
      Array.from(node.attributes).forEach(attr => {
        if (attr.name.toLowerCase().startsWith('on')) node!.removeAttribute(attr.name);
        if (/^javascript:/i.test(attr.value)) node!.setAttribute(attr.name, '#');
      });
      node = walker.nextNode() as Element | null;
    }
    return doc.body.innerHTML;
  } catch {
    return input;
  }
}

function toHtml(content: string): string {
  const hasTags = /<[^>]+>/.test(content);
  if (hasTags) return sanitizeHtml(content);
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br/>');
}

// Lazy-load chart components to keep initial bundle smaller (with typed props)
type PieChartComponentProps = { data: { labels: string[]; values: number[]; colors?: string[] }; title?: string; description?: string };
type BarChartComponentProps = { data: { labels: string[]; values: number[]; label?: string; color?: string }; title?: string; description?: string; orientation?: 'vertical' | 'horizontal' };
type MetricsCardComponentProps = { title?: string; description?: string; metrics: Array<{ label: string; value: string | number; change?: { value: number; type: 'increase' | 'decrease' }; icon?: string }>; };

const PieChart = (dynamic(() => import('./charts/PieChart'), { ssr: false }) as unknown) as ComponentType<PieChartComponentProps>;
const BarChart = (dynamic(() => import('./charts/BarChart'), { ssr: false }) as unknown) as ComponentType<BarChartComponentProps>;
const MetricsCard = (dynamic(() => import('./charts/MetricsCard'), { ssr: false }) as unknown) as ComponentType<MetricsCardComponentProps>;

type ChartPiePayload = {
  type: 'pie-chart';
  data: { labels: string[]; values: number[]; colors?: string[] };
  title?: string;
  description?: string;
};

type ChartBarPayload = {
  type: 'bar-chart';
  data: { labels: string[]; values: number[]; label?: string; color?: string };
  title?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
};

type MetricsPayload = {
  type: 'metrics-card';
  metrics: Array<{
    label: string;
    value: string | number;
    change?: { value: number; type: 'increase' | 'decrease' };
    icon?: string;
  }>;
  title?: string;
  description?: string;
};

type AssistantRichContent = ChartPiePayload | ChartBarPayload | MetricsPayload; // local for prop typing; use ChartContent for message payloads

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string | ChartContent;
  timestamp: Date;
};

export default function SimpleChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bonjour ! Je suis votre analyste de données MCP. Je peux vous aider à analyser vos données d\'usage, identifier des tendances et fournir des insights sur les performances de vos outils. Essayez de me demander:\n\n• "Comment fonctionnent mes outils aujourd\'hui ?"\n• "Montre-moi les patterns d\'erreur"\n• "Quels outils sont les plus lents ?"\n• "Analyse les tendances d\'usage"',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage.content }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      let fullAssistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (DEBUG_LOG) console.log('[LLM SSE data]', data);
              if (data.type === 'text-delta' && data.delta) {
                // Append text
                let newContent = '';
                setMessages(prev => prev.map(msg => {
                  if (msg.id === assistantMessage.id && typeof msg.content === 'string') {
                    newContent = (msg.content as string) + data.delta;
                    return { ...msg, content: newContent };
                  }
                  return msg;
                }));
                fullAssistantText = newContent;
                if (DEBUG_LOG) console.log('[LLM text-delta]', data.delta);
                // Try to extract JSON chart blocks from accumulated assistant text and render them
                if (newContent) {
                  const extractions = extractAndRemoveChartJsonBlocks(newContent);
                  if (extractions) {
                    const { cleanedText, charts } = extractions;
                    if (charts.length > 0) {
                      // Update cleaned text
                      setMessages(prev => prev.map(msg => {
                        if (msg.id === assistantMessage.id && typeof msg.content === 'string') {
                          return { ...msg, content: cleanedText };
                        }
                        return msg;
                      }));
                      // Append chart messages
                      const chartsToAppend: Message[] = [];
                      chartsToAppend.push(
                        ...extractions.charts.map((payload: ChartContent) => ({
                          id: `assistant-chart-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                          role: 'assistant' as const,
                          content: payload,
                          timestamp: new Date()
                        }))
                      );
                      setMessages(prev => [...prev, ...chartsToAppend]);
                      if (DEBUG_LOG) console.log('[LLM charts extracted mid-stream]', chartsToAppend);
                    }
                  }
                }
              }
              // Handle tool results that return chart payloads
              if (data.type === 'tool-result' || data.type === 'tool-output-available') {
                let result: unknown = data.result ?? data.toolResult ?? data.output ?? null;
                if (typeof result === 'string') {
                  try { result = JSON.parse(result); } catch { /* ignore */ }
                }
                if (DEBUG_LOG) console.log(`[LLM ${data.type}] raw`, result);
                if (isChartPayload(result)) {
                  const chartMessage: Message = {
                    id: `assistant-chart-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    role: 'assistant' as const,
                    content: result,
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, chartMessage]);
                  if (DEBUG_LOG) console.log('[LLM chart appended]', chartMessage);
                }
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }
      if (DEBUG_LOG) console.log('[LLM full assistant text]', fullAssistantText);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Désolé, j\'ai rencontré une erreur lors du traitement de votre requête. Veuillez réessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const suggestionPrompts = [
    `Génère un camembert des appels par outil pour aujourd'hui (${today})`,
    `Crée un graphique en barres des durées moyennes par outil (${today})`,
    `Affiche une carte de métriques clés (total, succès, durée moyenne) pour ${today}`,
    `Montre la répartition succès/échecs sous forme de camembert (${today})`,
    `Barres horizontales: distribution horaire des appels (${today})`
  ];

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
        aria-label="Open chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {isOpen && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            ×
          </span>
        )}
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-4 z-40 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <div>
                <span className="font-semibold text-lg">MCP Data Analyst</span>
                <div className="text-blue-100 text-sm">Assistant d&apos;analyse des données</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-none">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-4 text-base ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className={`${message.role === 'assistant' ? 'prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900 prose-strong:text-gray-900' : ''}`}>
                    {message.role === 'assistant' ? (
                      typeof message.content === 'string' ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: toHtml(message.content as string) }}
                        />
                      ) : (
                        <div className="not-prose max-w-none">
                          {message.content.type === 'pie-chart' && (
                            <PieChart data={message.content.data} title={message.content.title} description={message.content.description} />
                          )}
                          {message.content.type === 'bar-chart' && (
                            <BarChart data={message.content.data} title={message.content.title} description={message.content.description} orientation={message.content.orientation} />
                          )}
                          {message.content.type === 'metrics-card' && (
                            <MetricsCard title={message.content.title} description={message.content.description} metrics={message.content.metrics} />
                          )}
                        </div>
                      )
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content as string}</div>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 text-base">
                  <div className="flex space-x-2 items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-gray-500 ml-2">L&apos;agent analyse les données...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (always visible) */}
          <div className="px-6 pb-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-3 pt-4">Suggestions rapides:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {suggestionPrompts.slice(0, 6).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(prompt)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors text-left disabled:opacity-60"
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question sur les données MCP..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Envoyer</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}