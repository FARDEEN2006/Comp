package com.marketplace.service;

import com.marketplace.dto.ChangePasswordRequest;
import com.marketplace.dto.UpdateProfileRequest;
import com.marketplace.entity.User;
import com.marketplace.exception.NotFoundException;
import com.marketplace.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (!normalizedEmail.equals(user.getEmail()) && userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already in use");
        }

        user.setName(request.getName());
        user.setEmail(normalizedEmail);
        user.setPhone(normalizePhone(request.getPhone()));

        return userRepository.save(user);
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
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
