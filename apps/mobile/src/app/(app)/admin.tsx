import { Redirect, router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { formatTimeAgo, formatZar } from '@/lib/format';
import { spacing } from '@/lib/theme';
import {
  useAdminDisputes,
  useAdminReports,
  useResolveDispute,
  useResolveReport,
} from '@/data/misc';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Badge, Button, Card, EmptyState, Header, Row, Screen, Segmented } from '@/ui';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<'reports' | 'disputes'>('reports');
  const reports = useAdminReports();
  const disputes = useAdminDisputes();
  const resolveReport = useResolveReport();
  const resolveDispute = useResolveDispute();

  if (!isAdmin) return <Redirect href="/(app)" />;

  return (
    <Screen>
      <Header title="Admin" onBack={() => safeBack()} />
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'reports', label: 'Reports' },
            { value: 'disputes', label: 'Disputes' },
          ]}
        />
      </View>

      {tab === 'reports' ? (
        <FlatList
          data={reports.data ?? []}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, flexGrow: 1 }}
          onRefresh={reports.refetch}
          refreshing={reports.isRefetching}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText weight="600">{item.reason}</AppText>
                <Badge label={item.status} tone={item.status === 'open' ? 'warning' : 'default'} />
              </Row>
              <AppText variant="small" color="textMuted" style={{ marginTop: 4 }}>
                {item.reporter?.full_name ?? 'Someone'} reported {item.reported?.full_name ?? 'a user'}
              </AppText>
              {item.details ? (
                <AppText variant="small" style={{ marginTop: spacing.sm }}>
                  {item.details}
                </AppText>
              ) : null}
              <AppText variant="caption" color="textFaint" style={{ marginTop: 4 }}>
                {formatTimeAgo(item.created_at)}
              </AppText>
              {item.status !== 'resolved' && item.status !== 'dismissed' ? (
                <Row style={{ gap: spacing.sm, marginTop: spacing.md }}>
                  <Button
                    title="Resolve"
                    full={false}
                    style={{ flex: 1 }}
                    onPress={() => resolveReport.mutate({ id: item.id, status: 'resolved' })}
                  />
                  <Button
                    title="Dismiss"
                    variant="secondary"
                    full={false}
                    style={{ flex: 1 }}
                    onPress={() => resolveReport.mutate({ id: item.id, status: 'dismissed' })}
                  />
                </Row>
              ) : null}
            </Card>
          )}
          ListEmptyComponent={<EmptyState emoji="🛡️" title="No reports" />}
        />
      ) : (
        <FlatList
          data={disputes.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, flexGrow: 1 }}
          onRefresh={disputes.refetch}
          refreshing={disputes.isRefetching}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText weight="600">
                  {item.payment_type} · {formatZar(item.amount_zar)}
                </AppText>
                <Badge label="disputed" tone="danger" />
              </Row>
              <AppText variant="small" color="textMuted" style={{ marginTop: 4 }}>
                {item.payer?.full_name ?? 'Client'} → {item.payee?.full_name ?? 'Provider'}
              </AppText>
              {item.dispute_reason ? (
                <AppText variant="small" style={{ marginTop: spacing.sm }}>
                  {item.dispute_reason}
                </AppText>
              ) : null}
              {item.payshap_reference ? (
                <AppText variant="caption" color="textFaint" style={{ marginTop: 4 }}>
                  Ref: {item.payshap_reference}
                </AppText>
              ) : null}
              <Row style={{ gap: spacing.sm, marginTop: spacing.md }}>
                <Button
                  title="Mark verified"
                  full={false}
                  style={{ flex: 1 }}
                  onPress={() => resolveDispute.mutate({ paymentId: item.id, resolveAs: 'verified' })}
                />
                <Button
                  title="Reject"
                  variant="danger"
                  full={false}
                  style={{ flex: 1 }}
                  onPress={() => resolveDispute.mutate({ paymentId: item.id, resolveAs: 'rejected' })}
                />
              </Row>
            </Card>
          )}
          ListEmptyComponent={<EmptyState emoji="✅" title="No disputes" />}
        />
      )}
    </Screen>
  );
}
