package org.example.bookingapp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.WorkingHoursExceptionRequest;
import org.example.bookingapp.dto.WorkingHoursExceptionResponse;
import org.example.bookingapp.service.WorkingHoursExceptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workers/{workerId}/working-hours-exceptions")
@RequiredArgsConstructor
public class WorkingHoursExceptionController {

    private final WorkingHoursExceptionService exceptionService;

    @PostMapping
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<WorkingHoursExceptionResponse> createException(
            @PathVariable UUID workerId,
            @Valid @RequestBody WorkingHoursExceptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(exceptionService.createException(workerId, request));
    }

    @GetMapping
    public ResponseEntity<List<WorkingHoursExceptionResponse>> getExceptions(@PathVariable UUID workerId) {
        return ResponseEntity.ok(exceptionService.getExceptions(workerId));
    }

    @DeleteMapping("/{exceptionId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<Void> deleteException(
            @PathVariable UUID workerId,
            @PathVariable UUID exceptionId) {
        exceptionService.deleteException(workerId, exceptionId);
        return ResponseEntity.noContent().build();
    }
}
