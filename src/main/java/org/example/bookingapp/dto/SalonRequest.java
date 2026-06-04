package org.example.bookingapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SalonRequest {

    @NotBlank(message = "Naziv salona je obavezan")
    private String name;

    @Size(max = 1000, message = "Opis može imati maksimalno 1000 znakova")
    private String description;

    @NotBlank(message = "Adresa je obavezna")
    private String address;

    @NotBlank(message = "Telefon je obavezan")
    private String phone;
}