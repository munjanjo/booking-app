package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class SalonResponse {

    private UUID id;
    private String ownerName;
    private String name;
    private String description;
    private String address;
    private String phone;
    private String subscriptionPlan;
    private LocalDateTime subscriptionExpires;
    private boolean isActive;
    private LocalDateTime createdAt;
}