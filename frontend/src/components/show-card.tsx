import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { dateTime, money } from "../lib/utils";
import type { Event, Movie, Show } from "../types/api";
import { Artwork } from "./artwork";

export function ShowCard({
  show,
  movie,
  event,
  availableSeats,
  priority = false,
  index = 0,
}: {
  show: Show;
  movie?: Movie;
  event?: Event;
  availableSeats?: number;
  priority?: boolean;
  index?: number;
}) {
  const image = show.showType === "MOVIE" ? movie?.posterUrl : event?.bannerUrl;
  const description =
    show.showType === "MOVIE" ? movie?.genre : event?.category;
  return (
    <motion.article
      className={`show-card${priority ? " show-card--featured" : ""}`}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        rotateX: -1.5,
        rotateY: 2,
        transition: { duration: 0.3 },
      }}
      style={{ transformPerspective: 800 }}
    >
      <Link
        to={`/shows/${show.id}`}
        className="show-card__art"
        aria-label={`View ${show.title}`}
      >
        <Artwork
          title={show.title}
          seed={show.id}
          imageUrl={image}
          type={show.showType}
        />
        <span className="show-card__type">
          {show.showType === "MOVIE" ? "Film" : "Live event"}
        </span>
        {priority && <span className="show-card__featured">Featured</span>}
      </Link>
      <div className="show-card__body">
        <div className="eyebrow">
          {description ||
            (show.showType === "MOVIE"
              ? "On the big screen"
              : "An unmissable moment")}
        </div>
        <h3>
          <Link to={`/shows/${show.id}`}>{show.title}</Link>
        </h3>
        <p className="show-card__line">
          <CalendarDays size={15} />
          {dateTime(show.showDateTime)}
        </p>
        <p className="show-card__line">
          <MapPin size={15} />
          {show.venueName}
        </p>
        {availableSeats !== undefined && (
          <p
            className={`show-card__availability ${availableSeats === 0 ? "sold-out" : ""}`}
          >
            <Users size={14} />
            {availableSeats === 0
              ? "Sold out"
              : `${availableSeats} tickets left`}
          </p>
        )}
        <div className="show-card__bottom">
          <strong>
            {money(show.price)} <small>/ ticket</small>
          </strong>
          <Link
            className="card-arrow"
            to={`/shows/${show.id}`}
            aria-label={`Book ${show.title}`}
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
