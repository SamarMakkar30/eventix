"""
Load test for Eventix - simulates a ticket-release rush against Booking Service.

This is the actual proof behind the project's central claim: that Kubernetes
scales pods up in response to real traffic, and back down once it subsides.

Run it against the API Gateway (not an individual service directly), same as a
real browser would - see load-testing/README.md for the full walkthrough,
including why you need a show with a very large seat count before running this.
"""

import os
import random
import string

from locust import HttpUser, task, between

# The show being "booked" during the load test. Point this at a show you
# created specifically for load testing (see README) - one with a huge
# totalSeats value, so the test measures traffic-driven scaling, not how fast
# a small show sells out.
SHOW_ID = int(os.environ.get("LOCUST_SHOW_ID", "1"))


def random_email():
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"loadtest-{suffix}@example.com"


class TicketBuyer(HttpUser):
    # Simulated think-time between actions - a real user doesn't fire requests
    # back-to-back with zero delay, and a totally unthrottled loop would just
    # measure Locust's own request ceiling rather than realistic user behavior.
    wait_time = between(0.5, 2)

    def on_start(self):
        # Each simulated user registers once and reuses the same token for
        # every booking request during the run. Deliberate: the load this test
        # is measuring is Booking Service's (and what it calls), not Auth
        # Service's - re-authenticating on every request would blur that.
        email = random_email()
        response = self.client.post(
            "/api/auth/register",
            json={"name": "Load Test User", "email": email, "password": "loadtest123"},
            name="/api/auth/register [setup]",
        )
        token = response.json()["token"]
        self.auth_headers = {"Authorization": f"Bearer {token}"}

    @task
    def book_a_ticket(self):
        self.client.post(
            "/api/bookings",
            json={"showId": SHOW_ID, "quantity": 1},
            headers=self.auth_headers,
            name="/api/bookings [book]",
        )
