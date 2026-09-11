import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, Download, MapPin, Ticket, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../api/eventix";
import { ErrorState, Skeleton, StatusBadge } from "../components/ui";
import { dateTime, money } from "../lib/utils";

export function ConfirmationPage() {
  const { id = "" } = useParams(); const booking = useQuery({ queryKey: ["booking", id], queryFn: () => api.booking(id) });
  if (booking.isLoading) return <div className="page container"><Skeleton className="confirmation-loading" /></div>;
  if (booking.isError || !booking.data) return <div className="page container"><ErrorState title="We couldn’t open this booking" detail="Try My Bookings to find your ticket." /></div>;
  const data = booking.data;
  return <div className="page container confirmation-page"><motion.div className="success-orb" initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 14, delay: .1 }}><Check /></motion.div><p className="eyebrow">Booking confirmed</p><h1>Your night is <em>locked in.</em></h1><p className="confirmation-lead">A confirmation has been created for {data.showTitle}. We’ll keep your plans ready in My Bookings.</p><section className="ticket-card"><div className="ticket-card__main"><div className="ticket-label"><Ticket /> EVENTIX TICKET</div><h2>{data.showTitle}</h2><div className="ticket-details"><span><CalendarDays />{dateTime(data.showDateTime)}</span><span><MapPin />{data.venueName}</span><span><UserRound />{data.quantity} {data.quantity === 1 ? "guest" : "guests"}</span></div></div><div className="ticket-card__stub"><span>Booking reference</span><strong>EVX-{String(data.id).padStart(6, "0")}</strong><StatusBadge status={data.status} /><div><span>Amount paid</span><strong>{money(data.totalAmount)}</strong></div></div></section><div className="confirmation-actions"><Link className="button" to="/bookings">View my bookings</Link><Link className="button button--ghost" to="/">Back to home</Link></div><p className="confirmation-note"><Download size={16} />Your booking details stay safely in your account—no download needed.</p></div>;
}
