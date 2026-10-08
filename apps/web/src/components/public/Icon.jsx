// Material Symbol icon. Name comes from CMS (`icon` field) or UI constants —
// never user input. Unknown names render nothing (font shows blank glyph,
// so guard with a fallback).
export function Icon({ name, fallback = 'help', className = '', filled = false, size = 24 }) {
  const safe = /^[a-z_]+$/.test(name ?? '') ? name : fallback;
  return (
    <span
      className={`material-symbols-outlined${filled ? ' fill' : ''} ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {safe}
    </span>
  );
}
