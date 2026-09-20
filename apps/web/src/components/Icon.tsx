import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/**
 * Thin Font Awesome wrapper for non-category marks (empty states, confirmations,
 * small affordances). Defaults to the brand violet and 16px so page code stays
 * to a single line. Import icon defs from '@fortawesome/free-solid-svg-icons'.
 */
export function Icon({
  icon,
  size = 16,
  className = 'text-primary-700',
}: {
  icon: IconDefinition;
  size?: number;
  className?: string;
}) {
  return (
    <FontAwesomeIcon
      icon={icon}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
