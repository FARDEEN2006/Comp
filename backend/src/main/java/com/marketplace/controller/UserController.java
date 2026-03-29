package com.marketplace.controller;

import com.marketplace.dto.ApiMessageResponse;
import com.marketplace.dto.ChangePasswordRequest;
import com.marketplace.dto.UpdateProfileRequest;
import com.marketplace.entity.User;
import com.marketplace.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public User getUser(
        @PathVariable Long id,
        @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        if (requesterId == null || !requesterId.equals(id)) {
            throw new IllegalArgumentException("Unauthorized: You can only view your own profile");
        }
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    public ApiMessageResponse updateProfile(
        @PathVariable Long id,
        @Valid @RequestBody UpdateProfileRequest request,
        @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        if (requesterId == null || !requesterId.equals(id)) {
            throw new IllegalArgumentException("Unauthorized: You can only update your own profile");
        }
        User user = userService.updateProfile(id, request);
        return new ApiMessageResponse("Profile updated for " + user.getName());
    }

    @PutMapping("/{id}/password")
    public ApiMessageResponse changePassword(
        @PathVariable Long id,
        @Valid @RequestBody ChangePasswordRequest request,
        @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        if (requesterId == null || !requesterId.equals(id)) {
            throw new IllegalArgumentException("Unauthorized: You can only change your own password");
        }
        userService.changePassword(id, request);
        return new ApiMessageResponse("Password updated successfully");
    }
}
