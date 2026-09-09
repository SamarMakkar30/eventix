package com.eventix.booking.service;

import com.eventix.booking.client.CatalogClient;
import com.eventix.booking.client.InventoryClient;
import com.eventix.booking.client.NotificationClient;
import com.eventix.booking.client.PaymentClient;
import com.eventix.booking.dto.BookingRequest;
import com.eventix.booking.dto.BookingResponse;
import com.eventix.booking.dto.client.PaymentResult;
import com.eventix.booking.dto.client.ShowInfo;
import com.eventix.booking.exception.PaymentFailedException;
import com.eventix.booking.exception.ResourceNotFoundException;
import com.eventix.booking.model.Booking;
import com.eventix.booking.model.BookingStatus;
import com.eventix.booking.repository.BookingRepository;
import com.eventix.booking.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * The orchestrator. A single booking touches four other services in sequence:
 *
 *   1. Catalog   - confirm the show exists, get its price       (read)
 *   2. Inventory - atomically reserve the seats                 (must succeed, or booking fails)
 *   3. Payment   - charge (simulated)                            (may succeed or fail)
 *   4. Notification - best-effort confirmation                   (fire and forget)
 *
 * There's no distributed transaction across these four services - each is its own
 * database, its own commit. Consistency is maintained with a compensating action
 * instead: if payment fails after we already reserved seats, we explicitly release
 * them back (step 3b) rather than leaving them stuck. This is a deliberately simple
 * version of the "saga pattern" - worth naming as such if asked about it.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final JwtService jwtService;
    private final CatalogClient catalogClient;
    private final InventoryClient inventoryClient;
    private final PaymentClient paymentClient;
    private final NotificationClient notificationClient;

    // Do not roll the local booking state back when the simulated payment is declined:
    // the PAYMENT_FAILED record is the audit trail for a completed compensation attempt.
    @Transactional(noRollbackFor = PaymentFailedException.class)
    public BookingResponse create(BookingRequest request, String authorizationHeader) {
        String token = stripBearer(authorizationHeader);
        Long userId = jwtService.extractUserId(token);
        String userEmail = jwtService.extractEmail(token);

        // 1. Catalog - what are we even booking, and what does it cost?
        ShowInfo show = catalogClient.getShow(request.getShowId(), authorizationHeader);
        BigDecimal totalAmount = show.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));

        // 2. Inventory - reserve the seats. If this throws, nothing else has happened
        // yet, so there's nothing to compensate - the booking simply never gets created.
        inventoryClient.decrementSeats(request.getShowId(), request.getQuantity(), authorizationHeader);

        Booking booking = Booking.builder()
                .userId(userId)
                .userEmail(userEmail)
                .showId(request.getShowId())
                .showTitle(show.getTitle())
                .venueName(show.getVenueName())
                .showDateTime(show.getShowDateTime())
                .quantity(request.getQuantity())
                .pricePerTicket(show.getPrice())
                .totalAmount(totalAmount)
                .status(BookingStatus.PENDING)
                .build();
        booking = bookingRepository.save(booking);

        // 3. Payment
        PaymentResult payment = paymentClient.charge(
                booking.getId(), totalAmount, request.isSimulatePaymentFailure(), authorizationHeader);

        if ("SUCCESS".equals(payment.getStatus())) {
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setPaymentId(payment.getId());
            booking = bookingRepository.save(booking);

            // 4. Notification - best-effort, never blocks a successful booking.
            notificationClient.sendBookingConfirmation(
                    userEmail, booking.getId(),
                    String.format("Your booking for %s (%d ticket(s)) is confirmed. Booking ID: BK-%d",
                            show.getTitle(), request.getQuantity(), booking.getId()),
                    authorizationHeader);

            return toResponse(booking);
        } else {
            // 3b. Compensate: payment failed, so give the seats back.
            boolean compensationSucceeded = true;
            try {
                inventoryClient.releaseSeats(request.getShowId(), request.getQuantity(), authorizationHeader);
                log.info("Compensation succeeded: released {} seat(s) for show {} after payment failure for booking {}",
                        request.getQuantity(), request.getShowId(), booking.getId());
            } catch (Exception ex) {
                compensationSucceeded = false;
                log.error("COMPENSATION FAILED: could not release {} seat(s) for show {} after payment failure for booking {}. "
                                + "Inventory may be understated and requires reconciliation.",
                        request.getQuantity(), request.getShowId(), booking.getId(), ex);
            }
            booking.setStatus(BookingStatus.PAYMENT_FAILED);
            bookingRepository.save(booking);
            throw new PaymentFailedException("Payment failed for booking " + booking.getId()
                    + (compensationSucceeded
                    ? " - seats have been released back to inventory"
                    : " - inventory compensation failed; reconciliation is required"));
        }
    }

    public List<BookingResponse> findMyBookings(String authorizationHeader) {
        Long userId = jwtService.extractUserId(stripBearer(authorizationHeader));
        return bookingRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public BookingResponse findById(Long id, String authorizationHeader) {
        Booking booking = getOrThrow(id);
        assertOwnership(booking, authorizationHeader);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse cancel(Long id, String authorizationHeader) {
        Booking booking = getOrThrow(id);
        assertOwnership(booking, authorizationHeader);

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only a CONFIRMED booking can be cancelled (current status: "
                    + booking.getStatus() + ")");
        }

        inventoryClient.releaseSeats(booking.getShowId(), booking.getQuantity(), authorizationHeader);
        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);

        // As with confirmation, notification delivery is best-effort and never
        // changes the completed booking cancellation state.
        notificationClient.sendBookingCancellation(
                booking.getUserEmail(), booking.getId(),
                String.format("Your booking for %s (%d ticket(s)) has been cancelled. Booking ID: BK-%d",
                        booking.getShowTitle(), booking.getQuantity(), booking.getId()),
                authorizationHeader);

        return toResponse(booking);
    }

    private Booking getOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + id + " not found"));
    }

    private void assertOwnership(Booking booking, String authorizationHeader) {
        String token = stripBearer(authorizationHeader);
        Long currentUserId = jwtService.extractUserId(token);
        String role = jwtService.extractRole(token);

        if (!booking.getUserId().equals(currentUserId) && !"ADMIN".equals(role)) {
            throw new AccessDeniedException("Not your booking");
        }
    }

    private String stripBearer(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new AccessDeniedException("Missing or malformed Authorization header");
        }
        return authorizationHeader.substring(7);
    }

    private BookingResponse toResponse(Booking b) {
        return new BookingResponse(b.getId(), b.getShowId(), b.getShowTitle(), b.getVenueName(),
                b.getShowDateTime(), b.getQuantity(), b.getPricePerTicket(), b.getTotalAmount(),
                b.getStatus(), b.getPaymentId(), b.getCreatedAt());
    }
}
