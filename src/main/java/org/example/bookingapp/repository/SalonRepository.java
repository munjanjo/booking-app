package org.example.bookingapp.repository;

import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SalonRepository extends JpaRepository <Salon, UUID>{
    List<Salon> findByOwner(User owner);
    List<Salon> findByIsActiveTrue();
    boolean existsByOwnerAndId(User owner, UUID id);

}
