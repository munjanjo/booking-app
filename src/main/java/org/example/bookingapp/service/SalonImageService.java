package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.SalonImageResponse;
import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.SalonImage;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.repository.SalonImageRepository;
import org.example.bookingapp.repository.SalonRepository;
import org.example.bookingapp.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalonImageService {

    private static final int MAX_IMAGES_PER_SALON = 10;

    private final SalonImageRepository salonImageRepository;
    private final SalonRepository salonRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronaden"));
    }

    private Salon getOwnedSalon(UUID salonId) {
        User owner = getCurrentUser();
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new RuntimeException("Salon nije pronaden"));
        if (!salon.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Nemate dozvolu za uredivanje ovog salona");
        }
        return salon;
    }

    private SalonImageResponse toResponse(SalonImage image) {
        return SalonImageResponse.builder()
                .id(image.getId())
                .url(image.getUrl())
                .sortOrder(image.getSortOrder())
                .build();
    }

    public List<SalonImageResponse> getImages(UUID salonId) {
        return salonImageRepository.findBySalonIdOrderBySortOrderAsc(salonId).stream()
                .map(this::toResponse)
                .toList();
    }

    public SalonImageResponse uploadImage(UUID salonId, MultipartFile file) {
        Salon salon = getOwnedSalon(salonId);

        int currentCount = salonImageRepository.countBySalonId(salonId);
        if (currentCount >= MAX_IMAGES_PER_SALON) {
            throw new RuntimeException("Dosegnut je maksimalan broj slika (" + MAX_IMAGES_PER_SALON + ")");
        }

        S3Service.UploadResult upload = s3Service.uploadSalonImage(salonId, file);

        SalonImage image = SalonImage.builder()
                .salon(salon)
                .url(upload.url())
                .s3Key(upload.key())
                .sortOrder(currentCount)
                .build();

        SalonImage saved = salonImageRepository.save(image);
        return toResponse(saved);
    }

    public void deleteImage(UUID salonId, UUID imageId) {
        getOwnedSalon(salonId);

        SalonImage image = salonImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Slika nije pronadena"));

        if (!image.getSalon().getId().equals(salonId)) {
            throw new RuntimeException("Slika ne pripada ovom salonu");
        }

        s3Service.deleteSalonImage(image.getS3Key());
        salonImageRepository.delete(image);
    }
}
