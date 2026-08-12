package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SalonImageResponse {
    private UUID id;
    private String url;
    private Integer sortOrder;
}
