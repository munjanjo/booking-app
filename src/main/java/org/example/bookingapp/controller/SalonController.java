package org.example.bookingapp.controller;

import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.SalonRequest;
import org.example.bookingapp.dto.SalonResponse;
import org.example.bookingapp.service.SalonService;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salons")
@RequiredArgsConstructor
public class SalonController {

    private final SalonService salonService;

    @PostMapping
    @PreAuthorize(("hasRole('SALON_OWNER')"))
    public ResponseEntity<SalonResponse> createSalon(@Valid @RequestBody SalonRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(salonService.createSalon(request));
    }
    @GetMapping
    public  ResponseEntity<List<SalonResponse>> getAllSalons(){
        return ResponseEntity.ok(salonService.getAllSalons());
    }
    @GetMapping("/{id}")
    public ResponseEntity<SalonResponse> getSalonById(@PathVariable UUID id){
        return ResponseEntity.ok(salonService.getSalonById(id));
    }
    @PutMapping("/{id}")
    @PreAuthorize(("hasRole('SALON_OWNER')"))
    public ResponseEntity<SalonResponse> updateSalon (@PathVariable UUID id, @Valid @RequestBody SalonRequest request){
        return ResponseEntity.ok(salonService.updateSalon(id,request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalon(@PathVariable UUID id){
        salonService.deleteSalon(id);
        return ResponseEntity.noContent().build();
    }
}
