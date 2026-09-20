import Link from 'next/link';

import { BrandLogo } from '@/components/BrandLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4">
      <Link href="/" aria-label="Smomo" className="mb-6 flex justify-center">
        <BrandLogo className="h-9 w-auto" priority />
      </Link>
      {children}
    </div>
  );
}
