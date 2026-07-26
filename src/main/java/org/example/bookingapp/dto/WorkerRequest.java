package org.example.bookingapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WorkerRequest {
    @NotBlank(message = "Ime radnika je obavezno")
    private String name;
}