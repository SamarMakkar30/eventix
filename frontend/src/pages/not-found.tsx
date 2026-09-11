import { ArrowRight, Compass } from "lucide-react";
import { Link } from "react-router-dom";
export function NotFoundPage() { return <div className="not-found"><Compass /><p className="eyebrow">404 / OFF THE MAP</p><h1>This moment isn’t on the schedule.</h1><p>It may have ended, moved, or never existed in the first place.</p><Link className="button" to="/shows">Explore what’s on <ArrowRight size={17} /></Link></div>; }
