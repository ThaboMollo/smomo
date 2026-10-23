import Image from 'next/image';

import { SmomoMark } from '@/components/landing/SmomoMark';
import type { EditorialAsset } from '@/lib/landing-content';

type Props = {
  asset: Pick<EditorialAsset, 'id' | 'brief' | 'alt' | 'tone' | 'src' | 'focal'>;
  sizes: string;
  /** Above-the-fold images load eagerly; everything else is lazy. */
  eager?: boolean;
  className?: string;
};

/**
 * Fills its (relatively positioned) parent. Renders the supplied photograph when the
 * asset has a `src`; otherwise a deliberately designed, clearly labelled placeholder
 * that names the asset and its art direction, so nothing unrelated is silently
 * substituted. The parent owns the aspect ratio, so swapping in a photo causes no shift.
 */
export function EditorialImage({ asset, sizes, eager = false, className = '' }: Props) {
  if (asset.src) {
    return (
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        className={`object-cover ${className}`}
        style={asset.focal ? { objectPosition: asset.focal } : undefined}
      />
    );
  }
  return (
    <div className={`ph ${className}`} data-tone={asset.tone} role="img" aria-label={`Image placeholder: ${asset.brief}`}>
      <SmomoMark size="md" className="ph-mark" />
      <span className="ph-chip">
        Photo {asset.id} · {asset.brief}
      </span>
    </div>
  );
}
