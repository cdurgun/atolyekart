// Stitch tasarımındaki Material Symbols ikonlarının satır içi SVG karşılıkları (dış font yok).
const paths = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />,
  bag: <><path d="M5 8h14l-1.2 12H6.2L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowUpRight: <path d="M7 17 17 7M9 7h8v8" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  leaf: <><path d="M5 19c0-8 5-13.5 14-14 0 9-5 14-13 14" /><path d="M5 19l7-7" /></>,
  flame: <path d="M12 21a6 6 0 0 0 6-6c0-4-3-6.5-4.5-10.5C11.5 6.5 10.6 8.6 10.8 11 9.6 10.2 9 9.2 8.8 8 7 10 6 12.2 6 15a6 6 0 0 0 6 6Z" />,
  pen: <><path d="M4 20l4-1L18.5 8.5l-3-3L5 16l-1 4Z" /><path d="m13.5 7.5 3 3" /></>,
  camera: <><rect x="3.5" y="7" width="17" height="12" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M9 7l1.5-2.5h3L15 7" /></>,
  pin: <><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11Z" /><circle cx="12" cy="10" r="2.2" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></>,
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />,
  truck: <><path d="M3 6.5h11v9.5H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  shield: <><path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  card: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  help: <><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.7" /><path d="M12 16.6v.1" /></>,
  sync: <><path d="M4.5 11A7.5 7.5 0 0 1 18 7.2L20 9" /><path d="M20 4.5V9h-4.5" /><path d="M19.5 13A7.5 7.5 0 0 1 6 16.8L4 15" /><path d="M4 19.5V15h4.5" /></>,
  gift: <><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M3 9h18M12 9v11" /><path d="M12 9c-1.5-3.5-6-4-6-1.5S9 9 12 9Zm0 0c1.5-3.5 6-4 6-1.5S15 9 12 9Z" /></>,
  share: <><circle cx="6" cy="12" r="2.2" /><circle cx="17" cy="6" r="2.2" /><circle cx="17" cy="18" r="2.2" /><path d="m8 11 7-4M8 13l7 4" /></>,
  star: <path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6Z" />,
  tune: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="9.5" r="1.8" /><path d="m4 17 5-5 4 4 2.5-2.5L20 18" /></>,
  upload: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4.5 14v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V14" /></>,
  chat: <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5Z" />,
  send: <path d="M4 12 20 4l-4 16-4.5-6.5L4 12Zm7.5 1.5L20 4" />,
  box: <><path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z" /><path d="M4 8l8 4 8-4M12 12v8" /></>,
}

export default function Icon({ name, size = 20, className }) {
  return (
    <svg
      className={className ? `lp-icon ${className}` : 'lp-icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}
