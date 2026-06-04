package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ServiceResponse {
    private UUID id;
    private UUID salonId;
    private String salonName;
    private String name;
    private String description;
    private Integer durationMinutes;
    private BigDecimal price;
    private boolean isActive;

}
