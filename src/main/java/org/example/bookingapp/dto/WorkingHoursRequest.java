package org.example.bookingapp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalTime;

@Data
public class WorkingHoursRequest {

    @NotNull(message = "Dan u tjednu je obavezan")
    @Min(value = 1, message = "Dan mora biti između 1 i 7")
    @Max(value = 7, message = "Dan mora biti između 1 i 7")
    private Integer dayOfWeek;

    @NotNull(message = "Vrijeme otvaranja je obavezno")
    private LocalTime openTime;

    @NotNull(message = "Vrijeme zatvaranja je obavezno")
    private LocalTime closeTime;

    private boolean open;
}