import { redirect } from 'next/navigation';

import { AppNav } from '@/components/AppNav';
import { QueryProvider } from '@/components/QueryProvider';
import { Container } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <QueryProvider>
      <AppNav />
      <Container className="pb-28 pt-6 md:pb-16 md:pt-8">{children}</Container>
    </QueryProvider>
  );
}
