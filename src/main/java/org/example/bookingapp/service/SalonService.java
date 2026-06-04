package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.SalonRequest;
import org.example.bookingapp.dto.SalonResponse;
import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.repository.SalonRepository;
import org.example.bookingapp.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalonService {
    private final SalonRepository salonRepository;
    private final UserRepository userRepository;

    private User getCurrentUser(){
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(()->new RuntimeException("Korisnik nije pronaden"));
    }

    private SalonResponse toResponse(Salon salon){
        return SalonResponse.builder().id(salon.getId())
                .ownerName(salon.getOwner().getName())
                .name(salon.getName())
                .description(salon.getDescription())
                .address(salon.getAddress())
                .phone(salon.getPhone())
                .subscriptionPlan(salon.getSubscriptionPlan().name())
                .subscriptionExpires(salon.getSubscriptionExpires())
                .isActive(salon.isActive())
                .createdAt(salon.getCreatedAt())
                .build();
    }


    public SalonResponse createSalon(SalonRequest request){
        User owner = getCurrentUser();

        Salon salon = Salon.builder()
                .owner(owner)
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .phone(request.getPhone())
                .build();
        Salon saved = salonRepository.save(salon);
        return toResponse(saved);
    }
    public List<SalonResponse> getAllSalons(){
        return salonRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }
    public SalonResponse getSalonById (UUID id){
        Salon salon = salonRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Salon nije pronaden"));
        return toResponse(salon);
    }
    public SalonResponse updateSalon(UUID id,SalonRequest req){
        User owner = getCurrentUser();
        Salon salon = salonRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Salon nije pronaden"));
        if(!salon.getOwner().getId().equals(owner.getId())){
            throw new RuntimeException("Nemate dozvolu za uredivanje ovog salona");
        }
        salon.setName(req.getName());
        salon.setAddress(req.getAddress());
        salon.setDescription(req.getDescription());
        salon.setPhone(req.getPhone());
        Salon updated= salonRepository.save(salon);
        return toResponse(updated);
    }
    public void deleteSalon(UUID id){
        User owner = getCurrentUser();
        Salon salon = salonRepository.findById(id)
                .orElseThrow(()->new RuntimeException("Salon nije pronaden"));
        if(!salon.getOwner().getId().equals(owner.getId())){
            throw new RuntimeException("Nemate dozvolu za brisanje ovog salona");
        }
        salon.setActive(false);
        salonRepository.save(salon);
    }
}
