# Load testing - the autoscaling demo (Phase 10)

This is the actual proof behind the project's central claim. Everything before
this phase built the system; this phase demonstrates it working under load.

## Read this first: docker-compose cannot show autoscaling

Horizontal Pod Autoscaling is a **Kubernetes** feature - it doesn't exist in
plain `docker compose`, which has no concept of replicas or an autoscaler at
all. You can (and should) run this load test against your local docker-compose
stack first, but only to confirm the booking flow itself holds up under
concurrent load and doesn't throw unexpected errors. **To actually see pods
scale, this must run against a real Kubernetes deployment** - either the k3s
cluster from Phase 9, or a local Minikube/Kind cluster if you want to rehearse
before paying for EC2 time.

## Step 1 - create a show built for load testing, not for selling out

If you load-test against a normal show (say, 50 seats), it sells out in the
first few seconds and every subsequent request becomes a legitimate `409 Not
enough seats` - which is correct behavior, but it means the rest of your test
measures error handling, not scaling. Create a dedicated show with a huge seat
count instead:

```bash
curl -X POST http://<gateway-host>:8080/api/catalog/shows \
  -H "Content-Type: application/json" -H "Authorization: Bearer <admin-token>" \
  -d '{"showType":"MOVIE","movieId":1,"venueId":1,"showDateTime":"2026-12-31T23:59:00","price":250,"totalSeats":100000}'
```

Note the `id` this returns - that's your `LOCUST_SHOW_ID`.

## Step 2 - install and run Locust

```bash
cd load-testing
pip install -r requirements.txt
LOCUST_SHOW_ID=<id from step 1> locust -f locustfile.py --host=http://<gateway-host>:8080
```

Open `http://localhost:8089` - Locust's web UI. Start with **100-200 users**,
spawn rate **10-20/s**, and watch what happens; increase if replica counts
haven't moved after a few minutes (exact numbers depend on your instance size -
see the calibration note below).

## Step 3 - watch it happen live (this is your demo)

In separate terminals, before or while the test is running:

```bash
# Watch replica counts change in real time
kubectl get hpa -n eventix -w

# Watch pods actually being created
kubectl get pods -n eventix -l app=booking-service -w
```

Expected sequence: CPU utilization climbs -> crosses the 60% threshold set in
`infrastructure/k8s/booking-service/hpa.yaml` -> HPA increases replicas (2 up
toward 10) -> you stop the Locust test -> replicas scale back down after
Kubernetes' default 5-minute stabilization window (this delay is intentional,
not a bug - it stops the system from flapping replicas up and down on every
small traffic fluctuation).

## A genuinely useful side effect, not a bug

A single booking touches Catalog, Inventory, Payment, and Notification, not
just Booking Service. You'll likely see **several services scale together**,
not just one in isolation - which is actually a stronger demonstration than a
single service scaling alone, since it shows the whole architecture responding
as a system, not one cherry-picked example.

## Calibration note

There's no universally "correct" number of simulated users - it depends on
your instance size (`t3.medium` by default) and how many other pods are
already competing for that CPU. If nothing scales after 5+ minutes at 200
users, increase toward 500; if pods are scaling within seconds, that's a
perfectly good result too, don't chase a specific number just for its own sake.

## This same test feeds Phase 11

Prometheus and Grafana (next phase) will visualize exactly this: requests/sec,
CPU, and replica count climbing together on a live dashboard, using this exact
load test as the traffic source. No need to design a second test.
