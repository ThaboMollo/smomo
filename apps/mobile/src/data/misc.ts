import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import type { Enums } from '@smomo/shared';

/* ------------------------ Profile ------------------------ */
export function useUpdateProfile() {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (patch: { full_name?: string; avatar_url?: string }) => {
      await api.me.updateProfile(patch);
      await refresh();
    },
  });
}

/* ------------------------ Reports ------------------------ */
export function useCreateReport() {
  return useMutation({
    mutationFn: (input: {
      reportedUserId: string;
      bookingId?: string | null;
      reason: string;
      details?: string;
    }) => api.reports.create(input),
  });
}

/* ------------------------ Admin ------------------------ */
export function useAdminReports() {
  return useQuery({ queryKey: ['admin', 'reports'], queryFn: () => api.admin.reports() });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: Enums<'report_status'>; resolution?: string }) =>
      api.admin.resolveReport(input.id, input.status, input.resolution),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });
}

export function useAdminDisputes() {
  return useQuery({ queryKey: ['admin', 'disputes'], queryFn: () => api.admin.disputes() });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { paymentId: string; resolveAs: 'verified' | 'rejected' }) =>
      api.admin.resolveDispute(input.paymentId, input.resolveAs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'disputes'] }),
  });
}
