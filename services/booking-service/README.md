# booking-service

The orchestrator. **Phase 4 - implemented.** This is the service that turns Auth,
Catalog, Inventory, Payment, and Notification into an actual product.

## What one `POST /bookings` call does, in order

1. **Catalog** - `GET /catalog/shows/{id}` to confirm the show exists and get its price
2. **Inventory** - `POST /inventory/shows/{id}/decrement` to atomically reserve the seats.
   If this fails (not enough seats), the whole request fails here - nothing else happens.
3. Booking row saved with status `PENDING`
4. **Payment** - `POST /payments` (simulated charge)
   - **Success** -> booking becomes `CONFIRMED`, then **Notification** is fired
     best-effort (a failed confirmation email doesn't undo a paid booking)
   - **Failure** -> Inventory is told to `release` the seats back (the compensating
     action), booking becomes `PAYMENT_FAILED`, and the API returns `402 Payment Required`

There's no distributed transaction spanning these services - each has its own
database. Consistency comes from that explicit compensating step, not from two-phase
commit. This is a simplified version of the **saga pattern**, and naming it that in
your report/viva is a genuinely accurate, not just decorative, thing to say.

## Endpoints (direct, port 8084 - via gateway: `/api/bookings/...`)

```bash
# Book 2 tickets for show 1 (happy path)
curl -X POST http://localhost:8084/bookings \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"showId": 1, "quantity": 2}'

# Force the payment-failure / compensation path on demand
curl -X POST http://localhost:8084/bookings \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"showId": 1, "quantity": 2, "simulatePaymentFailure": true}'

# Your own bookings only
curl http://localhost:8084/bookings -H "Authorization: Bearer <token>"

# A specific booking (yours, or any booking if you're ADMIN)
curl http://localhost:8084/bookings/1 -H "Authorization: Bearer <token>"

# Cancel a CONFIRMED booking (releases the seats back)
curl -X POST http://localhost:8084/bookings/1/cancel -H "Authorization: Bearer <token>"
```

## Ownership

`GET /bookings/{id}` and `POST /bookings/{id}/cancel` check that the booking belongs
to the caller (matched by the `userId` claim in the JWT) unless the caller is an
ADMIN. A non-owner gets a `403`, not a `404` - so you can't even tell whether someone
else's booking ID exists.

## Phase 4 API reference

All Booking, Payment, and Notification endpoints require an `Authorization: Bearer
<customer-jwt>` header. The Booking Service propagates that header to its downstream
calls, so all Phase 4 services use the shared `JWT_SECRET` configured in
`docker-compose.yml`.

| Service | Direct port | Endpoint | Result |
|---|---:|---|---|
| Booking | 8084 | `POST /bookings` | Creates a confirmed booking, or returns a payment failure after compensation. |
| Booking | 8084 | `GET /bookings` | Lists the authenticated customer's bookings. |
| Booking | 8084 | `GET /bookings/{id}` | Returns an owned booking; admins can retrieve any booking. |
| Booking | 8084 | `POST /bookings/{id}/cancel` | Cancels a confirmed booking and releases its seats. |
| Payment | 8085 | `POST /payments` | Simulates a `SUCCESS` or `FAILED` payment; normally called by Booking Service. |
| Payment | 8085 | `GET /payments/{id}` | Retrieves a payment record. |
| Notification | 8086 | `POST /notifications` | Persists and logs a simulated notification; normally called by Booking Service. |
| Notification | 8086 | `GET /notifications/{id}` | Retrieves a notification record. |

The gateway exposes the same routes under `/api`, for example
`http://localhost:8080/api/bookings`. Service-to-service URLs use Docker service
names (`catalog-service`, `inventory-service`, `payment-service`, and
`notification-service`), never `localhost`.

### Requests and responses

```json
POST /bookings
{
  "showId": 2,
  "quantity": 2,
  "simulatePaymentFailure": false
}
```

Successful creation returns `201 Created` with a response like:

```json
{
  "id": 17,
  "showId": 2,
  "quantity": 2,
  "pricePerTicket": 200,
  "totalAmount": 400,
  "status": "CONFIRMED",
  "paymentId": 23
}
```

Set `simulatePaymentFailure` to `true` to test the deterministic failure path. It
returns `402 Payment Required`; the persisted booking has status `PAYMENT_FAILED`
and its payment record has status `FAILED`. The failed booking is intentionally kept
as an audit trail, but it is never confirmed.

Validation errors, including `quantity <= 0`, return `400`. A show or inventory
record that does not exist returns `404`; insufficient seats returns `409`; an absent
or invalid JWT is rejected by Spring Security; a missing booking returns `404`; and a
second cancellation of the same booking returns `409` because only `CONFIRMED`
bookings can be cancelled.

### State transitions and notifications

For the standard Show #2 walkthrough, whose starting inventory is 10 total / 6
available:

```text
POST /bookings quantity 2, payment succeeds
  inventory: 6 -> 4
  booking:   PENDING -> CONFIRMED
  payment:   SUCCESS
  notification: persisted and logged with a confirmation subject

POST /bookings quantity 2, simulatePaymentFailure true
  inventory: 4 -> 2 -> 4
  booking:   PENDING -> PAYMENT_FAILED
  payment:   FAILED
  notification: none

POST /bookings/{successfulBookingId}/cancel
  inventory: 4 -> 6
  booking:   CONFIRMED -> CANCELLED
  notification: persisted and logged with a cancellation subject
```

Payment compensation is best-effort. If an inventory release fails, Booking Service
logs `COMPENSATION FAILED` with the booking and show IDs and persists the booking as
`PAYMENT_FAILED` for reconciliation; it never reports that booking as confirmed.
Cancellation is stricter: the booking is marked `CANCELLED` only after inventory
release succeeds. Notification delivery is intentionally best-effort and does not
undo an otherwise-completed confirmation or cancellation.

### Reproducible Docker walkthrough

```bash
docker compose config
docker compose build booking-service payment-service notification-service
docker compose up -d
docker compose ps
curl http://localhost:8083/inventory/shows/2
```

With a valid customer token stored only in your shell, run the successful request,
verify available seats are 4, inspect `docker compose logs notification-service`,
then run the simulated failure request and verify availability has returned to 4.
Finally cancel the successful booking and verify it returns to 6. Do not include the
token in committed scripts, logs, or documentation.

## Denormalized snapshots

`Booking` stores `showTitle`, `venueName`, and `showDateTime` as a copy taken at
booking time, not a live reference. That's deliberate: your booking history should
still read correctly even if a show's details are edited or removed from Catalog
later - a well-known microservices data-modeling pattern, not an oversight.

## Testing the full flow end-to-end

```bash
docker compose up --build booking-service catalog-service inventory-service \
  payment-service notification-service auth-service postgres
```

1. Register, login, create a movie + venue + show (Phases 1-3), note the show's `id`
   and check `GET /inventory/shows/{id}` shows full availability.
2. `POST /bookings` for 2 tickets on that show (happy path) - confirm you get back a
   `CONFIRMED` booking with a `paymentId`.
3. Check `GET /inventory/shows/{id}` again - `availableSeats` should have dropped by 2.
4. Check `docker compose logs notification-service` - you should see the "Notification
   sent" log line for that booking.
5. `POST /bookings` again with `"simulatePaymentFailure": true` - confirm you get a
   `402`, and check inventory again - the seats you just "took" should be back
   (proving the compensation actually ran, not just that the request failed).
6. Cancel your successful booking from step 2, confirm inventory goes back up again.

If all six work, you have a complete, demonstrable booking flow - this is genuinely
the centerpiece of your whole synopsis. Commit it ("Phase 4: Booking, Payment,
Notification Services") before moving on.
