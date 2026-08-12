package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ServiceAnalyticsResponse {
    private UUID serviceId;
    private String serviceName;
    private Long bookedCount;
    private BigDecimal revenue;
}
