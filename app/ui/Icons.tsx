'use client';

/** Ikon SVG inline (stroke, 20px default). */
import { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function Svg({ size = 20, className, style, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconClipboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4.5V3.8A1.8 1.8 0 0 1 10.8 2h2.4A1.8 1.8 0 0 1 15 3.8v.7" />
    <path d="M9 10h6M9 14h6M9 18h3.5" />
  </Svg>
);

export const IconHourglass = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h10M7 21h10" />
    <path d="M8 3c0 4.5 3.2 6.2 4 7.6.8-1.4 4-3.1 4-7.6" />
    <path d="M8 21c0-4.5 3.2-6.2 4-7.6.8 1.4 4 3.1 4 7.6" />
  </Svg>
);

export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.8-5" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconEdit = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 5.5 18.5 9.5" />
    <path d="M5 19l1-4.5L15.5 5a2.1 2.1 0 0 1 3 0l.5.5a2.1 2.1 0 0 1 0 3L9.5 18 5 19Z" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
    <path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11M7.5 11.5 12 16l4.5-4.5" />
    <path d="M5 19.5h14" />
  </Svg>
);

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M5 19.5h14" />
  </Svg>
);

export const IconArchive = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="17" height="4.5" rx="1.2" />
    <path d="M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5" />
    <path d="M10 12h4" />
  </Svg>
);

export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
    <path d="M12 10v4.5M12 17.4v.1" />
  </Svg>
);

export const IconReset = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" />
    <path d="M4.5 13.5V9H9" />
  </Svg>
);

export const IconGrip = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" strokeWidth={2.4} />
  </Svg>
);

export const IconSpinner = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`spin ${className ?? ''}`} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.2" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
