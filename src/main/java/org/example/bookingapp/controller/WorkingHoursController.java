package org.example.bookingapp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.WorkingHoursRequest;
import org.example.bookingapp.dto.WorkingHoursResponse;
import org.example.bookingapp.service.WorkingHoursService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salons/{salonId}/working-hours")
@RequiredArgsConstructor
public class WorkingHoursController {

    private final WorkingHoursService workingHoursService;

    @PostMapping
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<WorkingHoursResponse> setWorkingHours(
            @PathVariable UUID salonId,
            @Valid @RequestBody WorkingHoursRequest request) {
        return ResponseEntity.ok(workingHoursService.setWorkingHours(salonId, request));
    }

    @GetMapping
    public ResponseEntity<List<WorkingHoursResponse>> getWorkingHours(
            @PathVariable UUID salonId) {
        return ResponseEntity.ok(workingHoursService.getWorkingHours(salonId));
    }
}