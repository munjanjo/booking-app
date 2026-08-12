package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.*;
import org.example.bookingapp.entity.*;
import org.example.bookingapp.repository.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
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
    private final WorkerRepository workerRepository;
    private final UserRepository userRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final WorkingHoursExceptionRepository workingHoursExceptionRepository;
    private final SalonClosureRepository salonClosureRepository;

    private record ShiftRange(LocalTime openTime, LocalTime closeTime) {}

    /**
     * Zatvorenost cijelog salona (SalonClosure) ima prednost nad svime ostalim — ako je salon
     * zatvoren taj dan, radnik nema slobodnih smjena bez obzira na svoj osobni raspored.
     * Nakon toga, iznimka za konkretan datum (WorkingHoursException) ima prednost nad tjednim
     * rasporedom (WorkingHours).
     */
    private List<ShiftRange> getEffectiveShifts(UUID salonId, UUID workerId, LocalDate date) {
        if (salonClosureRepository.existsBySalonIdAndDate(salonId, date)) {
            return List.of();
        }
        var exception = workingHoursExceptionRepository.findByWorkerIdAndDate(workerId, date);
        if (exception.isPresent()) {
            WorkingHoursException ex = exception.get();
            if (ex.isAllDayOff()) {
                return List.of();
            }
            return List.of(new ShiftRange(ex.getOpenTime(), ex.getCloseTime()));
        }
        int dayOfWeek = date.getDayOfWeek().getValue();
        return workingHoursRepository.findByWorkerIdAndDayOfWeek(workerId, dayOfWeek).stream()
                .filter(WorkingHours::isOpen)
                .map(wh -> new ShiftRange(wh.getOpenTime(), wh.getCloseTime()))
                .toList();
    }

    /**
     * Postavke salona za koliko unaprijed klijenti mogu rezervirati i koliko rane najave treba.
     * Vlasnik salona (ručni unos) svjesno zaobilazi ovu provjeru — walk-in klijent može doći odmah.
     */
    private void validateBookingWindow(Salon salon, LocalDateTime startTime) {
        if (salon.getMaxAdvanceBookingDays() != null
                && startTime.toLocalDate().isAfter(LocalDate.now().plusDays(salon.getMaxAdvanceBookingDays()))) {
            throw new RuntimeException(
                    "Termin je izvan dozvoljenog raspona — moguće je rezervirati najviše "
                            + salon.getMaxAdvanceBookingDays() + " dana unaprijed");
        }
        if (salon.getMinNoticeHours() != null
                && startTime.isBefore(LocalDateTime.now().plusHours(salon.getMinNoticeHours()))) {
            throw new RuntimeException(
                    "Potrebna je najava od barem " + salon.getMinNoticeHours() + " sati prije termina");
        }
    }

    private boolean isWithinBookingWindow(Salon salon, LocalDateTime startTime) {
        if (salon.getMaxAdvanceBookingDays() != null) {
            LocalDate maxDate = LocalDate.now().plusDays(salon.getMaxAdvanceBookingDays());
            if (startTime.toLocalDate().isAfter(maxDate)) {
                return false;
            }
        }
        if (salon.getMinNoticeHours() != null
                && startTime.isBefore(LocalDateTime.now().plusHours(salon.getMinNoticeHours()))) {
            return false;
        }
        return true;
    }

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
                .clientPhone(appointment.getClient().getPhone())
                .salonId(appointment.getSalon().getId())
                .salonName(appointment.getSalon().getName())
                .serviceId(appointment.getService().getId())
                .serviceName(appointment.getService().getName())
                .workerId(appointment.getWorker().getId())
                .workerName(appointment.getWorker().getName())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus().name())
                .createdAt(appointment.getCreatedAt())
                .build();
    }

    public AppointmentResponse createAppointment(AppointmentRequest request) {
        User client = getCurrentUser();
        Salon salon = salonRepository.findById(request.getSalonId())
                .orElseThrow(() -> new RuntimeException("Salon nije pronađen"));

        Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));

        if (!service.getSalon().getId().equals(salon.getId())) {
            throw new RuntimeException("Usluga ne pripada odabranom salonu");
        }

        Worker worker = workerRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new RuntimeException("Radnik nije pronađen"));

        if (!worker.getSalon().getId().equals(salon.getId())) {
            throw new RuntimeException("Radnik ne pripada odabranom salonu");
        }

        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());
        validateBookingWindow(salon, startTime);
        List<ShiftRange> dayShifts = getEffectiveShifts(salon.getId(), worker.getId(), startTime.toLocalDate());
        if (dayShifts.isEmpty()) {
            throw new RuntimeException("Nema definirano radno vrijeme za taj dan");
        }
        boolean withinShift = dayShifts.stream().anyMatch(s ->
                !startTime.toLocalTime().isBefore(s.openTime())
                        && !endTime.toLocalTime().isAfter(s.closeTime())
        );
        if (!withinShift) {
            throw new RuntimeException("Termin nije unutar radnog vremena radnika");
        }
        boolean overlaps = appointmentRepository
                .existsByWorkerAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                        worker,
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
                .worker(worker)
                .startTime(startTime)
                .endTime(endTime)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        return toResponse(saved);
    }

    public List<UserSearchResponse> searchClients(String query) {
        return userRepository.searchClients(query).stream()
                .map(u -> UserSearchResponse.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .phone(u.getPhone())
                        .build())
                .toList();
    }

    public AppointmentResponse createManualAppointment(ManualAppointmentRequest request) {
        User owner = getCurrentUser();
        Salon salon = salonRepository.findById(request.getSalonId())
                .orElseThrow(() -> new RuntimeException("Salon nije pronađen"));
        if (!salon.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("nemate ovlasti za ovu radnju");
        }

        User client = resolveClient(request);

        Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Usluga nije pronađena"));
        if (!service.getSalon().getId().equals(salon.getId())) {
            throw new RuntimeException("Usluga ne pripada odabranom salonu");
        }

        Worker worker = workerRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new RuntimeException("Radnik nije pronađen"));
        if (!worker.getSalon().getId().equals(salon.getId())) {
            throw new RuntimeException("Radnik ne pripada odabranom salonu");
        }

        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());
        List<ShiftRange> dayShifts = getEffectiveShifts(salon.getId(), worker.getId(), startTime.toLocalDate());
        if (dayShifts.isEmpty()) {
            throw new RuntimeException("Nema definirano radno vrijeme za taj dan");
        }
        boolean withinShift = dayShifts.stream().anyMatch(s ->
                !startTime.toLocalTime().isBefore(s.openTime())
                        && !endTime.toLocalTime().isAfter(s.closeTime())
        );
        if (!withinShift) {
            throw new RuntimeException("Termin nije unutar radnog vremena radnika");
        }
        boolean overlaps = appointmentRepository
                .existsByWorkerAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                        worker,
                        Appointment.Status.BOOKED,
                        endTime,
                        startTime
                );
        if (overlaps) {
            throw new RuntimeException("Termin je već zauzet");
        }

        Appointment appointment = Appointment.builder()
                .client(client)
                .salon(salon)
                .service(service)
                .worker(worker)
                .startTime(startTime)
                .endTime(endTime)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        return toResponse(saved);
    }

    private User resolveClient(ManualAppointmentRequest request) {
        if (request.getClientId() != null) {
            return userRepository.findById(request.getClientId())
                    .orElseThrow(() -> new RuntimeException("Klijent nije pronađen"));
        }
        if (request.getNewClient() != null) {
            if (userRepository.existsByEmail(request.getNewClient().getEmail())) {
                throw new RuntimeException("Korisnik s tim emailom već postoji, pretraži ga");
            }
            User newClient = User.builder()
                    .name(request.getNewClient().getName())
                    .email(request.getNewClient().getEmail())
                    .phone(request.getNewClient().getPhone())
                    .role(User.Role.CLIENT)
                    .build();
            return userRepository.save(newClient);
        }
        throw new RuntimeException("Odaberi postojećeg klijenta ili unesi podatke novog klijenta");
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
            throw new RuntimeException("nemate ovlasti za pregled rezervacija ovog salona");
        }
        return appointmentRepository.findBySalonAndStatus(salon, Appointment.Status.BOOKED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<String> getAvailableSlots(UUID salonId, UUID serviceId, UUID workerId, LocalDate date){
        Salon salon=salonRepository.findById(salonId).
                orElseThrow(()->new RuntimeException("salon nije pronaden"));
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(()->new RuntimeException("usluga nije pronadena"));
        if(!salon.getId().equals(service.getSalon().getId())){
            throw new RuntimeException("usluga ne pripada salonu");
        }
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("radnik nije pronaden"));
        if(!worker.getSalon().getId().equals(salon.getId())){
            throw new RuntimeException("radnik ne pripada salonu");
        }
        List<ShiftRange> dayShifts = getEffectiveShifts(salonId, workerId, date);
        if (dayShifts.isEmpty()) {
            throw new RuntimeException("Radnik nema definirano radno vrijeme za taj dan");
        }
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<Appointment> appointments = appointmentRepository
                .findByWorkerAndStatusAndStartTimeBetween(
                        worker,
                        Appointment.Status.BOOKED,
                        dayStart,
                        dayEnd
                );
        List<String> availableSlots=new ArrayList<>();
        for (ShiftRange shift : dayShifts) {
            LocalTime current = shift.openTime();
            LocalTime closeTime = shift.closeTime();
            while (!current.plusMinutes(service.getDurationMinutes()).isAfter(closeTime)) {
                LocalDateTime slotStart = LocalDateTime.of(date, current);
                LocalDateTime slotEnd = slotStart.plusMinutes(service.getDurationMinutes());
                boolean overlaps = appointments.stream().anyMatch(appointment ->
                        appointment.getStartTime().isBefore(slotEnd)
                        && appointment.getEndTime().isAfter(slotStart));
                boolean withinBookingWindow = isWithinBookingWindow(salon, slotStart);
                if (!overlaps && withinBookingWindow) {
                    availableSlots.add(current.toString());
                }
                current = current.plusMinutes(30);
            }
        }
        availableSlots.sort(String::compareTo);
        return availableSlots;
    }

    public void cancelAppointment(UUID appointmentId){
        User currentUser = getCurrentUser();
        Appointment appointment=appointmentRepository.findById(appointmentId)
                .orElseThrow(()->new RuntimeException("Termin nije pronaden"));
        boolean isClient = currentUser.getId().equals(appointment.getClient().getId());
        boolean isOwner = currentUser.getId().equals(appointment.getSalon().getOwner().getId());
        if(!isOwner && !isClient){
            throw new RuntimeException("Nemate dozvolu otkazati ovaj termin");
        }
        appointment.setStatus(Appointment.Status.CANCELLED);
        appointmentRepository.save(appointment);
    }
    public AnalyticsSummaryResponse getAnalyticsSummary(UUID salonId, LocalDateTime startTime, LocalDateTime endTime) {
        User owner = getCurrentUser();
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new RuntimeException("salon nije pronaden"));
        if (!owner.getId().equals(salon.getOwner().getId())) {
            throw new RuntimeException("nemate dozvolu za pristup analtici ovog objekta");
        }
        Long booked = appointmentRepository.countBySalonAndStatusAndStartTimeBetween(salon, Appointment.Status.BOOKED, startTime, endTime);
        Long cancelled = appointmentRepository.countBySalonAndStatusAndStartTimeBetween(salon, Appointment.Status.CANCELLED, startTime, endTime);
        BigDecimal revenue = appointmentRepository.sumRevenueBySalonAndStatusAndPeriod(salon, Appointment.Status.BOOKED,startTime,endTime,LocalDateTime.now());
        return AnalyticsSummaryResponse.builder()
                .totalBooked(booked)
                .totalCancelled(cancelled)
                .total(booked + cancelled)
                .revenue(revenue)
                .build();
    }

    public List<ServiceAnalyticsResponse> getServiceBreakdown(UUID salonId, LocalDateTime startTime, LocalDateTime endTime) {
        User owner = getCurrentUser();
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new RuntimeException("salon nije pronaden"));
        if (!owner.getId().equals(salon.getOwner().getId())) {
            throw new RuntimeException("nemate dozvolu za pristup analtici ovog objekta");
        }
        return appointmentRepository.findServiceBreakdown(salon, Appointment.Status.BOOKED, startTime, endTime)
                .stream()
                .map(row -> ServiceAnalyticsResponse.builder()
                        .serviceId((UUID) row[0])
                        .serviceName((String) row[1])
                        .bookedCount((Long) row[2])
                        .revenue((BigDecimal) row[3])
                        .build())
                .toList();
    }
    public AppointmentResponse rescheduleAppointment(UUID appointmentId, RescheduleRequest request) {
        User owner = getCurrentUser();

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Termin nije pronaden"));
        if(!owner.getId().equals(appointment.getSalon().getOwner().getId())){
            throw new RuntimeException("nemate dozvolu za ovu radnju!");
        }

        Worker worker = workerRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new RuntimeException("Radnik nije pronađen"));
        if (!worker.getSalon().getId().equals(appointment.getSalon().getId())) {
            throw new RuntimeException("Radnik ne pripada ovom salonu");
        }
        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(appointment.getService().getDurationMinutes());
        List<ShiftRange> dayShifts = getEffectiveShifts(appointment.getSalon().getId(), worker.getId(), startTime.toLocalDate());
        if (dayShifts.isEmpty()) {
            throw new RuntimeException("Nema definirano radno vrijeme za taj dan");
        }
        boolean withinShift = dayShifts.stream().anyMatch(s ->
                !startTime.toLocalTime().isBefore(s.openTime())
                        && !endTime.toLocalTime().isAfter(s.closeTime())
        );
        if (!withinShift) {
            throw new RuntimeException("Termin nije unutar radnog vremena radnika");
        }
        boolean overlaps = appointmentRepository
                .existsByWorkerAndStatusAndStartTimeLessThanAndEndTimeGreaterThanAndIdNot(
                        worker,
                        Appointment.Status.BOOKED,
                        endTime,
                        startTime,
                        appointmentId
                );

        if (overlaps) {
            throw new RuntimeException("Termin je već zauzet");
        }
        appointment.setWorker(worker);
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);

        Appointment saved = appointmentRepository.save(appointment);
        return toResponse(saved);
    }


}
