package org.example.bookingapp.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ManualAppointmentRequest {
    @NotNull(message = "Salon je obavezan")
    private UUID salonId;
    @NotNull(message = "Usluga je obavezna")
    private UUID serviceId;
    @NotNull(message = "Radnik je obavezan")
    private UUID workerId;
    @NotNull(message = "obavezno je vrijeme termina")
    @Future(message = "termin mora biti u buducnosti")
    private LocalDateTime startTime;

    // tocno jedno od ova dva mora biti postavljeno
    private UUID clientId;
    @Valid
    private NewClientRequest newClient;
}
