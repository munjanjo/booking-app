package org.example.bookingapp.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class AppointmentRequest {
    @NotNull(message = "Salon je obavezan")
    private UUID salonId;
    @NotNull(message = "Usluga je obavezna")
    private UUID serviceId;
    @NotNull(message = "obavezno je vrijeme termina")
    @Future(message = "termin mora biti u buducnosti")
    private LocalDateTime startTime;

}
