package com.marketplace.controller;

import com.marketplace.dto.ApiMessageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ApiMessageResponse health() {
        return new ApiMessageResponse("Backend is running");
    }
}
