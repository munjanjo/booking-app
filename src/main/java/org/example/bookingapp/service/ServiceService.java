package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.ServiceRequest;
import org.example.bookingapp.dto.ServiceResponse;
import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.Service;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.repository.SalonRepository;
import org.example.bookingapp.repository.ServiceRepository;
import org.example.bookingapp.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;


@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class ServiceService {
    private final ServiceRepository serviceRepository;
    private final SalonRepository salonRepository;
    private final UserRepository userRepository;

    private User getCurrentUser(){
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(()->new RuntimeException("korisnik nije pronaden"));
    }
    private ServiceResponse toResponse(Service service){
        return ServiceResponse.builder()
                .id(service.getId())
                .salonId(service.getSalon().getId())
                .salonName(service.getSalon().getName())
                .name(service.getName())
                .description(service.getDescription())
                .durationMinutes(service.getDurationMinutes())
                .price(service.getPrice())
                .isActive(service.isActive())
                .build();
    }
    public ServiceResponse createService(UUID salonId, ServiceRequest request){
        User owner = getCurrentUser();
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(()->new RuntimeException("Salon nije pronaden"));
        if(!salon.getOwner().getId().equals(owner.getId())){
            throw new RuntimeException("Nemate dozvolu za dodavanje usloga u ovom salonu");

        }
     Service service = Service.builder()
             .salon(salon)
             .name(request.getName())
             .description(request.getDescription())
             .durationMinutes(request.getDurationMinutes())
             .price(request.getPrice())
             .build();
        Service saved = serviceRepository.save(service);
        return toResponse(saved);
    }
    public List<ServiceResponse> getServicesBySalon(UUID salonId){
        return serviceRepository.findBySalonIdAndIsActiveTrue(salonId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    public ServiceResponse updateService(UUID serviceId, ServiceRequest request){
        User owner = getCurrentUser();
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));


        if (!service.getSalon().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Nemate dozvolu za uređivanje ove usluge");
        }
        service.setName(request.getName());
        service.setDescription(request.getDescription());
        service.setDurationMinutes(request.getDurationMinutes());
        service.setPrice(request.getPrice());

        Service updated = serviceRepository.save(service);
        return toResponse(updated);

    }
    public void deleteService(UUID serviceId){
        User owner = getCurrentUser();

        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));

        if (!service.getSalon().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Nemate dozvolu za brisanje ove usluge");
        }
        service.setActive(false);
        serviceRepository.save(service);
    }

}
