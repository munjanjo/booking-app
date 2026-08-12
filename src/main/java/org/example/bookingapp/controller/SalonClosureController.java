package org.example.bookingapp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.SalonClosureRequest;
import org.example.bookingapp.dto.SalonClosureResponse;
import org.example.bookingapp.service.SalonClosureService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salons/{salonId}/closures")
@RequiredArgsConstructor
public class SalonClosureController {

    private final SalonClosureService salonClosureService;

    @GetMapping
    public ResponseEntity<List<SalonClosureResponse>> getClosures(@PathVariable UUID salonId) {
        return ResponseEntity.ok(salonClosureService.getClosures(salonId));
    }

    @PostMapping
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<SalonClosureResponse> createClosure(
            @PathVariable UUID salonId,
            @Valid @RequestBody SalonClosureRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salonClosureService.createClosure(salonId, request));
    }

    @DeleteMapping("/{closureId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<Void> deleteClosure(@PathVariable UUID salonId, @PathVariable UUID closureId) {
        salonClosureService.deleteClosure(salonId, closureId);
        return ResponseEntity.noContent().build();
    }
}
