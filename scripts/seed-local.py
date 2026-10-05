#!/usr/bin/env python3
"""Development-only Eventix API seed script.

Run against an already running local stack. An admin JWT is required because the
public registration API only creates customer accounts and the catalog endpoints
are role protected. Obtain it from a local admin account; this script never
modifies the database directly.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE_URL = os.environ.get("EVENTIX_API_URL", "http://localhost:8080").rstrip("/")
ADMIN_TOKEN = os.environ.get("EVENTIX_ADMIN_TOKEN")


def request(path: str, method: str = "GET", body: dict | None = None, token: str | None = None):
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        with urlopen(Request(f"{BASE_URL}{path}", data=data, method=method, headers=headers), timeout=15) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except HTTPError as error:
        message = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} failed ({error.code}): {message}") from error


def upsert_customer() -> None:
    try:
        request("/api/auth/register", "POST", {"name": "Eventix Demo Customer", "email": "customer@test.com", "password": "customer123"})
        print("Created demo customer: customer@test.com / customer123")
    except RuntimeError as error:
        if "409" in str(error):
            print("Demo customer already exists.")
        else:
            raise


def main() -> None:
    upsert_customer()
    if not ADMIN_TOKEN:
        print("Catalog seed skipped: set EVENTIX_ADMIN_TOKEN to an existing local ADMIN JWT.")
        print("The public API does not expose an admin-registration endpoint, so this script cannot safely invent one.")
        return

    venues = [
        {"name": "Orion Screen One", "address": "18 Park Street", "city": "Bengaluru"},
        {"name": "The Courtyard", "address": "44 Residency Road", "city": "Bengaluru"},
        {"name": "Harbour Hall", "address": "3 Marine Drive", "city": "Mumbai"},
    ]
    venue_ids = [request("/api/catalog/venues", "POST", venue, ADMIN_TOKEN)["id"] for venue in venues]

    movies = [
        {"title": "After the Monsoon", "description": "A quiet city mystery where a missing photograph redraws an old friendship.", "genre": "Drama", "language": "Hindi", "durationMinutes": 118, "posterUrl": "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80", "rating": 4.2},
        {"title": "Second Showing", "description": "Two strangers find a little more than a late film in a nearly empty cinema.", "genre": "Romance", "language": "English", "durationMinutes": 104, "posterUrl": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80", "rating": 4.0},
        {"title": "Northbound", "description": "A road trip becomes a tender story about finding a way home.", "genre": "Adventure", "language": "Hindi", "durationMinutes": 126, "posterUrl": "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80", "rating": 4.4},
    ]
    movie_ids = [request("/api/catalog/movies", "POST", movie, ADMIN_TOKEN)["id"] for movie in movies]

    events = [
        {"name": "A Night of Small Rooms", "description": "An intimate evening of new voices and live music.", "category": "Music", "bannerUrl": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"},
        {"name": "The Long Table", "description": "An immersive dinner shaped around seasonal Indian ingredients.", "category": "Food", "bannerUrl": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80"},
    ]
    event_ids = [request("/api/catalog/events", "POST", event, ADMIN_TOKEN)["id"] for event in events]

    tomorrow = datetime.now(timezone.utc).replace(hour=14, minute=0, second=0, microsecond=0) + timedelta(days=1)
    shows = [
        {"showType": "MOVIE", "movieId": movie_ids[0], "eventId": None, "venueId": venue_ids[0], "showDateTime": (tomorrow + timedelta(days=offset)).isoformat(), "price": price, "totalSeats": 120}
        for offset, price in [(0, 280), (2, 320), (4, 280)]
    ] + [
        {"showType": "EVENT", "movieId": None, "eventId": event_ids[0], "venueId": venue_ids[1], "showDateTime": (tomorrow + timedelta(days=1, hours=5)).isoformat(), "price": 799, "totalSeats": 80},
        {"showType": "EVENT", "movieId": None, "eventId": event_ids[1], "venueId": venue_ids[2], "showDateTime": (tomorrow + timedelta(days=5, hours=4)).isoformat(), "price": 1299, "totalSeats": 60},
    ]
    for show in shows:
        request("/api/catalog/shows", "POST", show, ADMIN_TOKEN)
    print(f"Seeded {len(venues)} venues, {len(movies)} movies, {len(events)} events, and {len(shows)} shows.")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        print(error, file=sys.stderr)
        sys.exit(1)
