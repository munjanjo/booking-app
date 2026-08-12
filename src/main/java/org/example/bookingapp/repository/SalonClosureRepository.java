package org.example.bookingapp.repository;

import org.example.bookingapp.entity.SalonClosure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SalonClosureRepository extends JpaRepository<SalonClosure, UUID> {
    List<SalonClosure> findBySalonIdOrderByDateAsc(UUID salonId);
    boolean existsBySalonIdAndDate(UUID salonId, LocalDate date);
    void deleteByIdAndSalonId(UUID id, UUID salonId);
}
