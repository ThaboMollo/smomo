'use client';

import { faHand } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';

import type { Message } from '@smomo/shared';

import { Icon } from '@/components/Icon';
import { createClient } from '@/lib/supabase/client';

export function ChatPanel({ bookingId, userId }: { bookingId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active && data) setMessages(data as Message[]);
      });

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === next.id) ? prev : [...prev, next]));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    await supabase.from('messages').insert({ booking_id: bookingId, sender_id: userId, body });
  };

  return (
    <div className="rounded border border-border bg-card">
      <div className="max-h-80 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="inline-flex w-full items-center justify-center gap-1.5 text-center text-sm text-text-faint">
            Say hi <Icon icon={faHand} size={14} className="text-star" /> — coordinate your booking here.
          </p>
        ) : null}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`max-w-[80%] rounded px-3 py-2 text-sm ${mine ? 'ml-auto border border-primary-300 bg-primary-100 text-text' : 'border border-border bg-card'}`}
            >
              {m.body}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Message…"
          className="flex-1 rounded border border-border bg-card px-3 py-2 text-sm"
        />
        <button onClick={send} className="rounded border border-primary hover:bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
          Send
        </button>
      </div>
    </div>
  );
}
