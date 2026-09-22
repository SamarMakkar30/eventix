import { useCallback, useState } from "react";
import { Clapperboard, Sparkles } from "lucide-react";
import { cn, posterGradient } from "../lib/utils";

export function Artwork({
  title,
  imageUrl,
  seed,
  className,
  type = "MOVIE",
}: {
  title: string;
  imageUrl?: string | null;
  seed: number;
  className?: string;
  type?: "MOVIE" | "EVENT";
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const letter = title.trim().charAt(0).toUpperCase() || "E";

  const handleLoad = useCallback(() => setLoaded(true), []);

  return (
    <div
      className={cn("artwork", `artwork--${posterGradient(seed)}`, className)}
    >
      {imageUrl && !failed && (
        <img
          src={imageUrl}
          alt=""
          onError={() => setFailed(true)}
          onLoad={handleLoad}
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        />
      )}
      <div
        className="artwork-fallback"
        aria-hidden={Boolean(imageUrl && !failed)}
      >
        <span>{type === "MOVIE" ? <Clapperboard /> : <Sparkles />}</span>
        <strong
          style={{
            animation: !(imageUrl && !failed)
              ? "artworkLetterPulse 4s ease-in-out infinite"
              : undefined,
          }}
        >
          {letter}
        </strong>
        <i>{type === "MOVIE" ? "Cinema" : "Live"}</i>
      </div>
    </div>
  );
}
