package org.example.bookingapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "working_hours_exceptions")
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
@Builder
public class WorkingHoursException {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private boolean allDayOff;

    private LocalTime openTime;

    private LocalTime closeTime;

    private String reason;
}
