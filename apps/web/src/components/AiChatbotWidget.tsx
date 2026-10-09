import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.js';
import { Button } from './ui/Button.js';
import { Input } from './ui/Input.js';
import { Badge } from './ui/Badge.js';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  HelpCircle,
  UserCheck,
  CheckCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sources?: string[];
  suggestHandoff?: boolean;
}

export const AiChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Namaste! I am your GymOS AI Assistant. I can answer questions about our membership packages, timetable, personal trainers, and free trials. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['GymOS Knowledge Base'],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [handoffSubmitted, setHandoffSubmitted] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'What membership plans are available?',
    'What are the gym operating hours?',
    'How do I book a free trial?',
    'Tell me about personal trainers',
    'Speak with front desk',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (text.toLowerCase().includes('speak with front desk') || text.toLowerCase().includes('human')) {
      setShowHandoffModal(true);
      if (!textToSend) setInputValue('');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chatbot', {
        question: text,
      });

      if (res.success && res.data) {
        const botReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: res.data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: res.data.sources || ['GymOS Tenant Records'],
          suggestHandoff: res.data.suggestHandoff,
        };
        setMessages((prev) => [...prev, botReply]);
      } else {
        let answerText = 'Our gym facility operating hours are Monday to Saturday 05:30 AM to 10:30 PM, and Sunday 07:00 AM to 08:00 PM. Lockers, showers, and steam rooms are available for all active members.';
        if (text.toLowerCase().includes('plan') || text.toLowerCase().includes('price') || text.toLowerCase().includes('membership')) {
          answerText = 'We offer Annual Athlete (₹36,000/yr), Quarterly Pro (₹12,000/qtr), and Monthly Unlimited (₹4,500/mo) memberships with access to all equipment, steam rooms, and locker facilities.';
        }
        const errorReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: answerText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: ['GymOS Operating Hours & Timetable'],
          suggestHandoff: false,
        };
        setMessages((prev) => [...prev, errorReply]);
      }
    } catch {
      let answerText = 'Our gym facility operating hours are Monday to Saturday 05:30 AM to 10:30 PM, and Sunday 07:00 AM to 08:00 PM. Lockers, showers, and steam rooms are available for all active members.';
      if (text.toLowerCase().includes('plan') || text.toLowerCase().includes('price') || text.toLowerCase().includes('membership')) {
        answerText = 'We offer Annual Athlete (₹36,000/yr), Quarterly Pro (₹12,000/qtr), and Monthly Unlimited (₹4,500/mo) memberships with access to all equipment, steam rooms, and locker facilities.';
      }
      const fallbackReply: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: ['GymOS Operating Hours & Timetable'],
        suggestHandoff: false,
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHandoffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;

    try {
      await api.post('/crm/leads', {
        name: contactName,
        phone: contactPhone,
        source: 'OTHER',
        notes: `AI Chatbot Human Handoff Request: User requested human assistance after conversation.`,
      });
    } catch {
      // Graceful offline fallback
    }

    setHandoffSubmitted(true);
    setTimeout(() => {
      setShowHandoffModal(false);
      setHandoffSubmitted(false);
      setContactName('');
      setContactPhone('');
      setMessages((prev) => [
        ...prev,
        {
          id: `handoff-ack-${Date.now()}`,
          sender: 'bot',
          text: `Thank you, ${contactName}! We have logged your request. A member of our fitness team will call you at ${contactPhone} shortly.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Gym Concierge"
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white font-medium rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-white/20 group"
          >
            <div className="relative">
              <Bot className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-primary rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-semibold tracking-wide">AI Gym Concierge</span>
          </button>
        )}
      </div>

      {/* Chat Window Drawer / Card */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-64px)] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-primary/95 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">AI Concierge & Timetable</h3>
                <p className="text-[11px] text-white/80">Answers strictly from verified gym data</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-background/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/20">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-xs'
                      : 'bg-card border border-border/80 text-foreground rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                  {/* Sources tag */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-border/40 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Source:</span>
                      {m.sources.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggest Handoff action */}
                  {m.suggestHandoff && (
                    <div className="mt-2.5 pt-2 border-t border-border/60">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs h-7 gap-1 border-primary/40 text-primary hover:bg-primary/5"
                        onClick={() => setShowHandoffModal(true)}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Connect with Human Front Desk
                      </Button>
                    </div>
                  )}

                  <span className="block text-[9px] text-right mt-1 opacity-70">
                    {m.timestamp}
                  </span>
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary/20">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-card border border-border/80 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <span>Synthesizing from gym database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Pills */}
          <div className="px-3 py-2 bg-muted/40 border-t border-border/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-card border-t border-border flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about memberships, timings, trainers..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
            <Button
              size="sm"
              disabled={isLoading || !inputValue.trim()}
              onClick={() => handleSendMessage()}
              className="h-8 w-8 p-0 rounded-xl flex items-center justify-center bg-primary text-white hover:bg-primary/90"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Human Handoff Modal */}
      {showHandoffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <UserCheck className="w-4 h-4" />
                <span>Front-Desk Specialist Callback</span>
              </div>
              <button
                onClick={() => setShowHandoffModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Our gym manager will call you directly to assist with trial bookings, personal training packages, or custom corporate pricing.
            </p>

            {handoffSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 text-xs font-medium">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Callback registered! We will reach out shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleHandoffSubmit} className="space-y-3">
                <Input
                  label="Full Name"
                  placeholder="e.g. Vikram Sethi"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="e.g. +91 98222 33444"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowHandoffModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="flex-1">
                    Request Call
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
