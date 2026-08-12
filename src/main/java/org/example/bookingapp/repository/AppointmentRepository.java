package org.example.bookingapp.repository;

import org.example.bookingapp.dto.AnalyticsSummaryResponse;
import org.example.bookingapp.entity.Appointment;
import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.entity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByClientAndStatus(User client, Appointment.Status status);
    List<Appointment> findBySalonAndStatus(Salon salon, Appointment.Status status);
    Long countBySalonAndStatusAndStartTimeBetween(
            Salon salon,
            Appointment.Status status,
            LocalDateTime startTime,
            LocalDateTime endTime
    );
    boolean existsByWorkerAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
            Worker worker,
            Appointment.Status status,
            LocalDateTime endTime,
            LocalDateTime startTime
    );
    List<Appointment> findByWorkerAndStatusAndStartTimeBetween(
            Worker worker,
            Appointment.Status status,
            LocalDateTime start,
            LocalDateTime end
    );
    boolean existsByWorkerAndStatusAndStartTimeLessThanAndEndTimeGreaterThanAndIdNot(
            Worker worker,
            Appointment.Status status,
            LocalDateTime endTime,
            LocalDateTime startTime,
            UUID excludeId
    );
    @Query("SELECT COALESCE(SUM(a.service.price), 0) FROM Appointment a " +
            "WHERE a.salon = :salon AND a.status = :status " +
            "AND a.startTime BETWEEN :startTime AND :endTime " +
            "AND a.endTime <= :now")
    BigDecimal sumRevenueBySalonAndStatusAndPeriod(
            @Param("salon") Salon salon,
            @Param("status") Appointment.Status status,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("now") LocalDateTime now
    );

    @Query("SELECT a.service.id, a.service.name, COUNT(a.id), COALESCE(SUM(a.service.price), 0) " +
            "FROM Appointment a " +
            "WHERE a.salon = :salon AND a.status = :status " +
            "AND a.startTime BETWEEN :startTime AND :endTime " +
            "GROUP BY a.service.id, a.service.name " +
            "ORDER BY COUNT(a.id) DESC")
    List<Object[]> findServiceBreakdown(
            @Param("salon") Salon salon,
            @Param("status") Appointment.Status status,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    List<Appointment> findByStatusAndReminderSentFalseAndStartTimeBetween(
            Appointment.Status status,
            LocalDateTime windowStart,
            LocalDateTime windowEnd
    );
}
