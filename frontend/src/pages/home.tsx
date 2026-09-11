import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, CalendarDays, Clapperboard, MapPin, Play, Sparkles, Star, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../api/eventix";
import { Artwork } from "../components/artwork";
import { ShowCard } from "../components/show-card";
import { Button, ErrorState, Skeleton } from "../components/ui";
import { dateTime, money } from "../lib/utils";

export function HomePage() {
  const shows = useQuery({ queryKey: ["shows"], queryFn: api.shows });
  const movies = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const events = useQuery({ queryKey: ["events"], queryFn: api.events });
  const featured = shows.data?.[0];
  const featuredMovie = movies.data?.find((movie) => movie.id === featured?.movieId);
  const featuredEvent = events.data?.find((event) => event.id === featured?.eventId);

  return <>
    <section className="hero">
      <div className="hero-glow hero-glow--one" /><div className="hero-glow hero-glow--two" />
      <div className="container hero__grid">
        <motion.div className="hero__content" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: "easeOut" }}>
          <div className="hero-kicker"><span />YOUR NEXT GREAT NIGHT OUT</div>
          {shows.isLoading ? <><Skeleton className="hero-title-skeleton" /><Skeleton className="hero-copy-skeleton" /></> : featured ? <>
            <p className="eyebrow hero-category">{featured.showType === "MOVIE" ? featuredMovie?.genre || "The big screen awaits" : featuredEvent?.category || "Live, right now"}</p>
            <h1>{featured.title}<em>— made memorable.</em></h1>
            <p className="hero__description">{featured.showType === "MOVIE" ? featuredMovie?.description || "An extraordinary night is waiting for you at Eventix Arena." : featuredEvent?.description || "Step into the moments people will talk about tomorrow."}</p>
            <div className="hero__meta"><span><CalendarDays size={16} />{dateTime(featured.showDateTime)}</span><span><MapPin size={16} />{featured.venueName}</span></div>
            <div className="hero__actions"><Link className="button" to={`/shows/${featured.id}`}>Book tickets <ArrowRight size={17} /></Link><Link className="button button--ghost" to="/shows"><Play size={16} fill="currentColor" />Explore experiences</Link></div>
          </> : <><h1>Find your next <em>great night out.</em></h1><p className="hero__description">From cinema premieres to unforgettable live moments, Eventix makes the plan feel effortless.</p><Link className="button" to="/shows">Explore shows <ArrowRight size={17} /></Link></>}
        </motion.div>
        <motion.div className="hero__art" initial={{ opacity: 0, scale: .96, rotate: 2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .8, delay: .12 }}>
          {featured ? <Artwork title={featured.title} seed={featured.id} imageUrl={featured.showType === "MOVIE" ? featuredMovie?.posterUrl : featuredEvent?.bannerUrl} type={featured.showType} /> : <div className="hero-placeholder" />}
          {featured && <div className="hero-ticket"><span className="eyebrow">From</span><strong>{money(featured.price)}</strong><span>per ticket</span><div className="ticket-notch ticket-notch--top" /><div className="ticket-notch ticket-notch--bottom" /></div>}
          <div className="hero-orbit"><Sparkles size={17} /> <span>CURATED FOR YOU</span></div>
        </motion.div>
      </div>
      <a href="#discover" className="scroll-cue"><span>Scroll to discover</span><ArrowDown size={16} /></a>
    </section>

    <section id="discover" className="section container">
      <div className="section-heading"><div><p className="eyebrow">Now showing</p><h2>Make tonight count.</h2></div><Link className="inline-link" to="/shows">View all <ArrowRight size={17} /></Link></div>
      {shows.isError ? <ErrorState detail="We couldn’t load the current programme." retry={() => shows.refetch()} /> : <div className="shows-grid">{shows.isLoading ? Array.from({ length: 3 }, (_, index) => <div className="show-card skeleton-card" key={index}><Skeleton /><Skeleton /><Skeleton /></div>) : shows.data?.slice(0, 3).map((show, index) => <ShowCard key={show.id} show={show} movie={movies.data?.find((movie) => movie.id === show.movieId)} event={events.data?.find((event) => event.id === show.eventId)} priority={index === 0} />)}</div>}
    </section>

    <section className="curated-section container"><div className="section-heading"><div><p className="eyebrow">Choose your mood</p><h2>Not just what’s on.<br /><em>What feels right.</em></h2></div><p className="curated-section__lead">A considered way into the programme, whether you are chasing the first show, a familiar favourite, or something unexpected.</p></div><div className="curated-grid"><Link to="/shows?type=MOVIE" className="curated-card curated-card--cinema"><Clapperboard /><span className="eyebrow">For the big screen</span><h3>Films that deserve the room.</h3><p>{movies.data?.length || 0} cinema {movies.data?.length === 1 ? "title" : "titles"} in the current programme</p><b>Explore films <ArrowRight size={16} /></b></Link><Link to="/shows?type=EVENT" className="curated-card curated-card--live"><Sparkles /><span className="eyebrow">Live & in the moment</span><h3>Stories you can step into.</h3><p>{events.data?.length || 0} live {events.data?.length === 1 ? "experience" : "experiences"} to discover</p><b>Explore live events <ArrowRight size={16} /></b></Link><Link to="/shows" className="curated-card curated-card--date"><Ticket /><span className="eyebrow">Plan the occasion</span><h3>Your next great yes is nearby.</h3><p>{shows.data?.length || 0} upcoming {shows.data?.length === 1 ? "show" : "shows"} curated for you</p><b>See everything on <ArrowRight size={16} /></b></Link></div></section>

    <section className="experience-band"><div className="container experience-band__grid"><div><p className="eyebrow">The Eventix difference</p><h2>Less planning.<br /><em>More presence.</em></h2></div><div className="experience-list"><div><span>01</span><div><h3>Choose with confidence</h3><p>Live availability and crystal-clear pricing, right from discovery.</p></div></div><div><span>02</span><div><h3>Book in a breath</h3><p>A calm, focused checkout built for the moment you decide to go.</p></div></div><div><span>03</span><div><h3>Just show up</h3><p>Your plans, tickets, and memories—beautifully in one place.</p></div></div></div></div></section>

    <section className="section container venue-feature"><div className="venue-feature__visual"><div className="venue-ring venue-ring--one" /><div className="venue-ring venue-ring--two" /><Star fill="currentColor" /><span>EVENTIX<br />ARENA</span></div><div><p className="eyebrow">Spotlight venue</p><h2>Every seat is a front-row feeling.</h2><p>World-class sound, seamless arrivals, and an atmosphere that starts before the lights go down.</p><Link className="inline-link" to="/shows">Find your next show <ArrowRight size={17} /></Link></div></section>
  </>;
}
