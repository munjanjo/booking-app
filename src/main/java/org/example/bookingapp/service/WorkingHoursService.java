package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.WorkingHoursRequest;
import org.example.bookingapp.dto.WorkingHoursResponse;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.entity.Worker;
import org.example.bookingapp.entity.WorkingHours;
import org.example.bookingapp.repository.UserRepository;
import org.example.bookingapp.repository.WorkerRepository;
import org.example.bookingapp.repository.WorkingHoursRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkingHoursService {
    private final WorkingHoursRepository workingHoursRepository;
    private final WorkerRepository workerRepository;
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
                .workerId(wh.getWorker().getId())
                .dayOfWeek(wh.getDayOfWeek())
                .dayName(DAY_NAMES.get(wh.getDayOfWeek()))
                .openTime(wh.getOpenTime())
                .closeTime(wh.getCloseTime())
                .open(wh.isOpen())
                .build();
    }

    private Worker getOwnedWorker(UUID workerId, User owner) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Radnik nije pronađen"));
        if (!worker.getSalon().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Nemate dozvolu za uređivanje radnog vremena ovog radnika");
        }
        return worker;
    }

    public WorkingHoursResponse createShift(UUID workerId, WorkingHoursRequest request) {
        User owner = getCurrentUser();
        Worker worker = getOwnedWorker(workerId, owner);

        WorkingHours wh = WorkingHours.builder()
                .worker(worker)
                .dayOfWeek(request.getDayOfWeek())
                .openTime(request.getOpenTime())
                .closeTime(request.getCloseTime())
                .isOpen(true)
                .build();

        return toResponse(workingHoursRepository.save(wh));
    }

    public WorkingHoursResponse updateShift(UUID workerId, UUID shiftId, WorkingHoursRequest request) {
        User owner = getCurrentUser();
        getOwnedWorker(workerId, owner);

        WorkingHours wh = workingHoursRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Smjena nije pronađena"));
        if (!wh.getWorker().getId().equals(workerId)) {
            throw new RuntimeException("Smjena ne pripada ovom radniku");
        }
        wh.setDayOfWeek(request.getDayOfWeek());
        wh.setOpenTime(request.getOpenTime());
        wh.setCloseTime(request.getCloseTime());
        wh.setOpen(true);

        return toResponse(workingHoursRepository.save(wh));
    }

    public void deleteShift(UUID workerId, UUID shiftId) {
        User owner = getCurrentUser();
        getOwnedWorker(workerId, owner);

        WorkingHours wh = workingHoursRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Smjena nije pronađena"));
        if (!wh.getWorker().getId().equals(workerId)) {
            throw new RuntimeException("Smjena ne pripada ovom radniku");
        }
        workingHoursRepository.delete(wh);
    }

    public List<WorkingHoursResponse> getWorkingHours(UUID workerId) {
        return workingHoursRepository.findByWorkerId(workerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }
}
