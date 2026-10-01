package com.careercompass;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

@Component
class CurrentOwner {
    String id() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated())
            throw new IllegalStateException("An authenticated owner is required");
        if (authentication.getPrincipal() instanceof OidcUser user)
            return user.getIssuer().toString() + "|" + user.getSubject();
        return "local:" + authentication.getName();
    }
}
