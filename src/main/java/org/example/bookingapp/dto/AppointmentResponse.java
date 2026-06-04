package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;


@Data
@Builder
public class AppointmentResponse {
    private UUID id;

    private UUID clientId;
    private String clientName;

    private UUID salonId;
    private String salonName;

    private UUID serviceId;
    private String serviceName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String status;
    private LocalDateTime createdAt;

}
