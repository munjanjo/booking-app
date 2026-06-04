package org.example.bookingapp.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${app.jwt.secret}")
    private String secret;
    @Value("${app.jwt.expiration}")
    private long expiration;
    private Key getKey(){
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
    public String generateToken(String email, String role){
        return Jwts.builder()
                .subject(email)
                .claim("role",role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }
    public String extractEmail (String token){
        return Jwts.parser().verifyWith((javax.crypto.SecretKey) getKey())
                .build().parseSignedClaims(token).getPayload().getSubject();
    }
    public boolean isValid(String token){
        try {
            Jwts.parser().verifyWith((javax.crypto.SecretKey) getKey())
                    .build().parseSignedClaims(token);
            return true;
        }catch (JwtException e){
            return false;
        }
    }
    public String extractRole (String token){
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
    }
}

