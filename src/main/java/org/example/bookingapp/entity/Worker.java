package org.example.bookingapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "workers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", nullable = false)
    private Salon salon;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean isActive;

    @PrePersist
    protected void onCreate() {
        this.isActive = true;
    }
}