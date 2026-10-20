import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  TrendingUp,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsApi } from '../../services/analyticsApi';
export function AIAssistantDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your CreatorOS Intelligence Assistant. Ask me about revenue forecasts, campaign ROI, creator performance, or at-risk items.',
      visualization: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const chatEndRef = useRef(null);
  const suggestedPrompts = [
    'Which campaigns are at risk or overdue?',
    'Show revenue forecast for next month',
    'Who are our top performing creators?',
    'Show overall organization revenue & ROI',
  ];
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);
  if (!isOpen) return null;
  const handleSend = async (questionText) => {
    const query = questionText || input;
    if (!query.trim()) return;
    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);
    try {
      const res = await analyticsApi.chatWithAI(query, conversationId);
      if (res.data?.conversationId) setConversationId(res.data.conversationId);
      const assistantMsg = {
        role: 'assistant',
        content: res.data?.answer || 'I evaluated your query against organizational data.',
        toolUsed: res.data?.toolUsed,
        visualization: res.data?.visualization,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving analytics for your query.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-card border-l border-line h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 border-b border-line bg-gradient-to-r from-[#2b5341] to-[#1e3b2e] text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-white/10 text-amber-300">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-tight">CreatorOS AI Assistant</h2>
              <p className="text-[10px] text-white/80">Tool-based Natural Language Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${msg.role === 'user' ? 'bg-emerald-700 text-white' : 'bg-canvas text-ink border border-line'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-emerald-700 dark:text-emerald-400" />}
              </div>
              <div className={`space-y-2 max-w-[82%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#2b5341] text-white rounded-tr-none'
                      : 'bg-canvas border border-line text-ink rounded-tl-none shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.visualization && (
                  <div className="p-3 rounded-xl border border-line bg-card space-y-2 text-left shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center gap-1">
                      <TrendingUp size={11} className="text-emerald-600" /> Data Payload Result
                    </span>
                    {msg.visualization.type === 'forecast' && (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span>Expected Revenue:</span>
                          <span className="text-emerald-600">${msg.visualization.data.forecastRevenue?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted text-[11px]">
                          <span>Best Case:</span>
                          <span>${msg.visualization.data.bestCaseRevenue?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-muted text-[11px]">
                          <span>Worst Case:</span>
                          <span>${msg.visualization.data.worstCaseRevenue?.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    {msg.visualization.type === 'risk_list' && (
                      <div className="space-y-1.5">
                        {msg.visualization.data.slice(0, 3).map((r, rIdx) => (
                          <div key={rIdx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-canvas">
                            <span className="font-medium text-ink truncate max-w-[160px]">{r.targetName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.riskLevel === 'High' || r.riskLevel === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-700'}`}>
                              {r.riskLevel}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-muted text-xs p-2">
              <Loader2 size={14} className="animate-spin text-emerald-600" />
              <span>Analyzing organizational database via tool engine...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="px-4 py-2 bg-canvas/50 border-t border-line space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center gap-1">
            <HelpCircle size={10} /> Suggested Questions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-card hover:bg-line border border-line text-ink transition-colors text-left truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-line bg-card flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask CreatorOS AI..."
            className="input text-xs flex-1 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary p-2 shrink-0 disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
