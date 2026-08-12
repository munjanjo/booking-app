package org.example.bookingapp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SalonClosureRequest {
    @NotNull
    private LocalDate date;
    private String reason;
}
