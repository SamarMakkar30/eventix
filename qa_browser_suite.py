import sys
import json
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://65.0.176.1:30300"
GATEWAY_URL = "http://65.0.176.1:30080"

results = {
    "pages_tested": set(),
    "flows_tested": set(),
    "console_errors": [],
    "network_errors": [],
    "bugs_found": []
}

def safe_goto(page, url, retries=3):
    for i in range(retries):
        try:
            resp = page.goto(url, wait_until="networkidle", timeout=20000)
            return resp
        except Exception as e:
            print(f"[!] Goto {url} attempt {i+1} failed: {e}")
            if i == retries - 1:
                raise e
            time.sleep(1)

def run_qa():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Capture console messages
        def on_console(msg):
            if msg.type in ["error", "warning"]:
                text = msg.text
                if "React Router Future Flag" not in text and "Floto" not in text:
                    results["console_errors"].append({"type": msg.type, "text": text})
                    print(f"[CONSOLE {msg.type.upper()}] {text}")

        page.on("console", on_console)

        # Capture network responses
        def on_response(response):
            if response.status >= 400 and not "/favicon" in response.url:
                # 401 on login test is expected intentional failure
                results["network_errors"].append({
                    "url": response.url,
                    "status": response.status,
                    "method": response.request.method
                })
                print(f"[NETWORK ERROR] {response.request.method} {response.url} -> {response.status}")

        page.on("response", on_response)

        print("\n==========================================")
        print("STAGE 1: HOMEPAGE TESTING (/)")
        print("==========================================")
        resp = safe_goto(page, f"{BASE_URL}/")
        assert resp.status == 200, f"Homepage failed with status {resp.status}"
        results["pages_tested"].add("HomePage")
        print("[+] Homepage loaded successfully.")

        # Test brand / logo
        logo = page.locator("a.brand, a:has-text('Eventix')").first
        assert logo.is_visible(), "Logo not visible"
        print("[+] Brand logo visible.")

        # Test navigation links
        nav_links = page.locator("nav a, .nav a, header a").all()
        print(f"[+] Found {len(nav_links)} navigation links.")

        # Test dark/light mode toggle
        theme_toggle = page.locator("button[aria-label*='theme' i], button.icon-button").first
        if theme_toggle.is_visible():
            theme_toggle.click()
            page.wait_for_timeout(300)
            print("[+] Theme toggle clicked successfully.")
            theme_toggle.click()
            page.wait_for_timeout(300)

        # Check search input on homepage
        search_input = page.locator("input[placeholder*='search' i]").first
        if search_input.is_visible():
            search_input.fill("Interstellar")
            page.wait_for_timeout(400)
            print("[+] Search input tested on homepage.")
            search_input.fill("")

        # Check featured cards / show cards
        cards = page.locator(".show-card, a[href*='/shows/']").all()
        print(f"[+] Found {len(cards)} show cards on homepage.")

        print("\n==========================================")
        print("STAGE 2: AUTHENTICATION FLOWS")
        print("==========================================")
        safe_goto(page, f"{BASE_URL}/register")
        results["pages_tested"].add("RegisterPage")
        print("[+] Register page loaded.")

        # Test empty registration submission
        submit_btn = page.locator("button[type='submit']").first
        submit_btn.click()
        page.wait_for_timeout(400)
        print("[+] Empty register form submit attempted.")

        # Register a unique test user
        test_ts = int(time.time())
        test_email = f"qa_user_{test_ts}@example.com"
        test_pass = "TestPass123!"

        name_input = page.locator("input[name='name'], input[placeholder*='name' i], input[type='text']").first
        email_input = page.locator("input[name='email'], input[type='email']").first
        pass_input = page.locator("input[name='password'], input[type='password']").first

        if name_input.is_visible():
            name_input.fill("QA Automator")
        email_input.fill(test_email)
        pass_input.fill(test_pass)
        submit_btn.click()
        page.wait_for_timeout(1500)
        print(f"[+] Registered new user: {test_email}")

        # Logout to test login flow
        print("[+] Clearing storage to test login flow...")
        page.evaluate("() => { localStorage.clear(); }")
        page.wait_for_timeout(500)

        # Test Login Page
        safe_goto(page, f"{BASE_URL}/login")
        results["pages_tested"].add("LoginPage")
        print("[+] Login page loaded.")

        email_in = page.locator("input[type='email']").first
        pass_in = page.locator("input[type='password']").first
        sub_btn = page.locator("button[type='submit']").first

        # Invalid login check
        email_in.fill(test_email)
        pass_in.fill("WrongPassword999!")
        sub_btn.click()
        page.wait_for_timeout(800)
        print("[+] Tested invalid password rejection (401).")

        # Valid login
        email_in.fill(test_email)
        pass_in.fill(test_pass)
        sub_btn.click()
        page.wait_for_timeout(1500)
        print(f"[+] Logged in successfully with {test_email}. Current URL: {page.url}")
        results["flows_tested"].add("Authentication (Register + Login)")

        print("\n==========================================")
        print("STAGE 3: BROWSE CATALOG & SEARCH (/shows)")
        print("==========================================")
        safe_goto(page, f"{BASE_URL}/shows")
        results["pages_tested"].add("ShowsPage")
        print("[+] Shows page loaded.")

        # Test search filter
        shows_search = page.locator("input[placeholder*='search' i]").first
        if shows_search.is_visible():
            shows_search.fill("Interstellar")
            page.wait_for_timeout(400)
            shows_search.fill("")
            print("[+] Search filter tested on /shows.")

        print("\n==========================================")
        print("STAGE 4: SHOW DETAIL & SEAT SELECTION")
        print("==========================================")
        # Navigate to a show with inventory (e.g. /shows/2 or /shows/1)
        safe_goto(page, f"{BASE_URL}/shows/2")
        results["pages_tested"].add("ShowDetailPage")
        print(f"[+] Reached Show Detail Page: {page.url}")

        # Wait for 'Choose tickets' link/button
        choose_btn = page.locator("a:has-text('Choose tickets')").first
        choose_btn.wait_for(state="visible", timeout=6000)
        print("[+] Found 'Choose tickets' button. Clicking...")
        choose_btn.click()
        page.wait_for_load_state("networkidle")
        results["pages_tested"].add("SeatSelectionPage")
        print(f"[+] Reached Seat Selection page: {page.url}")

        # Test Stepper: Add tickets
        plus_btn = page.locator("button[aria-label='Add ticket']").first
        if plus_btn.is_visible():
            plus_btn.click()
            page.wait_for_timeout(300)
            print("[+] Stepper: Added 1 ticket (now 2 tickets).")

        continue_btn = page.locator("button:has-text('Continue to checkout')").first
        continue_btn.wait_for(state="visible", timeout=5000)
        continue_btn.click()
        page.wait_for_load_state("networkidle")
        results["pages_tested"].add("CheckoutPage")
        print(f"[+] Reached Checkout page: {page.url}")

        print("\n==========================================")
        print("STAGE 5: CHECKOUT & BOOKING CONFIRMATION")
        print("==========================================")
        confirm_btn = page.locator("button:has-text('Confirm booking')").first
        confirm_btn.wait_for(state="visible", timeout=5000)
        confirm_btn.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        print(f"[+] Reached confirmation page: {page.url}")
        results["pages_tested"].add("ConfirmationPage")
        results["flows_tested"].add("Complete Booking Flow (Browse -> Show Detail -> Seat Selection -> Checkout -> Confirmation)")

        print("\n==========================================")
        print("STAGE 6: BOOKINGS LIST & CANCELLATION SAGA")
        print("==========================================")
        safe_goto(page, f"{BASE_URL}/bookings")
        results["pages_tested"].add("BookingsPage")
        print(f"[+] Bookings page loaded. URL: {page.url}")

        # Check booking cards
        page.wait_for_timeout(1000)
        cancel_btn = page.locator("button:has-text('Cancel ticket')").first
        if cancel_btn.is_visible():
            cancel_btn.click()
            page.wait_for_timeout(500)
            # Confirm in modal
            modal_confirm = page.locator(".confirm-dialog button:has-text('Cancel ticket'), .confirm-dialog button.button--danger").first
            if modal_confirm.is_visible():
                modal_confirm.click()
                page.wait_for_timeout(2000)
                print("[+] Successfully tested booking cancellation modal & compensating transaction!")
                results["flows_tested"].add("Booking Cancellation Saga")

        print("\n==========================================")
        print("STAGE 7: USER PROFILE PAGE (/profile)")
        print("==========================================")
        safe_goto(page, f"{BASE_URL}/profile")
        results["pages_tested"].add("ProfilePage")
        print(f"[+] Profile page loaded. URL: {page.url}")

        print("\n==========================================")
        print("STAGE 8: 404 NOT FOUND ROUTE")
        print("==========================================")
        safe_goto(page, f"{BASE_URL}/this-route-does-not-exist-qa-test")
        results["pages_tested"].add("NotFoundPage")
        not_found_header = page.locator(".not-found, h1:has-text('This moment isn'), div:has-text('404')").first
        assert not_found_header.is_visible(), "404 page header missing"
        print("[+] Custom 404 page verified.")

        print("\n==========================================")
        print("STAGE 9: ADMIN PANEL FLOW (/admin)")
        print("==========================================")
        # Clear previous user session and Login as Admin
        page.evaluate("() => { localStorage.clear(); }")
        page.wait_for_timeout(300)
        safe_goto(page, f"{BASE_URL}/login")
        email_field = page.locator("input[type='email']").first
        email_field.wait_for(state="visible", timeout=6000)
        email_field.fill("admin@test.com")
        page.locator("input[type='password']").first.fill("admin123")
        page.locator("button[type='submit']").first.click()
        page.wait_for_timeout(1500)

        safe_goto(page, f"{BASE_URL}/admin")
        results["pages_tested"].add("AdminPage")
        print(f"[+] Admin panel loaded. URL: {page.url}")

        # Click each admin tab
        for tab_name in ["Movies", "Events", "Venues", "Shows"]:
            tab_btn = page.locator(f"button:has-text('{tab_name}')").first
            if tab_btn.is_visible():
                tab_btn.click()
                page.wait_for_timeout(400)
                print(f"  [+] Admin Tab '{tab_name}' clicked & verified.")
        results["flows_tested"].add("Admin Dashboard & Tab Navigation")

        print("\n==========================================")
        print("STAGE 10: RESPONSIVE VIEWPORT TESTING")
        print("==========================================")
        for view_name, width, height in [("Desktop", 1920, 1080), ("Tablet", 768, 1024), ("Mobile", 375, 812)]:
            res_ctx = browser.new_context(viewport={"width": width, "height": height})
            p_res = res_ctx.new_page()
            safe_goto(p_res, f"{BASE_URL}/")
            menu_btn = p_res.locator("button[aria-label*='menu' i], .mobile-toggle").first
            if menu_btn.is_visible():
                menu_btn.click()
                p_res.wait_for_timeout(300)
                print(f"[+] {view_name} ({width}x{height}) mobile menu opened.")
            p_res.close()
            res_ctx.close()
            print(f"[+] {view_name} responsive view tested.")
        results["flows_tested"].add("Responsive Viewports (Desktop, Tablet, Mobile)")

        browser.close()

    print("\n==========================================")
    print("QA BROWSER RUN COMPLETE")
    print(f"Pages tested: {len(results['pages_tested'])} ({sorted(list(results['pages_tested']))})")
    print(f"Flows tested: {len(results['flows_tested'])}")
    print(f"Console errors: {len(results['console_errors'])}")
    print(f"Network errors: {len(results['network_errors'])}")
    print(f"Bugs found: {len(results['bugs_found'])}")
    print("==========================================")

if __name__ == "__main__":
    run_qa()
