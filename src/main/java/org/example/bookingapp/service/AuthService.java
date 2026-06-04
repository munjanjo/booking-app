package org.example.bookingapp.service;

import lombok.RequiredArgsConstructor;
import org.example.bookingapp.dto.AuthResponse;
import org.example.bookingapp.dto.LoginRequest;
import org.example.bookingapp.dto.RegisterRequest;
import org.example.bookingapp.entity.User;
import org.example.bookingapp.repository.UserRepository;
import org.example.bookingapp.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest req){
        if(userRepository.existsByEmail(req.getEmail())){
            throw new RuntimeException("Email vec postoji!");
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.valueOf(req.getRole()))
                .build();
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token,user.getRole().name(), user.getName());
    }
    public AuthResponse login(LoginRequest req){
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(()->new RuntimeException("Korisnik nije pronaden"));
        if(!passwordEncoder.matches(req.getPassword(),user.getPasswordHash())){
            throw new RuntimeException("Pogresna lozinka!");
        }
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token,user.getRole().name(), user.getName());
    }
}
