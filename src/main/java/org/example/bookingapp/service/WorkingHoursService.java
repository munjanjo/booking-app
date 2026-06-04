package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.WorkingHoursRequest;
import org.example.bookingapp.dto.WorkingHoursResponse;
import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.entity.WorkingHours;
import org.example.bookingapp.repository.SalonRepository;
import org.example.bookingapp.repository.UserRepository;
import org.example.bookingapp.repository.WorkingHoursRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkingHoursService {
    private final WorkingHoursRepository workingHoursRepository;
    private final SalonRepository salonRepository;
    private final UserRepository userRepository;

    private final List<String> DAY_NAMES=List.of(
            "", "Ponedjeljak", "Utorak", "Srijeda",
            "Četvrtak", "Petak", "Subota", "Nedjelja"
    );
    private User getCurrentUser(){
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(()->new RuntimeException("Korisnik nije pronaden"));
    }
    private WorkingHoursResponse toResponse(WorkingHours wh) {
        return WorkingHoursResponse.builder()
                .id(wh.getId())
                .salonId(wh.getSalon().getId())
                .dayOfWeek(wh.getDayOfWeek())
                .dayName(DAY_NAMES.get(wh.getDayOfWeek()))
                .openTime(wh.getOpenTime())
                .closeTime(wh.getCloseTime())
                .open(wh.isOpen())
                .build();
    }
    public WorkingHoursResponse setWorkingHours(UUID salonId, WorkingHoursRequest request) {
        User owner = getCurrentUser();

        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new RuntimeException("Salon nije pronađen"));

        if (!salon.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Nemate dozvolu za uređivanje ovog salona");
        }
        WorkingHours wh = workingHoursRepository
                .findBySalonIdAndDayOfWeek(salonId, request.getDayOfWeek())
                .orElse(WorkingHours.builder().salon(salon).build());
        wh.setDayOfWeek(request.getDayOfWeek());
        wh.setOpenTime(request.getOpenTime());
        wh.setCloseTime(request.getCloseTime());
        wh.setOpen(request.isOpen());

        return toResponse(workingHoursRepository.save(wh));

    }
    public List<WorkingHoursResponse> getWorkingHours(UUID salonId) {
        return workingHoursRepository.findBySalonId(salonId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
}


