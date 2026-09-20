'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { CATEGORIES, categoryLabel, formatZar, type ServiceCategory } from '@smomo/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';

const inputCls = 'w-full rounded border border-border bg-card px-3 py-2 text-sm';

export default function Services() {
  const me = useMe();
  const qc = useQueryClient();
  const practitionerId = me.data?.practitioner?.id;

  const [category, setCategory] = useState<ServiceCategory>('hairdresser');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  const services = useQuery({
    queryKey: ['services', practitionerId],
    queryFn: () => api.practitioner.listServices(practitionerId!),
    enabled: !!practitionerId,
  });

  const reset = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setDuration('');
  };

  const save = useMutation({
    mutationFn: () =>
      api.practitioner.saveService({
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        indicativePrice: price ? Number(price) : null,
        durationMinutes: duration ? Number(duration) : null,
      }),
    onSuccess: () => {
      reset();
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.practitioner.deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  if (me.isLoading) return <p className="text-text-muted">Loading…</p>;
  if (!practitionerId) return <p className="text-text-muted">Set up your studio first.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl">Services</h1>

      <Card className="space-y-3">
        <p className="font-medium">Add a service</p>
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              <span className="inline-flex items-center gap-1.5"><CategoryIcon category={c.value} size={14} />{c.label}</span>
            </option>
          ))}
        </select>
        <input placeholder="Title (e.g. Box braids)" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Description (optional)" className={`${inputCls} min-h-16`} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex gap-2">
          <input placeholder="From price (R)" inputMode="numeric" className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} />
          <input placeholder="Duration (min)" inputMode="numeric" className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <button onClick={() => save.mutate()} disabled={title.trim().length < 2 || save.isPending} className="rounded border border-primary hover:bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700 disabled:opacity-50">
          {save.isPending ? 'Saving…' : 'Add service'}
        </button>
      </Card>

      <div className="space-y-3">
        {(services.data ?? []).map((s) => (
          <Card key={s.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-text-muted">
                {categoryLabel(s.category)}
                {s.indicative_price_zar != null ? ` · from ${formatZar(s.indicative_price_zar)}` : ''}
                {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
              </p>
            </div>
            <button onClick={() => del.mutate(s.id)} disabled={del.isPending} className="text-sm text-danger">
              Remove
            </button>
          </Card>
        ))}
        {services.data && services.data.length === 0 ? (
          <p className="text-text-muted">No services yet.</p>
        ) : null}
      </div>
    </div>
  );
}
