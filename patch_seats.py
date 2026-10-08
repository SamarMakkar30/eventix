import io

p = r"C:\Users\91981\Downloads\eventix-starter\frontend\src\pages\seat-selection.tsx"
s = io.open(p, encoding="utf-8").read()

# -- A) seat map JSX: clickable labeled seats, row labels, aisle, centered screen --
old_map = '''            <div className="seat-section">
              <div className="stage-v2">Screen this way</div>
              <div className="seat-map" role="img" aria-label={`Representative seat map: ${bookedCount} of ${totalVisual} shown seats booked, ${quantity} selected`}>
                {Array.from({ length: ROWS }, (_, r) => (
                  <div key={r} className="seat-row" aria-hidden="true">
                    {Array.from({ length: COLS }, (_, c) => {
                      const i = r * COLS + c;
                      const state = seatState(i);
                      return (
                        <div
                          key={c}
                          className={`seat-v2${state === "booked" ? " seat-v2--booked" : state === "selected" ? " seat-v2--selected" : ""}`}
                          style={{ transitionDelay: `${(i % COLS) * 8}ms`, marginRight: c === Math.floor(COLS / 2) - 1 ? "1.25rem" : undefined }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="seat-legend" style={{ marginTop: "1.25rem", justifyContent: "center" }}>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-surface)", border: "1px solid var(--ev-border-strong)" }} />
                  Free
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-accent)", boxShadow: "0 0 0 3px var(--ev-gold-wash)" }} />
                  Your pick
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-bg-raised)", opacity: 0.4 }} />
                  Booked
                </div>
              </div>
            </div>'''

new_map = '''            <div className="seat-section">
              <div className="stage-v2" aria-hidden="true">Screen this way</div>
              <div className="seat-map" role="group" aria-label="Seat map — click seats to pick or release them">
                {Array.from({ length: ROWS }, (_, r) => {
                  const aisleAfter = Math.floor(COLS / 2) - 1;
                  return (
                    <div key={r} className="seat-row">
                      <span className="seat-row__label" aria-hidden="true">{String.fromCharCode(65 + r)}</span>
                      {Array.from({ length: COLS }, (_, c) => {
                        const i = r * COLS + c;
                        const booked = isBooked(i);
                        const isSelected = selected.has(i);
                        return (
                          <button
                            key={c}
                            type="button"
                            className={`seat-v2${booked ? " seat-v2--booked" : isSelected ? " seat-v2--selected" : ""}`}
                            onClick={() => toggleSeat(i)}
                            disabled={booked}
                            aria-pressed={isSelected}
                            aria-label={`Seat ${seatLabel(r, c)}${booked ? " — booked" : isSelected ? " — selected" : " — available"}`}
                            title={`${seatLabel(r, c)}${booked ? " · Booked" : isSelected ? " · Your pick" : " · Available"}`}
                          />
                        );
                      }).flatMap((el, c) => (
                        c === aisleAfter ? [el, <span key={`aisle-${c}`} className="seat-row__aisle" aria-hidden="true" />] : [el]
                      ))}
                      <span className="seat-row__label" aria-hidden="true">{String.fromCharCode(65 + r)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="seat-selection-bar" aria-live="polite">
                <span className="seat-selection-bar__count">
                  {quantity === 0 ? "No seats picked" : `${quantity} seat${quantity > 1 ? "s" : ""} picked`}
                  <span style={{ color: "var(--ev-text-subtle)", fontWeight: 500 }}> / up to {maxQty}</span>
                </span>
                {selectedLabels.length > 0 && (
                  <span className="seat-selection-bar__seats">{selectedLabels.join(" \\u00b7 ")}</span>
                )}
                {selectedLabels.length > 0 && (
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ marginLeft: "auto", padding: "0.25rem 0.625rem" }}
                    onClick={() => setPicked(new Set())}
                  >
                    <X size={13} aria-hidden="true" /> Clear
                  </button>
                )}
              </div>
              <div className="seat-legend" style={{ marginTop: "1.25rem", justifyContent: "center" }}>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-surface)", border: "1px solid var(--ev-border-strong)" }} />
                  Available \\u2014 click to pick
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-accent)", boxShadow: "0 0 0 3px var(--ev-gold-wash)" }} />
                  Your pick \\u2014 click to release
                </div>
                <div className="seat-legend-item">
                  <div className="seat-legend-dot" style={{ background: "var(--ev-bg-raised)", opacity: 0.4 }} />
                  Booked
                </div>
              </div>
            </div>'''

assert old_map in s, "seat map block not found"
s = s.replace(old_map, new_map)

# -- B) replace quantity stepper card with a 'how picking works' card --
start_marker = '            <motion.div\n              className="quantity-stepper"'
end_marker = '            <motion.div\n              className="order-summary glass"'
start = s.find(start_marker)
end = s.find(end_marker)
assert start != -1 and end != -1, "stepper bounds not found"

stepper_replacement = '''            <motion.div
              className="card"
              style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <div style={{ fontWeight: 650 }}>How picking works</div>
              <p style={{ fontSize: "0.9rem", color: "var(--ev-text-muted)", lineHeight: 1.7 }}>
                Click any free seat on the map to add it \\u2014 click again to release. We\\u2019ll
                hold up to <strong>{maxQty}</strong> seats per booking.
              </p>
              {available > 0 && available < 20 && (
                <div style={{ fontSize: "0.8125rem", color: "var(--ev-danger)", fontWeight: 600 }}>
                  Only {available} seats remaining \\u2014 pick fast!
                </div>
              )}
              {available === 0 && (
                <div style={{ fontSize: "0.8125rem", color: "var(--ev-text-subtle)" }}>
                  This show just sold out \\u2014 try another date.
                </div>
              )}
              <p className="kbd-hint">Seats auto-release if availability changes while you pick.</p>
            </motion.div>

'''
s = s[:start] + stepper_replacement + s[end:]

# -- C) summary shows picked seats; CTA gated on >= 1 seat --
old_row = '''                <span className="order-summary__label">{money(show.price)} \\u00d7 {quantity} ticket{quantity > 1 ? "s" : ""}</span>'''
new_row = '''                <span className="order-summary__label">
                  {money(show.price)} \\u00d7 {quantity} ticket{quantity > 1 ? "s" : ""}
                  {selectedLabels.length > 0 && <> \\u00b7 seats {selectedLabels.join(", ")}</>}
                </span>'''
assert old_row in s, "summary row not found"
s = s.replace(old_row, new_row)

old_cta = '''                <button
                  className="btn btn--primary btn--lg btn-shine"
                  style={{ width: "100%" }}
                  onClick={handleProceed}
                >
                  Continue to checkout <ArrowRight size={17} aria-hidden="true" />
                </button>'''
new_cta = '''                <button
                  className="btn btn--primary btn--lg btn-shine"
                  style={{ width: "100%" }}
                  onClick={handleProceed}
                  disabled={quantity < 1}
                >
                  {quantity < 1
                    ? "Pick your seats to continue"
                    : <>Continue to checkout <ArrowRight size={17} aria-hidden="true" /></>}
                </button>'''
assert old_cta in s, "cta not found"
s = s.replace(old_cta, new_cta)

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("part 3 done")
