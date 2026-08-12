package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.WorkingHoursExceptionRequest;
import org.example.bookingapp.dto.WorkingHoursExceptionResponse;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.entity.Worker;
import org.example.bookingapp.entity.WorkingHoursException;
import org.example.bookingapp.repository.UserRepository;
import org.example.bookingapp.repository.WorkerRepository;
import org.example.bookingapp.repository.WorkingHoursExceptionRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkingHoursExceptionService {
    private final WorkingHoursExceptionRepository exceptionRepository;
    private final WorkerRepository workerRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronaden"));
    }

    private Worker getOwnedWorker(UUID workerId, User owner) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Radnik nije pronađen"));
        if (!worker.getSalon().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Nemate dozvolu za uređivanje radnog vremena ovog radnika");
        }
        return worker;
    }

    private WorkingHoursExceptionResponse toResponse(WorkingHoursException ex) {
        return WorkingHoursExceptionResponse.builder()
                .id(ex.getId())
                .workerId(ex.getWorker().getId())
                .date(ex.getDate())
                .allDayOff(ex.isAllDayOff())
                .openTime(ex.getOpenTime())
                .closeTime(ex.getCloseTime())
                .reason(ex.getReason())
                .build();
    }

    public WorkingHoursExceptionResponse createException(UUID workerId, WorkingHoursExceptionRequest request) {
        User owner = getCurrentUser();
        Worker worker = getOwnedWorker(workerId, owner);

        if (!request.isAllDayOff()) {
            if (request.getOpenTime() == null || request.getCloseTime() == null) {
                throw new RuntimeException("Vrijeme otvaranja i zatvaranja je obavezno kad dan nije slobodan");
            }
            if (!request.getOpenTime().isBefore(request.getCloseTime())) {
                throw new RuntimeException("Vrijeme zatvaranja mora biti nakon vremena otvaranja");
            }
        }

        exceptionRepository.findByWorkerIdAndDate(workerId, request.getDate())
                .ifPresent(existing -> {
                    throw new RuntimeException("Iznimka za taj datum već postoji");
                });

        WorkingHoursException ex = WorkingHoursException.builder()
                .worker(worker)
                .date(request.getDate())
                .allDayOff(request.isAllDayOff())
                .openTime(request.isAllDayOff() ? null : request.getOpenTime())
                .closeTime(request.isAllDayOff() ? null : request.getCloseTime())
                .reason(request.getReason())
                .build();

        return toResponse(exceptionRepository.save(ex));
    }

    public List<WorkingHoursExceptionResponse> getExceptions(UUID workerId) {
        return exceptionRepository.findByWorkerIdOrderByDateAsc(workerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteException(UUID workerId, UUID exceptionId) {
        User owner = getCurrentUser();
        getOwnedWorker(workerId, owner);

        WorkingHoursException ex = exceptionRepository.findById(exceptionId)
                .orElseThrow(() -> new RuntimeException("Iznimka nije pronađena"));
        if (!ex.getWorker().getId().equals(workerId)) {
            throw new RuntimeException("Iznimka ne pripada ovom radniku");
        }
        exceptionRepository.delete(ex);
    }
}
