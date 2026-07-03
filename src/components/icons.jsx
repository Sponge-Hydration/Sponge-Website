// Inline SVG icon set — replaces all emoji used as UI across the site.
// Stroke-based, inherits `currentColor`, sized via the `size` prop.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ size = 24, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...base}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const DropletIcon = (p) => (
  <Svg {...p}><path d="M12 2.7 6.9 9.5a6.5 6.5 0 1 0 10.2 0Z" /></Svg>
)

export const MagnetIcon = (p) => (
  <Svg {...p}>
    <path d="M5 8a7 7 0 0 0 14 0V3h-4v5a3 3 0 0 1-6 0V3H5Z" />
    <path d="M5 6h4M15 6h4" />
  </Svg>
)

export const BatteryIcon = (p) => (
  <Svg {...p}>
    <rect x="2" y="8" width="17" height="8" rx="2" />
    <path d="M22 11v2M5.5 11v2M9 11v2M12.5 11v2" />
  </Svg>
)

export const PhoneIcon = (p) => (
  <Svg {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </Svg>
)

export const LockIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Svg>
)

export const TargetIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" />
  </Svg>
)

export const CartIcon = (p) => (
  <Svg {...p}>
    <circle cx="9.5" cy="20" r="1.4" />
    <circle cx="17.5" cy="20" r="1.4" />
    <path d="M2.5 3.5h3l2.6 12h10.2l2.2-8.5H6.2" />
  </Svg>
)

export const MenuIcon = (p) => (
  <Svg {...p}><path d="M4 6.5h16M4 12h16M4 17.5h16" /></Svg>
)

export const CloseIcon = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
)

export const CheckCircleIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m8 12.3 2.8 2.8L16.4 9.5" />
  </Svg>
)

export const ShieldIcon = (p) => (
  <Svg {...p}>
    <path d="M12 2.8 4.5 5.6v5.6c0 4.6 3.1 8 7.5 9.9 4.4-1.9 7.5-5.3 7.5-9.9V5.6Z" />
    <path d="m9 11.8 2.2 2.2L15.4 9.7" />
  </Svg>
)

export const TruckIcon = (p) => (
  <Svg {...p}>
    <path d="M2.5 5.5h11v11h-11ZM13.5 9.5H18l3.5 3.5v3.5h-8" />
    <circle cx="6.5" cy="18.5" r="1.8" />
    <circle cx="17.5" cy="18.5" r="1.8" />
  </Svg>
)

export const FlameIcon = (p) => (
  <Svg {...p}>
    <path d="M12 21.5c3.9 0 6.5-2.6 6.5-6.2 0-2.5-1.4-4.4-2.9-6.1-.5 1-1 1.5-1.9 2.1.2-2.8-1-6.1-3.7-8-.2 2.4-1 3.9-2.4 5.5-1.4 1.7-3.1 3.6-3.1 6.5 0 3.6 2.6 6.2 7.5 6.2Z" />
  </Svg>
)

export const GamepadIcon = (p) => (
  <Svg {...p}>
    <path d="M7 7.5h10a5 5 0 0 1 5 5.5l-.4 3a2.7 2.7 0 0 1-4.8 1.3L15 15.5H9l-1.8 1.8a2.7 2.7 0 0 1-4.8-1.3l-.4-3a5 5 0 0 1 5-5.5Z" />
    <path d="M8.5 10.5v3M7 12h3M15.5 11h.01M17.5 13h.01" />
  </Svg>
)

export const FilmIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M7.5 4.5v15M16.5 4.5v15M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21" />
  </Svg>
)

export const EyeIcon = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
)

export const BellIcon = (p) => (
  <Svg {...p}>
    <path d="M18 10a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.2 19.5a2 2 0 0 0 3.6 0" />
  </Svg>
)

export const SparklesIcon = (p) => (
  <Svg {...p}>
    <path d="M12 4.5 13.8 10 19.5 12l-5.7 2-1.8 5.5L10.2 14 4.5 12l5.7-2Z" />
    <path d="M19 4v3M17.5 5.5h3" />
  </Svg>
)

export const UsersIcon = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16.5 5.6a3.5 3.5 0 0 1 0 5.8M18.3 14.4a6.2 6.2 0 0 1 2.9 5.6" />
  </Svg>
)

export const TrendingUpIcon = (p) => (
  <Svg {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15.5 7H21v5.5" />
  </Svg>
)

export const BulbIcon = (p) => (
  <Svg {...p}>
    <path d="M9.5 17.5a7 7 0 1 1 5 0" />
    <path d="M9.5 17.5h5M10 21h4" />
  </Svg>
)
