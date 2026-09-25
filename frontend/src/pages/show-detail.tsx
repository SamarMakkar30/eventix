import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../api/eventix";
import { Artwork } from "../components/artwork";
import { Button, ErrorState, Skeleton } from "../components/ui";
import { dateTime, money } from "../lib/utils";

const factVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: 0.45 + i * 0.08, ease: "easeOut" as const },
  }),
};

const infoCardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export function ShowDetailPage() {
  const { id = "" } = useParams();
  const show = useQuery({ queryKey: ["show", id], queryFn: () => api.show(id) });
  const inventory = useQuery({
    queryKey: ["inventory", id],
    queryFn: () => api.inventory(id),
    retry: false,
    enabled: Boolean(show.data),
  });
  const movies = useQuery({ queryKey: ["movies"], queryFn: api.movies });
  const events = useQuery({ queryKey: ["events"], queryFn: api.events });

  if (show.isLoading)
    return (
      <div className="page container detail-loading">
        <Skeleton className="detail-loading-art" />
        <div>
          <Skeleton className="detail-loading-title" />
          <Skeleton className="detail-loading-copy" />
          <Skeleton className="detail-loading-copy" />
        </div>
      </div>
    );

  if (show.isError || !show.data)
    return (
      <div className="page container">
        <ErrorState
          title="This experience has moved on"
          detail="The show you're looking for is unavailable or no longer listed."
        />
      </div>
    );

  const data = show.data;
  const movie = movies.data?.find((item) => item.id === data.movieId);
  const event = events.data?.find((item) => item.id === data.eventId);
  const description = data.showType === "MOVIE" ? movie?.description : event?.description;
  const category = data.showType === "MOVIE" ? movie?.genre : event?.category;
  const imageUrl = data.showType === "MOVIE" ? movie?.posterUrl : event?.bannerUrl;
  const available = inventory.data?.availableSeats;
  const soldOut = available === 0;
  const availabilityUnavailable = inventory.isError;

  const facts = [
    { icon: <CalendarDays />, label: dateTime(data.showDateTime) },
    { icon: <MapPin />, label: data.venueName },
    { icon: <Ticket />, label: `${money(data.price)} per ticket` },
    ...(available !== undefined
      ? [
          {
            icon: <Ticket />,
            label: soldOut ? "Sold out" : `${available} tickets left`,
            cls: soldOut ? "sold-out" : undefined,
          },
        ]
      : []),
    ...(availabilityUnavailable
      ? [{ icon: <Info />, label: "Availability not configured", cls: "availability-unknown" }]
      : []),
  ];

  const infoCards = [
    {
      icon: <Clock3 />,
      title: "Arrive with ease",
      body: "We recommend arriving 20 minutes before the scheduled start.",
    },
    {
      icon: <Ticket />,
      title: "Tickets in one place",
      body: "Your confirmation and booking reference live securely in My Bookings.",
    },
    {
      icon: <MapPin />,
      title: data.venueName,
      body: "Your venue and timing are confirmed as part of your booking.",
    },
  ];

  return (
    <>
      <section className="detail-hero">
        <div className="detail-hero__ambient" />
        <div className="container detail-hero__grid">
          <motion.div
            className="detail-poster"
            initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Artwork
              title={data.title}
              seed={data.id}
              imageUrl={imageUrl}
              type={data.showType}
            />
          </motion.div>

          <div className="detail-content">
            <motion.nav
              aria-label="Breadcrumb"
              className="breadcrumb"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Link to="/shows">Explore</Link>
              <span aria-hidden="true">/</span>
              <Link
                to={
                  data.showType === "MOVIE"
                    ? "/shows?type=MOVIE"
                    : "/shows?type=EVENT"
                }
              >
                {data.showType === "MOVIE" ? "Film" : "Live event"}
              </Link>
            </motion.nav>

            <motion.p
              className="eyebrow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {category || (data.showType === "MOVIE" ? "On the big screen" : "Live experience")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
            >
              {data.title}
            </motion.h1>

            <motion.p
              className="detail-description"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {description || "An experience carefully selected for an unforgettable night out."}
            </motion.p>

            <div className="detail-facts">
              {facts.map((fact, i) => (
                <motion.span
                  key={i}
                  className={fact.cls}
                  variants={factVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  {fact.icon}
                  {fact.label}
                </motion.span>
              ))}
            </div>

            {availabilityUnavailable && (
              <motion.p
                className="availability-callout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                This experience is listed, but ticket inventory has not been
                configured by Eventix yet. Please choose another available show.
              </motion.p>
            )}

            <motion.div
              className="detail-actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.45 }}
            >
              {soldOut || availabilityUnavailable ? (
                <Button disabled>
                  {soldOut ? "Sold out" : "Booking unavailable"}
                </Button>
              ) : (
                <Link className="button" to={`/shows/${data.id}/seats`}>
                  Choose tickets <ArrowRight size={17} />
                </Link>
              )}
              <a className="button button--ghost" href="#event-info">
                <Info size={17} />
                Show information
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="event-info" className="section container detail-info">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="eyebrow">Before you go</p>
          <h2>A beautifully uncomplicated night.</h2>
        </motion.div>
        <div className="info-grid">
          {infoCards.map((card, i) => (
            <motion.div
              key={i}
              variants={infoCardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i}
            >
              {card.icon}
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
