package org.example.bookingapp.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserSearchResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
}
