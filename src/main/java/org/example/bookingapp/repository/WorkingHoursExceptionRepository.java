package org.example.bookingapp.repository;

import org.example.bookingapp.entity.WorkingHoursException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkingHoursExceptionRepository extends JpaRepository<WorkingHoursException, UUID> {
    List<WorkingHoursException> findByWorkerIdOrderByDateAsc(UUID workerId);
    Optional<WorkingHoursException> findByWorkerIdAndDate(UUID workerId, LocalDate date);
}
