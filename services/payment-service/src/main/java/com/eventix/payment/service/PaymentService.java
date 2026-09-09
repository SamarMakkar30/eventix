package com.eventix.payment.service;

import com.eventix.payment.dto.PaymentRequest;
import com.eventix.payment.dto.PaymentResponse;
import com.eventix.payment.exception.ResourceNotFoundException;
import com.eventix.payment.model.Payment;
import com.eventix.payment.model.PaymentStatus;
import com.eventix.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentResponse process(PaymentRequest request) {
        // Simulated gateway: succeeds unless the caller explicitly asked to simulate
        // a failure (see PaymentRequest.simulateFailure for why that flag exists).
        PaymentStatus status = request.isSimulateFailure() ? PaymentStatus.FAILED : PaymentStatus.SUCCESS;

        Payment payment = Payment.builder()
                .bookingId(request.getBookingId())
                .amount(request.getAmount())
                .status(status)
                .build();

        return toResponse(paymentRepository.save(payment));
    }

    public PaymentResponse findById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment " + id + " not found"));
        return toResponse(payment);
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(p.getId(), p.getBookingId(), p.getAmount(), p.getStatus());
    }
}
