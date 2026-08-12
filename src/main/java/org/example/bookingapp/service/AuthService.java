package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.AuthResponse;
import org.example.bookingapp.dto.LoginRequest;
import org.example.bookingapp.dto.MessageResponse;
import org.example.bookingapp.dto.RegisterRequest;
import org.example.bookingapp.dto.ResetPasswordRequest;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.repository.UserRepository;
import org.example.bookingapp.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.base-url}")
    private String baseUrl;

    public MessageResponse register(RegisterRequest req){
        if(userRepository.existsByEmail(req.getEmail())){
            throw new RuntimeException("Email vec postoji!");
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.valueOf(req.getRole()))
                .emailVerified(false)
                .build();
        assignVerificationToken(user);
        userRepository.save(user);
        sendVerificationEmail(user);
        return new MessageResponse("Registracija uspješna. Provjeri email da potvrdiš račun.");
    }

    public AuthResponse login(LoginRequest req){
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(()->new RuntimeException("Korisnik nije pronaden"));
        if(!passwordEncoder.matches(req.getPassword(),user.getPasswordHash())){
            throw new RuntimeException("Pogresna lozinka!");
        }
        if(!user.isEmailVerified()){
            throw new RuntimeException("Email nije potvrđen. Provjeri inbox ili zatraži novi link za potvrdu.");
        }
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token,user.getRole().name(), user.getName());
    }

    public AuthResponse verifyEmail(String token){
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Neispravan link za potvrdu"));
        if(user.getVerificationTokenExpiry() == null || user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())){
            throw new RuntimeException("Link za potvrdu je istekao. Zatraži novi.");
        }
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);
        String authToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(authToken, user.getRole().name(), user.getName());
    }

    public MessageResponse resendVerification(String email){
        userRepository.findByEmail(email).ifPresent(user -> {
            if(!user.isEmailVerified()){
                assignVerificationToken(user);
                userRepository.save(user);
                sendVerificationEmail(user);
            }
        });
        return new MessageResponse("Ako račun postoji, poslan je novi link za potvrdu.");
    }

    public MessageResponse forgotPassword(String email){
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setPasswordResetToken(UUID.randomUUID().toString());
            user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            String link = baseUrl + "/reset-lozinka?token=" + user.getPasswordResetToken();
            emailService.send(
                    user.getEmail(),
                    "Resetiraj lozinku — Apunta",
                    "<p>Pozdrav " + user.getName() + ",</p>"
                            + "<p>Zatražen je reset lozinke za tvoj Apunta račun. Klikni na link ispod da postaviš novu lozinku (link vrijedi 1 sat):</p>"
                            + "<p><a href=\"" + link + "\">" + link + "</a></p>"
                            + "<p>Ako ovo nisi ti tražio/la, slobodno ignoriraj ovaj email.</p>"
            );
        });
        return new MessageResponse("Ako račun postoji, poslan je email s uputama za reset lozinke.");
    }

    public MessageResponse resetPassword(ResetPasswordRequest req){
        User user = userRepository.findByPasswordResetToken(req.getToken())
                .orElseThrow(() -> new RuntimeException("Neispravan ili istekao link"));
        if(user.getPasswordResetTokenExpiry() == null || user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())){
            throw new RuntimeException("Link za reset lozinke je istekao. Zatraži novi.");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
        return new MessageResponse("Lozinka je uspješno promijenjena. Sad se možeš prijaviti.");
    }

    private void assignVerificationToken(User user){
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
    }

    private void sendVerificationEmail(User user){
        String link = baseUrl + "/potvrdi-email?token=" + user.getVerificationToken();
        emailService.send(
                user.getEmail(),
                "Potvrdi svoj Apunta račun",
                "<p>Pozdrav " + user.getName() + ",</p>"
                        + "<p>Hvala na registraciji na Apunta! Klikni na link ispod da potvrdiš svoj email (link vrijedi 24h):</p>"
                        + "<p><a href=\"" + link + "\">" + link + "</a></p>"
        );
    }
}
