package com.careercompass;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
class AuthController {
    @GetMapping("/api/auth/config")
    Map<String, String> config(@Value("${app.auth-mode:basic}") String mode) {
        return Map.of("mode", mode);
    }
}
