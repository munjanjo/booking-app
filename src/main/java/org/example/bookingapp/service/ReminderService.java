package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.bookingapp.entity.Appointment;
import org.example.bookingapp.repository.AppointmentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private static final DateTimeFormatter DISPLAY_FORMAT = DateTimeFormatter.ofPattern("d.M.yyyy. 'u' HH:mm");

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    // provjerava svakih 15 minuta ima li termina koji pocinju za otprilike 24h i jos nisu dobili podsjetnik
    @Scheduled(fixedRate = 15 * 60 * 1000)
    public void sendUpcomingReminders() {
        LocalDateTime windowStart = LocalDateTime.now().plusHours(24);
        LocalDateTime windowEnd = windowStart.plusMinutes(15);

        List<Appointment> dueForReminder = appointmentRepository
                .findByStatusAndReminderSentFalseAndStartTimeBetween(
                        Appointment.Status.BOOKED, windowStart, windowEnd);

        for (Appointment appointment : dueForReminder) {
            try {
                emailService.send(
                        appointment.getClient().getEmail(),
                        "Podsjetnik: termin sutra u " + appointment.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                        "<p>Pozdrav " + appointment.getClient().getName() + ",</p>"
                                + "<p>Podsjećamo te na rezervirani termin:</p>"
                                + "<p><strong>" + appointment.getService().getName() + "</strong><br>"
                                + appointment.getSalon().getName() + "<br>"
                                + appointment.getStartTime().format(DISPLAY_FORMAT) + "</p>"
                );
                appointment.setReminderSent(true);
                appointmentRepository.save(appointment);
            } catch (Exception e) {
                log.error("Slanje podsjetnika nije uspjelo za appointment {}", appointment.getId(), e);
            }
        }
    }
}
