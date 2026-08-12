package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class WorkingHoursExceptionResponse {

    private UUID id;
    private UUID workerId;
    private LocalDate date;
    private boolean allDayOff;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String reason;
}
