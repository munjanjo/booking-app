package org.example.bookingapp.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RescheduleRequest {
    @NotNull(message = "Radnik je obavezan")
    private UUID workerId;

    @NotNull(message = "obavezno je vrijeme termina")
    @Future(message = "termin mora biti u buducnosti")
    private LocalDateTime startTime;
}