package com.marketplace.service;

import com.marketplace.dto.AuthResponse;
import com.marketplace.dto.LoginRequest;
import com.marketplace.dto.RegisterRequest;
import com.marketplace.entity.User;
import com.marketplace.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPhone(normalizePhone(request.getPhone()));
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);
        return new AuthResponse(saved.getId(), saved.getName(), saved.getEmail(), "Registration successful");
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), "Login successful");
    }

    private String normalizePhone(String phone) {
        String raw = phone == null ? "" : phone.trim().replaceAll("[^\\d+]", "");
        if (raw.isBlank()) {
            throw new IllegalArgumentException("Phone is required");
        }

        if (raw.startsWith("00")) {
            raw = "+" + raw.substring(2);
        }

        // India-focused default for local input. Keep explicit country-code numbers as-is.
        if (!raw.startsWith("+")) {
            if (raw.length() == 10) {
                raw = "+91" + raw;
            } else if (raw.length() == 11 && raw.startsWith("0")) {
                raw = "+91" + raw.substring(1);
            } else if (raw.length() >= 11 && raw.length() <= 15) {
                raw = "+" + raw;
            } else {
                throw new IllegalArgumentException("Phone format is invalid");
            }
        }

        String digits = raw.substring(1);
        if (!digits.matches("[1-9]\\d{9,14}")) {
            throw new IllegalArgumentException("Phone format is invalid");
        }
        return "+" + digits;
    }
}
