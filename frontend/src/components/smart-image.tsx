import { useState } from "react";

/* Image that degrades to the editorial gradient when the URL is dead —
   the real catalogue's seed posterUrls can 404, and a broken-image glyph
   is not acceptable on a paid-feeling surface. */
export default function SmartImage({
  src,
  alt,
  fallback,
  className,
  style,
}: {
  src: string | null | undefined;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
