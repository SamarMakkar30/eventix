# payment-service

Simulated payment processing. **Phase 4 - implemented.**

## Endpoints (direct, port 8085 - via gateway: `/api/payments/...`)

```bash
# Process a payment (called by Booking Service on your behalf, normally)
curl -X POST http://localhost:8085/payments \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"bookingId": 1, "amount": 500, "simulateFailure": false}'

curl http://localhost:8085/payments/1 -H "Authorization: Bearer <token>"
```

`simulateFailure` is a **demo/testing aid only** - it lets you deterministically
trigger the failure path (and watch Booking Service's compensating inventory release
happen) without depending on random chance during a live demo. A real payment
integration would never let the client dictate success or failure like this - say so
explicitly if asked in your viva, it shows you understand it's a simplification.

All endpoints require a logged-in user (any role) - no public access, no admin distinction.
