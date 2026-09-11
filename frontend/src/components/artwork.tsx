import { useState } from "react";
import { Clapperboard, Sparkles } from "lucide-react";
import { cn, posterGradient } from "../lib/utils";

export function Artwork({ title, imageUrl, seed, className, type = "MOVIE" }: { title: string; imageUrl?: string | null; seed: number; className?: string; type?: "MOVIE" | "EVENT" }) {
  const [failed, setFailed] = useState(false);
  const letter = title.trim().charAt(0).toUpperCase() || "E";
  return <div className={cn("artwork", `artwork--${posterGradient(seed)}`, className)}>
    {imageUrl && !failed && <img src={imageUrl} alt="" onError={() => setFailed(true)} />}
    <div className="artwork-fallback" aria-hidden={Boolean(imageUrl && !failed)}><span>{type === "MOVIE" ? <Clapperboard /> : <Sparkles />}</span><strong>{letter}</strong><i>{type === "MOVIE" ? "Cinema" : "Live"}</i></div>
  </div>;
}
