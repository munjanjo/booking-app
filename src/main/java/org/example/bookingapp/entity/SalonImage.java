package org.example.bookingapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "salon_images")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SalonImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salon_id", nullable = false)
    private Salon salon;

    @Column(nullable = false, length = 1000)
    private String url;

    @Column(nullable = false)
    private String s3Key;

    @Column(nullable = false)
    private Integer sortOrder;
}
