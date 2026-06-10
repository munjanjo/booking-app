package org.example.bookingapp.repository;

import org.example.bookingapp.entity.Appointment;
import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByClientAndStatus(User client, Appointment.Status status);
    List<Appointment> findBySalonAndStatus(Salon salon, Appointment.Status status);
    boolean existsBySalonAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(

            Salon salon,

            Appointment.Status status,

            LocalDateTime endTime,

            LocalDateTime startTime

    );
    List<Appointment> findBySalonAndStatusAndStartTimeBetween(
            Salon salon,
            Appointment.Status status,
            LocalDateTime start,
            LocalDateTime end
    );
}
