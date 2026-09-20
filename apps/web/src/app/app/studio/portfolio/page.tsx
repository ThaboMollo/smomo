'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { useMe } from '@/lib/use-me';

export default function Portfolio() {
  const me = useMe();
  const qc = useQueryClient();
  const practitionerId = me.data?.practitioner?.id;
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string>();

  const items = useQuery({
    queryKey: ['portfolio', practitionerId],
    queryFn: () => api.practitioner.listPortfolio(practitionerId!),
    enabled: !!practitionerId,
  });

  const add = useMutation({
    mutationFn: async (file: File) => {
      const imageUrl = await uploadImage('portfolio', file);
      await api.practitioner.addPortfolioItem({ imageUrl, caption: caption.trim() || undefined });
    },
    onSuccess: () => {
      setCaption('');
      qc.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (e: any) => setError(e?.message ?? 'Upload failed'),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.practitioner.deletePortfolioItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  if (me.isLoading) return <p className="text-text-muted">Loading…</p>;
  if (!practitionerId) return <p className="text-text-muted">Set up your studio first.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl">Portfolio</h1>

      <Card className="space-y-3">
        <p className="font-medium">Add a photo</p>
        <input placeholder="Caption (optional)" className="w-full rounded border border-border bg-card px-3 py-2 text-sm" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <input
          type="file"
          accept="image/*"
          disabled={add.isPending}
          onChange={(e) => {
            setError(undefined);
            const f = e.target.files?.[0];
            if (f) add.mutate(f);
            e.target.value = '';
          }}
          className="text-sm"
        />
        {add.isPending ? <p className="text-sm text-text-muted">Uploading…</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(items.data ?? []).map((it) => (
          // eslint-disable-next-line @next/next/no-img-element
          <div key={it.id} className="group relative overflow-hidden rounded border border-border">
            <img src={it.image_url} alt={it.caption ?? 'Portfolio item'} className="aspect-square w-full object-cover" />
            <button
              onClick={() => del.mutate(it.id)}
              className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      {items.data && items.data.length === 0 ? <p className="text-text-muted">No photos yet.</p> : null}
    </div>
  );
}
