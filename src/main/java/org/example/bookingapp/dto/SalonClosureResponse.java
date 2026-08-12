package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class SalonClosureResponse {
    private UUID id;
    private LocalDate date;
    private String reason;
}
