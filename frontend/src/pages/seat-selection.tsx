import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/eventix";
import { SeatSelector } from "../components/seat-selector";
import { Button, ErrorState, Skeleton } from "../components/ui";
import { useAuth } from "../context/auth-context";
import { saveBookingDraft } from "../lib/booking-draft";
import { dateTime, money } from "../lib/utils";

export function SeatSelectionPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate(); const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const show = useQuery({ queryKey: ["show", id], queryFn: () => api.show(id) });
  const inventory = useQuery({ queryKey: ["inventory", id], queryFn: () => api.inventory(id) });
  if (show.isLoading || inventory.isLoading) return <div className="page container"><Skeleton className="detail-loading-title" /><Skeleton className="seat-loading" /></div>;
  if (show.isError || inventory.isError || !show.data || !inventory.data) return <div className="page container"><ErrorState title="Availability isn’t available" detail="We couldn’t retrieve the live ticket availability for this show." retry={() => { show.refetch(); inventory.refetch(); }} /></div>;
  if (inventory.data.availableSeats <= 0) return <Navigate to={`/shows/${id}`} replace />;
  const continueBooking = () => { saveBookingDraft({ show: show.data, quantity, availableSeats: inventory.data!.availableSeats }); navigate(isAuthenticated ? "/checkout" : `/login?next=/shows/${id}/seats`); };
  return <div className="page container booking-page"><div className="booking-header"><Link className="breadcrumb" to={`/shows/${id}`}>Show details <span>/</span> Tickets</Link><h1>Pick the perfect number.</h1><p><CalendarDays size={16} />{show.data.title} · {dateTime(show.data.showDateTime)} · <MapPin size={16} />{show.data.venueName}</p></div><div className="booking-grid"><SeatSelector quantity={quantity} available={inventory.data.availableSeats} onChange={setQuantity} /><aside className="order-summary"><p className="eyebrow">Your order</p><h2>{show.data.title}</h2><div className="summary-line"><span>Tickets × {quantity}</span><strong>{money(show.data.price * quantity)}</strong></div><div className="summary-line"><span>Booking fee</span><strong>₹0</strong></div><div className="summary-total"><span>Total</span><strong>{money(show.data.price * quantity)}</strong></div><Button onClick={continueBooking}>Continue to checkout <ArrowRight size={17} /></Button><p className="secure-note"><ShieldCheck size={15} />Live availability is reconfirmed when you book.</p></aside></div></div>;
}
