import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type Message = Tables<'messages'>;

export function useMessages(bookingId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', bookingId],
    enabled: !!bookingId,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          qc.setQueryData<Message[]>(['messages', bookingId], (prev) => {
            const next = payload.new as Message;
            if (prev?.some((m) => m.id === next.id)) return prev;
            return [...(prev ?? []), next];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, qc]);

  return query;
}

export function useSendMessage(bookingId: string) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase
        .from('messages')
        .insert({ booking_id: bookingId, sender_id: userId!, body });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', bookingId] }),
  });
}
