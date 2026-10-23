import type { ReactNode } from 'react';

/**
 * Marks a block for the scroll reveal. Server-rendered and static: it only emits a
 * `data-rv` attribute (and an optional stagger delay); all behaviour lives in the single
 * <RevealController /> mounted once on the page. The block is fully visible in the HTML,
 * so without JS, or under prefers-reduced-motion, nothing is ever hidden.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  /** Stagger in ms. */
  delay?: number;
  as?: 'div' | 'li' | 'article' | 'section';
}) {
  return (
    <Tag className={className} data-rv="" style={delay ? ({ '--d': `${delay}ms` } as React.CSSProperties) : undefined}>
      {children}
    </Tag>
  );
}
