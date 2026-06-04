package org.example.bookingapp.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.RegisterRequest;
import org.example.bookingapp.dto.ServiceRequest;
import org.example.bookingapp.dto.ServiceResponse;
import org.example.bookingapp.service.ServiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salons/{salonId}/services")
@RequiredArgsConstructor
public class ServiceController {
    private final ServiceService serviceService;

    @PostMapping
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ServiceResponse> createService(
            @PathVariable UUID salonId,
            @Valid @RequestBody ServiceRequest request){
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceService.createService(salonId,request));
    }
    @GetMapping
    public ResponseEntity<List<ServiceResponse>> getServicesBySalon(
            @PathVariable UUID salonId){
        return ResponseEntity.ok(serviceService.getServicesBySalon(salonId));
    }
    @PutMapping("/{serviceId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ServiceResponse> updateService(
            @PathVariable UUID salonId,
            @PathVariable UUID serviceId,
            @Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceService.updateService(serviceId, request));
    }

    @DeleteMapping("/{serviceId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<Void> deleteService(
            @PathVariable UUID salonId,
            @PathVariable UUID serviceId) {
        serviceService.deleteService(serviceId);
        return ResponseEntity.noContent().build();
    }
}
