package org.example.bookingapp.controller;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.SalonImageResponse;
import org.example.bookingapp.service.SalonImageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salons/{salonId}/images")
@RequiredArgsConstructor
public class SalonImageController {

    private final SalonImageService salonImageService;

    @GetMapping
    public ResponseEntity<List<SalonImageResponse>> getImages(@PathVariable UUID salonId) {
        return ResponseEntity.ok(salonImageService.getImages(salonId));
    }

    @PostMapping
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<SalonImageResponse> uploadImage(@PathVariable UUID salonId,
                                                            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salonImageService.uploadImage(salonId, file));
    }

    @DeleteMapping("/{imageId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID salonId, @PathVariable UUID imageId) {
        salonImageService.deleteImage(salonId, imageId);
        return ResponseEntity.noContent().build();
    }
}
