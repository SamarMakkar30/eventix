package com.eventix.booking.service;

import com.eventix.booking.client.CatalogClient;
import com.eventix.booking.client.InventoryClient;
import com.eventix.booking.client.NotificationClient;
import com.eventix.booking.client.PaymentClient;
import com.eventix.booking.dto.BookingRequest;
import com.eventix.booking.dto.client.PaymentResult;
import com.eventix.booking.dto.client.ShowInfo;
import com.eventix.booking.exception.PaymentFailedException;
import com.eventix.booking.model.Booking;
import com.eventix.booking.model.BookingStatus;
import com.eventix.booking.repository.BookingRepository;
import com.eventix.booking.security.JwtService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    private static final String AUTHORIZATION = "Bearer test-token";

    @Mock private BookingRepository bookingRepository;
    @Mock private JwtService jwtService;
    @Mock private CatalogClient catalogClient;
    @Mock private InventoryClient inventoryClient;
    @Mock private PaymentClient paymentClient;
    @Mock private NotificationClient notificationClient;
    @Mock private MeterRegistry meterRegistry;
    @Mock private Counter counter;

    @InjectMocks private BookingService bookingService;

    @Test
    void paymentFailureReleasesSeatsAndPersistsFailedBooking() {
        BookingRequest request = bookingRequest(true);
        ShowInfo show = show();
        PaymentResult failedPayment = new PaymentResult();
        failedPayment.setStatus("FAILED");

        when(jwtService.extractUserId("test-token")).thenReturn(7L);
        when(jwtService.extractEmail("test-token")).thenReturn("customer@example.com");
        when(catalogClient.getShow(2L, AUTHORIZATION)).thenReturn(show);
        when(paymentClient.charge(anyLong(), any(), eq(true), eq(AUTHORIZATION))).thenReturn(failedPayment);
        when(meterRegistry.counter(anyString())).thenReturn(counter);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            if (booking.getId() == null) {
                booking.setId(41L);
            }
            return booking;
        });

        assertThrows(PaymentFailedException.class, () -> bookingService.create(request, AUTHORIZATION));

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository, times(2)).save(bookingCaptor.capture());
        assertEquals(BookingStatus.PAYMENT_FAILED, bookingCaptor.getAllValues().get(1).getStatus());
        verify(inventoryClient).decrementSeats(2L, 2, AUTHORIZATION);
        verify(inventoryClient).releaseSeats(2L, 2, AUTHORIZATION);
        verify(notificationClient, never()).sendBookingConfirmation(anyString(), anyLong(), anyString(), anyString());
    }

    @Test
    void cancellationReleasesInventoryBeforePersistingStatusAndSendsNotification() {
        Booking confirmed = Booking.builder()
                .id(41L)
                .userId(7L)
                .userEmail("customer@example.com")
                .showId(2L)
                .showTitle("Interstellar - IMAX")
                .quantity(2)
                .status(BookingStatus.CONFIRMED)
                .build();

        when(bookingRepository.findById(41L)).thenReturn(Optional.of(confirmed));
        when(jwtService.extractUserId("test-token")).thenReturn(7L);
        when(jwtService.extractRole("test-token")).thenReturn("CUSTOMER");
        when(bookingRepository.save(confirmed)).thenReturn(confirmed);

        bookingService.cancel(41L, AUTHORIZATION);

        verify(inventoryClient).releaseSeats(2L, 2, AUTHORIZATION);
        verify(bookingRepository).save(confirmed);
        verify(notificationClient).sendBookingCancellation(
                eq("customer@example.com"), eq(41L), contains("BK-41"), eq(AUTHORIZATION));
        assertEquals(BookingStatus.CANCELLED, confirmed.getStatus());
    }

    private BookingRequest bookingRequest(boolean simulatePaymentFailure) {
        BookingRequest request = new BookingRequest();
        request.setShowId(2L);
        request.setQuantity(2);
        request.setSimulatePaymentFailure(simulatePaymentFailure);
        return request;
    }

    private ShowInfo show() {
        ShowInfo show = new ShowInfo();
        show.setId(2L);
        show.setTitle("Interstellar - IMAX");
        show.setVenueName("Eventix Arena");
        show.setShowDateTime(LocalDateTime.of(2026, 9, 20, 19, 30));
        show.setPrice(BigDecimal.valueOf(200));
        return show;
    }
}
