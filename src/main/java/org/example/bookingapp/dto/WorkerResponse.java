package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class WorkerResponse {
    private UUID id;
    private UUID salonId;
    private String name;
    private boolean isActive;
}