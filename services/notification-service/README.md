# notification-service

Sends simulated, persisted, and logged booking notifications. **Phase 4 - implemented.**

## Endpoints (direct, port 8086 - via gateway: `/api/notifications/...`)

```bash
curl -X POST http://localhost:8086/notifications \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"userEmail":"asha@example.com","bookingId":1,"subject":"Booking confirmed","message":"..."}'

curl http://localhost:8086/notifications/1 -H "Authorization: Bearer <token>"
```

"Sending" means: log it loudly (`docker compose logs notification-service`) and store
a `Notification` row. Swapping in a real provider (SES, SendGrid, etc.) later only
touches `NotificationService.send()` - callers never see the difference, since they
only depend on the request/response DTOs.

Booking Service sends a confirmation after a successful payment and a cancellation
notification after inventory has been successfully released. It sends no notification
for a simulated payment failure. Delivery is best-effort from Booking Service's point
of view: a notification outage is logged but never reverses a confirmed payment or a
completed cancellation.
