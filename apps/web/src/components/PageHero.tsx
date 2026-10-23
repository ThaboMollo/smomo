import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** Deep-violet page header used by the public listing pages. */
export function PageHero({
  crumbs,
  title,
  subtitle,
  image,
  children,
}: {
  crumbs?: { href?: string; label: string }[];
  title: string;
  subtitle?: ReactNode;
  image?: string;
  children?: ReactNode;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-12">
      <div className={`flex flex-col justify-end gap-5 rounded-[32px] bg-primary-950 p-7 text-white sm:p-12 ${image ? 'lg:col-span-8' : 'lg:col-span-12'} min-h-[300px]`}>
        {crumbs?.length ? (
          <nav aria-label="Breadcrumb" className="text-sm text-primary-300">
            {crumbs.map((c, i) => (
              <span key={c.label}>
                {i > 0 ? <span className="mx-2 text-primary-400">/</span> : null}
                {c.href ? (
                  <Link href={c.href} className="hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-5xl sm:text-6xl">{title}</h1>
        {subtitle ? <p className="max-w-xl text-lg text-primary-300">{subtitle}</p> : null}
        {children}
      </div>
      {image ? (
        <div className="relative hidden overflow-hidden rounded-[32px] lg:col-span-4 lg:block">
          <Image src={image} alt="" fill sizes="33vw" className="object-cover" priority />
        </div>
      ) : null}
    </section>
  );
}
