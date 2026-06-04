package org.example.bookingapp.repository;

import org.example.bookingapp.entity.WorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, UUID> {
    List <WorkingHours> findBySalonId(UUID salonId);
    Optional <WorkingHours> findBySalonIdAndDayOfWeek(UUID salonId, Integer dayOfWeek);

}
