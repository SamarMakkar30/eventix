import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { dateTime, money } from "../lib/utils";
import type { Event, Movie, Show } from "../types/api";
import { Artwork } from "./artwork";

export function ShowCard({ show, movie, event, priority = false }: { show: Show; movie?: Movie; event?: Event; priority?: boolean }) {
  const image = show.showType === "MOVIE" ? movie?.posterUrl : event?.bannerUrl;
  const description = show.showType === "MOVIE" ? movie?.genre : event?.category;
  return <article className="show-card">
    <Link to={`/shows/${show.id}`} className="show-card__art" aria-label={`View ${show.title}`}><Artwork title={show.title} seed={show.id} imageUrl={image} type={show.showType} /><span className="show-card__type">{show.showType === "MOVIE" ? "Film" : "Live event"}</span>{priority && <span className="show-card__featured">Featured</span>}</Link>
    <div className="show-card__body"><div className="eyebrow">{description || (show.showType === "MOVIE" ? "On the big screen" : "An unmissable moment")}</div><h3><Link to={`/shows/${show.id}`}>{show.title}</Link></h3><p className="show-card__line"><CalendarDays size={15} />{dateTime(show.showDateTime)}</p><p className="show-card__line"><MapPin size={15} />{show.venueName}</p><div className="show-card__bottom"><strong>{money(show.price)} <small>/ ticket</small></strong><Link className="card-arrow" to={`/shows/${show.id}`} aria-label={`Book ${show.title}`}><ArrowUpRight size={18} /></Link></div></div>
  </article>;
}
