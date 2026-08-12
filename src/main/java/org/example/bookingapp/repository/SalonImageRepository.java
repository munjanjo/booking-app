package org.example.bookingapp.repository;

import org.example.bookingapp.entity.SalonImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalonImageRepository extends JpaRepository<SalonImage, UUID> {
    List<SalonImage> findBySalonIdOrderBySortOrderAsc(UUID salonId);
    Optional<SalonImage> findFirstBySalonIdOrderBySortOrderAsc(UUID salonId);
    int countBySalonId(UUID salonId);
}
