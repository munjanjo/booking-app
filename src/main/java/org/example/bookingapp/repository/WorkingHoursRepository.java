package org.example.bookingapp.repository;

import org.example.bookingapp.entity.WorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, UUID> {
    List<WorkingHours> findByWorkerId(UUID workerId);
    List<WorkingHours> findByWorkerIdAndDayOfWeek(UUID workerId, Integer dayOfWeek);
}
