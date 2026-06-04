package org.example.bookingapp.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServiceRequest {
@NotBlank(message = "Naziv usluge je obavezan")
    private String name;

    private String description;

    @NotNull(message = "Trajanje je obavezno")
    @Min(value = 5,message = "minimalno trajanje je 5min")
    @Max(value = 480, message = "maksimalno trajanje je 480min")
    private Integer durationMinutes;

    @NotNull(message = "Cijena je obavezna")
    @DecimalMin(value = "0.01",message = "Cijena mora biti veca od 0")
    private BigDecimal price;
}
