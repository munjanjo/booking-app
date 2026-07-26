package org.example.bookingapp.repository;

import org.example.bookingapp.entity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkerRepository extends JpaRepository<Worker, UUID> {
    List<Worker> findBySalonIdAndIsActiveTrue(UUID salonId);
}