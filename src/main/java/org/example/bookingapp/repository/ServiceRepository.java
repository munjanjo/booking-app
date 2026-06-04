package org.example.bookingapp.repository;

import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceRepository extends JpaRepository<Service, UUID> {
    List<Service> findBySalonAndIsActiveTrue(Salon salon);
    List<Service> findBySalonIdAndIsActiveTrue(UUID id);
}
