package org.example.bookingapp.repository;

import org.example.bookingapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByVerificationToken(String token);
    Optional<User> findByPasswordResetToken(String token);

    @Query("SELECT u FROM User u WHERE u.role = 'CLIENT' AND ("
            + "LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR u.phone LIKE CONCAT('%', :q, '%'))")
    List<User> searchClients(@Param("q") String query);
}
