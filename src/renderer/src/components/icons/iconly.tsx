/**
 * Iconly (Light) tarzı yerel ikon seti.
 *
 * Not: Iconly'nin resmi React paketi (`react-iconly`) `defaultProps` kullandığı
 * için React 19 ile uyumlu değil. Bu yüzden projede ihtiyaç duyulan yeni ikonları
 * Iconly "Light" çizgi stiline (24x24, stroke 1.5, yuvarlatılmış uçlar) sadık kalarak
 * yerel SVG bileşenleri olarak burada tutuyoruz. Yeni özelliklerde bu seti kullan.
 *
 * Kaynak/ilham: https://web.iconly.pro/?is_free=1
 */
import type { SVGProps } from 'react'

export interface IconlyProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number
  strokeWidth?: number
}

function Base({
  size = 24,
  strokeWidth = 1.5,
  children,
  ...props
}: IconlyProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/* ── Navigasyon / sayfa ikonları ── */

export const Category = (p: IconlyProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2.2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2" />
  </Base>
)

export const Chart = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M7 16.5v-3" />
    <path d="M12 16.5v-9" />
    <path d="M17 16.5v-5" />
    <path d="M4 20.5h16" />
  </Base>
)

export const Activity = (p: IconlyProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M7.5 13.5l2.4-3 2.3 2.2 2.8-4" />
  </Base>
)

export const ShieldDone = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M12 21.5c4.5-1.2 7-4.2 7-8V6l-7-2.5L5 6v7.5c0 3.8 2.5 6.8 7 8z" />
    <path d="M9.2 12.2l2 2 3.6-3.8" />
  </Base>
)

/* ── Aksiyon ikonları ── */

export const Notification = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-2 8-2 8h16s-2-1-2-8" />
    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
  </Base>
)

export const Search = (p: IconlyProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Base>
)

export const Plus = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)

export const CloseSquare = (p: IconlyProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </Base>
)

export const Close = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
)

export const Download = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M12 3v11" />
    <path d="M8 10.5l4 4 4-4" />
    <path d="M5 19.5h14" />
  </Base>
)

export const Upload = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M12 15V4" />
    <path d="M8 7.5l4-4 4 4" />
    <path d="M5 19.5h14" />
  </Base>
)

export const Copy = (p: IconlyProps) => (
  <Base {...p}>
    <rect x="8" y="8" width="12" height="12" rx="3" />
    <path d="M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2" />
  </Base>
)

export const Star = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
  </Base>
)

export const Edit = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M13.5 5.5l5 5L9 20H4v-5z" />
    <path d="M12 7l5 5" />
  </Base>
)

export const Delete = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
    <path d="M10 11v6M14 11v6" />
  </Base>
)

export const Filter = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M4 5h16l-6.2 7.3V19l-3.6 1.8v-8.5z" />
  </Base>
)

export const Swap = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M7 4L4 7l3 3" />
    <path d="M4 7h13" />
    <path d="M17 20l3-3-3-3" />
    <path d="M20 17H7" />
  </Base>
)

export const Hash = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16" />
  </Base>
)

export const Lock = (p: IconlyProps) => (
  <Base {...p}>
    <rect x="4.5" y="10" width="15" height="11" rx="3.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2.5" />
  </Base>
)

export const Password = (p: IconlyProps) => (
  <Base {...p}>
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h9" />
    <path d="M17 12v3" />
    <path d="M20 12v2" />
  </Base>
)

export const Calendar = (p: IconlyProps) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="4" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v4M16 3v4" />
  </Base>
)

export const TimeCircle = (p: IconlyProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </Base>
)

export const Paper = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M6 3h7l5 5v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
    <path d="M13 3v5h5" />
    <path d="M8 13h7M8 17h5" />
  </Base>
)

export const Folder = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M3 8a3 3 0 0 1 3-3h3l2 2.5h7a3 3 0 0 1 3 3V17a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
  </Base>
)

export const Profile = (p: IconlyProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
  </Base>
)

export const Setting = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M4 7h10M18 7h2" />
    <path d="M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2.2" />
    <circle cx="8" cy="17" r="2.2" />
  </Base>
)

export const Home = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M4 10.5L12 4l8 6.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <path d="M9.5 21v-6h5v6" />
  </Base>
)

export const Send = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M20 4L3.5 11l6.5 2.2L12.5 20z" />
    <path d="M20 4l-10 9.2" />
  </Base>
)

export const TickSquare = (p: IconlyProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <path d="M8 12.2l2.6 2.6L16 9" />
  </Base>
)

export const Tick = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Base>
)

export const ArrowRight = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Base>
)

export const Scan = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
    <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M4 12h16" />
  </Base>
)

export const Refresh = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M5 12a7 7 0 0 1 12-5l2 2" />
    <path d="M19 5v4h-4" />
    <path d="M19 12a7 7 0 0 1-12 5l-2-2" />
    <path d="M5 19v-4h4" />
  </Base>
)

export const Show = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
)

export const Hide = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.5 5.8A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.7 3.4" />
    <path d="M6.2 7.6A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5c1 0 2-.2 2.9-.5" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Base>
)

export const Bookmark = (p: IconlyProps) => (
  <Base {...p}>
    <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-3.3L5 20V5.5a1 1 0 0 1 1-1z" />
  </Base>
)

export const Wallet = (p: IconlyProps) => (
  <Base {...p}>
    <rect x="3" y="6" width="18" height="13" rx="3.5" />
    <path d="M16 12.5h2.5" />
    <path d="M3 9.5h12a2 2 0 0 1 0 4H3" opacity="0" />
  </Base>
)

export const Document = Paper
export const Graph = Chart
