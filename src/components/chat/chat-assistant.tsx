'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';

const SUGGESTIONS = [
  'What workshops are coming up?',
  'How many seats are left in the hackathon?',
  'Register me for the React workshop',
];

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append, stop } =
    useChat({ api: '/api/chat' });

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      setUnread(false);
    }
  }, [messages, isLoading, open]);

  function toggle() {
    setOpen((o) => !o);
    if (!open) setUnread(false);
  }

  return (
    <>
      
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={open}
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center
                   rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-white
                   shadow-neon transition duration-200 hover:scale-105 hover:shadow-neon-lg
                   active:scale-95"
      >
        {open ? (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        ) : (
          <span className="relative text-2xl" aria-hidden>
            💬
            {unread && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-lime-300 ring-2 ring-void-950 shadow-neon-sm" />
            )}
          </span>
        )}
        {!open && (
          <span
            className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-cyan-400/30 blur-md opacity-0 transition group-hover:opacity-100"
            aria-hidden
          />
        )}
      </button>

      {open && (
        <section
          aria-label="AI chat assistant"
          className="glass-strong neon-ring fixed inset-x-3 bottom-24 z-50 flex h-[min(72vh,560px)]
                     w-auto flex-col overflow-hidden rounded-2xl shadow-glass
                     sm:inset-x-auto sm:right-6 sm:w-[400px]"
        >
          
          <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-cyan-500/15 via-indigo-500/10 to-fuchsia-500/15 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/15 text-lg backdrop-blur"
                aria-hidden
              >
                🤖
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-white">Event Assistant</p>
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-300/80">
                  {isLoading && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-neon-sm" />
                  )}
                  {isLoading ? 'thinking' : 'online · ready'}
                </p>
              </div>
              {isLoading && (
                <button
                  type="button"
                  onClick={stop}
                  className="rounded-lg border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  Stop
                </button>
              )}
            </div>
            <div
              className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
              aria-hidden
            />
          </div>

          
          <div
            ref={scrollRef}
            className="nice-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="space-y-3 pt-1">
                <p className="text-sm leading-relaxed text-slate-400">
                  Ask me to find events or register you. Try:
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => append({ role: 'user', content: s })}
                    className="block w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5
                               text-left text-sm text-slate-200 transition hover:border-cyan-400/40
                               hover:bg-cyan-400/10 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5
                              text-sm leading-relaxed ${
                                m.role === 'user'
                                  ? 'rounded-br-md border border-cyan-400/30 bg-cyan-400/15 text-white'
                                  : 'rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-200'
                              }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3">
                  <span className="inline-flex gap-1" aria-label="Assistant is typing">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-200"
              >
                {error.message}
              </p>
            )}
          </div>

          
          <form onSubmit={handleSubmit} className="border-t border-white/10 bg-void-950/50 p-3">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask about events or to register…"
                aria-label="Message the event assistant"
                className="field nice-scroll max-h-24 flex-1 resize-none"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="btn-primary btn-md shrink-0"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-center font-mono text-[10px] leading-snug text-slate-500">
              AI can make mistakes — verify event details on the event page
            </p>
          </form>
        </section>
      )}
    </>
  );
}