package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.SalonClosureRequest;
import org.example.bookingapp.dto.SalonClosureResponse;
import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.SalonClosure;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.repository.SalonClosureRepository;
import org.example.bookingapp.repository.SalonRepository;
import org.example.bookingapp.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalonClosureService {

    private final SalonClosureRepository salonClosureRepository;
    private final SalonRepository salonRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronaden"));
    }

    private Salon getOwnedSalon(UUID salonId) {
        User owner = getCurrentUser();
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new RuntimeException("Salon nije pronaden"));
        if (!salon.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Nemate dozvolu za uredivanje ovog salona");
        }
        return salon;
    }

    private SalonClosureResponse toResponse(SalonClosure closure) {
        return SalonClosureResponse.builder()
                .id(closure.getId())
                .date(closure.getDate())
                .reason(closure.getReason())
                .build();
    }

    public List<SalonClosureResponse> getClosures(UUID salonId) {
        return salonClosureRepository.findBySalonIdOrderByDateAsc(salonId).stream()
                .map(this::toResponse)
                .toList();
    }

    public SalonClosureResponse createClosure(UUID salonId, SalonClosureRequest request) {
        Salon salon = getOwnedSalon(salonId);

        if (salonClosureRepository.existsBySalonIdAndDate(salonId, request.getDate())) {
            throw new RuntimeException("Salon je već označen kao zatvoren taj dan");
        }

        SalonClosure closure = SalonClosure.builder()
                .salon(salon)
                .date(request.getDate())
                .reason(request.getReason())
                .build();

        return toResponse(salonClosureRepository.save(closure));
    }

    public void deleteClosure(UUID salonId, UUID closureId) {
        getOwnedSalon(salonId);
        salonClosureRepository.deleteByIdAndSalonId(closureId, salonId);
    }
}
