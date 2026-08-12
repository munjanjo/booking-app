package org.example.bookingapp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class WorkingHoursExceptionRequest {

    @NotNull(message = "Datum je obavezan")
    private LocalDate date;

    private boolean allDayOff;

    private LocalTime openTime;

    private LocalTime closeTime;

    private String reason;
}
