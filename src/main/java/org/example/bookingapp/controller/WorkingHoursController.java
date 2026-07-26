package org.example.bookingapp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.WorkingHoursRequest;
import org.example.bookingapp.dto.WorkingHoursResponse;
import org.example.bookingapp.service.WorkingHoursService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workers/{workerId}/working-hours")
@RequiredArgsConstructor
public class WorkingHoursController {

    private final WorkingHoursService workingHoursService;

    @PostMapping
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<WorkingHoursResponse> createShift(
            @PathVariable UUID workerId,
            @Valid @RequestBody WorkingHoursRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workingHoursService.createShift(workerId, request));
    }

    @PutMapping("/{shiftId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<WorkingHoursResponse> updateShift(
            @PathVariable UUID workerId,
            @PathVariable UUID shiftId,
            @Valid @RequestBody WorkingHoursRequest request) {
        return ResponseEntity.ok(workingHoursService.updateShift(workerId, shiftId, request));
    }

    @DeleteMapping("/{shiftId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<Void> deleteShift(
            @PathVariable UUID workerId,
            @PathVariable UUID shiftId) {
        workingHoursService.deleteShift(workerId, shiftId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<WorkingHoursResponse>> getWorkingHours(
            @PathVariable UUID workerId) {
        return ResponseEntity.ok(workingHoursService.getWorkingHours(workerId));
    }
}
