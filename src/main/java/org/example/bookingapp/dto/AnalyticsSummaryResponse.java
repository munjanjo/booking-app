package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AnalyticsSummaryResponse {
    Long totalBooked;
    Long totalCancelled;
    Long total;
    BigDecimal revenue;
}
