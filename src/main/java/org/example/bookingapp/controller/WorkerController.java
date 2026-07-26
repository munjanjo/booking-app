package org.example.bookingapp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.WorkerRequest;
import org.example.bookingapp.dto.WorkerResponse;
import org.example.bookingapp.service.WorkerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salons/{salonId}/workers")
@RequiredArgsConstructor
public class WorkerController {

    private final WorkerService workerService;

    @PostMapping
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<WorkerResponse> createWorker(
            @PathVariable UUID salonId,
            @Valid @RequestBody WorkerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workerService.createWorker(salonId, request));
    }

    @GetMapping
    public ResponseEntity<List<WorkerResponse>> getWorkers(@PathVariable UUID salonId) {
        return ResponseEntity.ok(workerService.getWorkersBySalon(salonId));
    }

    @DeleteMapping("/{workerId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<Void> deleteWorker(@PathVariable UUID workerId) {
        workerService.deleteWorker(workerId);
        return ResponseEntity.noContent().build();
    }
}