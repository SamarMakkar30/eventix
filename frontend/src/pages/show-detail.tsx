import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock3, Info, MapPin, Ticket, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/eventix";
import { Artwork } from "../components/artwork";
import { Button, ErrorState, Skeleton } from "../components/ui";
import { dateTime, money } from "../lib/utils";

export function ShowDetailPage() {
  const { id = "" } = useParams();
  const show = useQuery({ queryKey: ["show", id], queryFn: () => api.show(id) });
  const inventory = useQuery({ queryKey: ["inventory", id], queryFn: () => api.inventory(id), retry: false, enabled: Boolean(show.data) });
  const movies = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const events = useQuery({ queryKey: ["events"], queryFn: api.events });
  if (show.isLoading) return <div className="page container detail-loading"><Skeleton className="detail-loading-art" /><div><Skeleton className="detail-loading-title" /><Skeleton className="detail-loading-copy" /><Skeleton className="detail-loading-copy" /></div></div>;
  if (show.isError || !show.data) return <div className="page container"><ErrorState title="This experience has moved on" detail="The show you’re looking for is unavailable or no longer listed." /></div>;
  const data = show.data;
  const movie = movies.data?.find((item) => item.id === data.movieId);
  const event = events.data?.find((item) => item.id === data.eventId);
  const description = data.showType === "MOVIE" ? movie?.description : event?.description;
  const category = data.showType === "MOVIE" ? movie?.genre : event?.category;
  const imageUrl = data.showType === "MOVIE" ? movie?.posterUrl : event?.bannerUrl;
  const available = inventory.data?.availableSeats;
  const soldOut = available === 0;
  return <>
    <section className="detail-hero"><div className="detail-hero__ambient" /><div className="container detail-hero__grid"><div className="detail-poster"><Artwork title={data.title} seed={data.id} imageUrl={imageUrl} type={data.showType} /></div><div className="detail-content"><Link className="breadcrumb" to="/shows">Explore <span>/</span> {data.showType === "MOVIE" ? "Film" : "Live event"}</Link><p className="eyebrow">{category || (data.showType === "MOVIE" ? "On the big screen" : "Live experience")}</p><h1>{data.title}</h1><p className="detail-description">{description || "An experience carefully selected for an unforgettable night out."}</p><div className="detail-facts"><span><CalendarDays />{dateTime(data.showDateTime)}</span><span><MapPin />{data.venueName}</span><span><Ticket />{money(data.price)} per ticket</span>{available !== undefined && <span className={soldOut ? "sold-out" : "available"}><Users />{soldOut ? "Sold out" : `${available} tickets left`}</span>}</div><div className="detail-actions">{soldOut ? <Button disabled>Sold out</Button> : <Link className="button" to={`/shows/${data.id}/seats`}>Choose tickets <ArrowRight size={17} /></Link>}<a className="button button--ghost" href="#event-info"><Info size={17} />Show information</a></div></div></div></section>
    <section id="event-info" className="section container detail-info"><div><p className="eyebrow">Before you go</p><h2>A beautifully uncomplicated night.</h2></div><div className="info-grid"><div><Clock3 /><h3>Arrive with ease</h3><p>We recommend arriving 20 minutes before the scheduled start.</p></div><div><Ticket /><h3>Tickets in one place</h3><p>Your confirmation and booking reference live securely in My Bookings.</p></div><div><MapPin /><h3>{data.venueName}</h3><p>Your venue and timing are confirmed as part of your booking.</p></div></div></section>
  </>;
}
