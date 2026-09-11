import { Minus, Plus, Users } from "lucide-react";
import { Button } from "./ui";

export function SeatSelector({ quantity, available, onChange }: { quantity: number; available: number; onChange: (value: number) => void }) {
  const max = Math.min(available, 10);
  return <section className="quantity-selector" aria-labelledby="ticket-count-title">
    <div><span className="eyebrow">Ticket quantity</span><h2 id="ticket-count-title">Choose your places</h2><p>This show uses general-admission inventory. Your booking is securely reserved by quantity.</p></div>
    <div className="quantity-stepper"><Button className="icon-button" aria-label="Remove ticket" disabled={quantity <= 1} onClick={() => onChange(quantity - 1)}><Minus size={18} /></Button><output aria-live="polite"><Users size={18} /><strong>{quantity}</strong><span>{quantity === 1 ? "ticket" : "tickets"}</span></output><Button className="icon-button" aria-label="Add ticket" disabled={quantity >= max} onClick={() => onChange(quantity + 1)}><Plus size={18} /></Button></div>
    <div className="capacity-visual" aria-hidden="true"><div className="screen">EVENTIX STAGE</div><div className="seat-field">{Array.from({ length: Math.min(available, 60) }, (_, index) => <i key={index} className={index < quantity ? "selected" : ""} />)}</div></div>
    <p className="inventory-note"><span className="legend-dot legend-dot--available" />{available} tickets currently available {available > 10 && <span>· You can select up to 10 per order</span>}</p>
  </section>;
}
