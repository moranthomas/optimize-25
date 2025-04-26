package com.optimize25.backend.controller;

import com.optimize25.backend.dto.QuizResultDTO;
import com.optimize25.backend.model.QuizResult;
import com.optimize25.backend.model.User;
import com.optimize25.backend.repository.QuizResultRepository;
import com.optimize25.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/evaluate")
public class QuizHistoryController {

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private UserService userService;

    @GetMapping("/history")
    public ResponseEntity<List<QuizResultDTO>> getAllHistory() {
        User guestUser = userService.getOrCreateGuestUser();
        List<QuizResult> history = quizResultRepository.findByUserOrderByCreatedAtDesc(guestUser);
        List<QuizResultDTO> dtos = history.stream()
            .map(result -> new QuizResultDTO(
                result.getId(),
                result.getTopic(),
                result.getScore(),
                result.getCreatedAt(),
                result.getUser().getUsername()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/history/{topic}")
    public ResponseEntity<List<QuizResultDTO>> getHistoryByTopic(@PathVariable String topic) {
        User guestUser = userService.getOrCreateGuestUser();
        List<QuizResult> history = quizResultRepository.findByUserAndTopicOrderByCreatedAtDesc(guestUser, topic);
        List<QuizResultDTO> dtos = history.stream()
            .map(result -> new QuizResultDTO(
                result.getId(),
                result.getTopic(),
                result.getScore(),
                result.getCreatedAt(),
                result.getUser().getUsername()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
} 