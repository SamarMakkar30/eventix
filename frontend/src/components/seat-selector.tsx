import { Minus, Plus, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui";

export function SeatSelector({
  quantity,
  available,
  onChange,
}: {
  quantity: number;
  available: number;
  onChange: (value: number) => void;
}) {
  const max = Math.min(available, 10);
  const seatCount = Math.min(available, 60);

  return (
    <section className="quantity-selector" aria-labelledby="ticket-count-title">
      <div>
        <span className="eyebrow">Ticket quantity</span>
        <h2 id="ticket-count-title">Choose your places</h2>
        <p>
          This show uses general-admission inventory. Your booking is securely
          reserved by quantity.
        </p>
      </div>
      <div className="quantity-stepper">
        <Button
          className="icon-button"
          aria-label="Remove ticket"
          disabled={quantity <= 1}
          onClick={() => onChange(quantity - 1)}
        >
          <Minus size={18} />
        </Button>
        <output aria-live="polite">
          <Users size={18} />
          <AnimatePresence mode="wait">
            <motion.strong
              key={quantity}
              initial={{ opacity: 0, y: -12, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.8 }}
              transition={{ type: "spring", damping: 16, stiffness: 280 }}
            >
              {quantity}
            </motion.strong>
          </AnimatePresence>
          <span>{quantity === 1 ? "ticket" : "tickets"}</span>
        </output>
        <Button
          className="icon-button"
          aria-label="Add ticket"
          disabled={quantity >= max}
          onClick={() => onChange(quantity + 1)}
        >
          <Plus size={18} />
        </Button>
      </div>
      <div className="capacity-visual" aria-hidden="true">
        <div className="screen">EVENTIX STAGE</div>
        <div className="seat-field">
          {Array.from({ length: seatCount }, (_, index) => (
            <motion.i
              key={index}
              className={index < quantity ? "selected" : ""}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.012,
                type: "spring",
                damping: 14,
                stiffness: 200,
              }}
            />
          ))}
        </div>
      </div>
      <p className="inventory-note">
        <span className="legend-dot legend-dot--available" />
        {available} tickets currently available{" "}
        {available > 10 && <span>· You can select up to 10 per order</span>}
      </p>
    </section>
  );
}
