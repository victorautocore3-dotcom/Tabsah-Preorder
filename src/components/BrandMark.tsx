import React from 'react';
import { LOGO_ICON_PINK_DATA_URI } from '../assets/logoIconPink';

interface BrandMarkProps {
  className?: string;
}

/**
 * Brand icon mark for Pre Order With Tabsah using the official pink price-tag
 * logo asset with white T and deep purple dot on a transparent background.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  className = 'h-[36px] w-auto object-contain shrink-0 block',
}) => {
  return (
    <img
      src={LOGO_ICON_PINK_DATA_URI}
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
};
