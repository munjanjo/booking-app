package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class WorkingHoursResponse {

    private UUID id;
    private UUID salonId;
    private Integer dayOfWeek;
    private String dayName;
    private LocalTime openTime;
    private LocalTime closeTime;
    private boolean open;
}