import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/lib/theme';

/**
 * The web's navigation marks, path for path from `apps/web/src/components/AppNav.tsx`.
 * Same 24-box, same 1.75 stroke, same round caps and joins — so the app and the site
 * draw the same icons rather than two different families.
 */
export type NavIconName =
  | 'home'
  | 'discover'
  | 'chats'
  | 'studio'
  | 'requests'
  | 'schedule'
  | 'profile'
  | 'admin'
  | 'plus'
  | 'chevronRight'
  | 'chevronLeft';

export function NavIcon({
  name,
  size = 22,
  color,
  strokeWidth = 1.75,
}: {
  name: NavIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const { colors } = useTheme();
  const stroke = color ?? colors.text;
  const common = {
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'home' ? (
        <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" {...common} />
      ) : null}

      {name === 'discover' ? (
        <>
          <Circle cx="11" cy="11" r="7" {...common} />
          <Path d="M20 20l-3.5-3.5" {...common} />
        </>
      ) : null}

      {name === 'chats' ? (
        <Path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" {...common} />
      ) : null}

      {name === 'studio' ? (
        <>
          <Path d="M4 20h16" {...common} />
          <Path d="M6 20V9l6-5 6 5v11" {...common} />
          <Path d="M10 20v-5h4v5" {...common} />
        </>
      ) : null}

      {name === 'requests' ? (
        <>
          <Path d="M4 5h16v11H8l-4 4z" {...common} />
          <Path d="M8 9h8M8 12h5" {...common} />
        </>
      ) : null}

      {name === 'schedule' ? (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="3" {...common} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...common} />
        </>
      ) : null}

      {name === 'profile' ? (
        <>
          <Circle cx="12" cy="8" r="4" {...common} />
          <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" {...common} />
        </>
      ) : null}

      {name === 'admin' ? (
        <Path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" {...common} />
      ) : null}

      {/* From the Discover broadcast CTA, stroke 2 there. */}
      {name === 'plus' ? <Path d="M12 5v14M5 12h14" {...common} strokeWidth={2} /> : null}
      {name === 'chevronRight' ? <Path d="M9 6l6 6-6 6" {...common} strokeWidth={2} /> : null}
      {name === 'chevronLeft' ? <Path d="M15 6l-6 6 6 6" {...common} strokeWidth={2} /> : null}
    </Svg>
  );
}
