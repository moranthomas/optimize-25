package com.optimize25.backend.service;

import com.optimize25.backend.model.User;
import com.optimize25.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void init() {
        // Create guest user if it doesn't exist
        if (userRepository.findByUsername("guest").isEmpty()) {
            User guestUser = new User();
            guestUser.setUsername("guest");
            userRepository.save(guestUser);
        }
    }

    public User getOrCreateGuestUser() {
        return userRepository.findByUsername("guest")
                .orElseGet(() -> {
                    User guestUser = new User();
                    guestUser.setUsername("guest");
                    return userRepository.save(guestUser);
                });
    }
} 