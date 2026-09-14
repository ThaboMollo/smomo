import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4">
      <Link href="/" className="mb-6 text-center text-2xl font-extrabold tracking-tight">
        💅 Smomo
      </Link>
      {children}
    </div>
  );
}
