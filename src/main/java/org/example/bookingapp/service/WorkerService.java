package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.WorkerRequest;
import org.example.bookingapp.dto.WorkerResponse;
import org.example.bookingapp.entity.Salon;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.entity.Worker;
import org.example.bookingapp.repository.SalonRepository;
import org.example.bookingapp.repository.UserRepository;
import org.example.bookingapp.repository.WorkerRepository;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkerService {
    private final WorkerRepository workerRepository;
    private final SalonRepository salonRepository;
    private final UserRepository userRepository;

    private User getCurrentUser(){
        String email= SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(()->new RuntimeException("korisnik nije pronaden"));
    }
    private WorkerResponse toResponse (Worker w){
        return WorkerResponse.builder()
                .id(w.getId())
                .salonId(w.getSalon().getId())
                .name(w.getName())
                .isActive(w.isActive())
                .build();
    }
    public WorkerResponse createWorker (UUID salonId, WorkerRequest request){
        User owner = getCurrentUser();
        Salon salon=salonRepository.findById(salonId)
                .orElseThrow(()->new RuntimeException("salon nije pronaden"));
        if(!owner.getId().equals(salon.getOwner().getId())){
            throw new RuntimeException("Nemate dozvolu za dodavanje novih radnika");
        }
        Worker worker = Worker.builder()
                .salon(salon)
                .name(request.getName())
                .build();
        Worker saved = workerRepository.save(worker);
        return toResponse(saved);
    }
    public List<WorkerResponse> getWorkersBySalon(UUID salonId){
        return workerRepository.findBySalonIdAndIsActiveTrue(salonId).stream().map(this::toResponse).toList();
    }
    public void deleteWorker(UUID workerId){
        User owner = getCurrentUser();
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("radnik nije pronaden"));
        if (!owner.getId().equals(worker.getSalon().getOwner().getId())) {
            throw new RuntimeException("Nemate dozvolu za brisanje ovog radnika");
        }
        worker.setActive(false);
        workerRepository.save(worker);
    }


}
