package org.example.bookingapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NewClientRequest {
    @NotBlank(message = "Ime klijenta je obavezno")
    private String name;
    @NotBlank(message = "Email je obavezan")
    @Email(message = "Email nije ispravnog formata")
    private String email;
    private String phone;
}
