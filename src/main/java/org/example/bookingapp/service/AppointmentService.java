package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.AppointmentRequest;
import org.example.bookingapp.dto.AppointmentResponse;
import org.example.bookingapp.entity.*;
import org.example.bookingapp.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final SalonRepository salonRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final WorkingHoursRepository workingHoursRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("korisnik nije pronaden"));
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return AppointmentResponse.builder().id(appointment.getId())
                .clientId(appointment.getClient().getId())
                .clientName(appointment.getClient().getName())
                .salonId(appointment.getSalon().getId())
                .salonName(appointment.getSalon().getName())
                .serviceId(appointment.getService().getId())
                .serviceName(appointment.getService().getName())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus().name())
                .createdAt(appointment.getCreatedAt())
                .build();
    }

    public AppointmentResponse createAppointment(AppointmentRequest request) {
        User client = getCurrentUser();
        if (client.getRole() != User.Role.CLIENT) {
            throw new RuntimeException("samo klijenti mogu rezervirati termine");
        }
        Salon salon = salonRepository.findById(request.getSalonId())
                .orElseThrow(() -> new RuntimeException("Salon nije pronađen"));

        Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));

        if (!service.getSalon().getId().equals(salon.getId())) {

            throw new RuntimeException("Usluga ne pripada odabranom salonu");

        }
        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());
        int dayOfWeek = startTime.getDayOfWeek().getValue();
        WorkingHours workingHours = workingHoursRepository.findBySalonIdAndDayOfWeek(salon.getId(), dayOfWeek)
                .orElseThrow(() -> new RuntimeException("Nema definirano radno vrijeme za taj dan"));
        if (!workingHours.isOpen()) {

            throw new RuntimeException("Salon ne radi taj dan");

        }
        if (startTime.toLocalTime().isBefore(workingHours.getOpenTime())

                || endTime.toLocalTime().isAfter(workingHours.getCloseTime())) {

            throw new RuntimeException("Termin nije unutar radnog vremena salona");

        }
        boolean overlaps = appointmentRepository

                .existsBySalonAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                        salon,
                        Appointment.Status.BOOKED,
                        endTime,
                        startTime

                );

        if (overlaps) {
            throw new RuntimeException("Termin je već zauzet");
        }

        Appointment appointment = Appointment.builder().client(client)
                .salon(salon)
                .service(service)
                .startTime(startTime)
                .endTime(endTime)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        return toResponse(saved);
    }
    public List<AppointmentResponse> getMyAppointments(){
        User client = getCurrentUser();
        return appointmentRepository.findByClientAndStatus(client,Appointment.Status.BOOKED)
                .stream()
                .map(this::toResponse)
                .toList();
    }
    public List<AppointmentResponse> getSalonAppointments(UUID salonId){
        User owner=getCurrentUser();
        Salon salon=salonRepository.findById(salonId)
                .orElseThrow(()->new RuntimeException("salon nije pronaden"));
        if(!salon.getOwner().getId().equals(owner.getId())){
            new RuntimeException("nemate ovlasti za pregled rezervacija ovog salona");
        }
        return appointmentRepository.findBySalonAndStatus(salon, Appointment.Status.BOOKED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<String> getAvailableSlots(UUID salonId,UUID serviceId, LocalDate date){
        Salon salon=salonRepository.findById(salonId).
                orElseThrow(()->new RuntimeException("salon nije pronaden"));
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(()->new RuntimeException("usluga nije pronadena"));
        if(!salon.getId().equals(service.getSalon().getId())){
            throw new RuntimeException("usluga ne pripada salonu");
        }
        int dayOfWeek=date.getDayOfWeek().getValue();
        WorkingHours workingHours = workingHoursRepository

                .findBySalonIdAndDayOfWeek(salonId, dayOfWeek)

                .orElseThrow(() -> new RuntimeException("Salon nema definirano radno vrijeme za taj dan"));

        if (!workingHours.isOpen()) {

            throw new RuntimeException("Salon ne radi taj dan");

        }
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<Appointment> appointments = appointmentRepository
                .findBySalonAndStatusAndStartTimeBetween(
                        salon,
                        Appointment.Status.BOOKED,
                        dayStart,
                        dayEnd
                );
        List<String> availableSlots=new ArrayList<>();
        LocalTime current=workingHours.getOpenTime();
        LocalTime closeTime = workingHours.getCloseTime();
        while(!current.plusMinutes(service.getDurationMinutes()).isAfter(closeTime)){
            LocalDateTime slotStart = LocalDateTime.of(date,current);
            LocalDateTime slotEnd = slotStart.plusMinutes(service.getDurationMinutes());
            boolean overlaps= appointments.stream().anyMatch(appointment ->
                    appointment.getStartTime().isAfter(slotEnd)
                    && appointment.getEndTime().isBefore(slotStart));
            if(!overlaps){
                availableSlots.add(current.toString());
            }
            current=current.plusMinutes(30);
        }
        return availableSlots;
    }

    public void cancelAppointment(UUID appointmentId){
        User currentUser = getCurrentUser();
        Appointment appointment=appointmentRepository.findById(appointmentId)
                .orElseThrow(()->new RuntimeException("Termin nije pronaden"));
        boolean isClient = currentUser.getId().equals(appointment.getClient().getId());
        boolean isOwner = currentUser.getId().equals(appointment.getSalon().getOwner().getId());
        if(!isOwner && !isClient){
            new RuntimeException("Nemate dozvolu otakzati ovaj termin");
        }
        appointment.setStatus(Appointment.Status.CANCELLED);
        appointmentRepository.save(appointment);
    }

}
