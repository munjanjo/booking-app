package org.example.bookingapp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.AppointmentRequest;
import org.example.bookingapp.dto.AppointmentResponse;
import org.example.bookingapp.service.AppointmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {
    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<AppointmentResponse> createAppointment(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(appointmentService.createAppointment(request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments() {
        return ResponseEntity.ok(appointmentService.getMyAppointments());
    }

    @GetMapping("/salon/{salonId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<List<AppointmentResponse>> getSalonAppointments(
            @PathVariable UUID salonId) {
        return ResponseEntity.ok(appointmentService.getSalonAppointments(salonId));
    }
    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<Void> cancelAppointment(@PathVariable UUID appointmentId) {
        appointmentService.cancelAppointment(appointmentId);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/salons/{salonId}/available-slots")
    public ResponseEntity<List<String>> getAvailableSlots(
            @PathVariable UUID salonId,
            @RequestParam UUID serviceId,
            @RequestParam LocalDate date) {

        return ResponseEntity.ok(
                appointmentService.getAvailableSlots(salonId, serviceId, date)
        );
    }
}
