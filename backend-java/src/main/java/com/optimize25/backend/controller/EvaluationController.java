package com.optimize25.backend.controller;

import com.optimize25.backend.model.QuizRequest;
import com.optimize25.backend.model.QuizSubmission;
import com.optimize25.backend.service.EvaluationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evaluate")
@CrossOrigin(origins = "http://localhost:3000")
public class EvaluationController {

    @Autowired
    private EvaluationService evaluationService;

    @PostMapping("/generate-quiz")
    public ResponseEntity<?> generateQuiz(@RequestBody QuizRequest request) {
        try {
            return ResponseEntity.ok(evaluationService.generateQuiz(request.getTopic()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to generate quiz: " + e.getMessage());
        }
    }

    @PostMapping("/submit-quiz")
    public ResponseEntity<?> submitQuiz(@RequestBody QuizSubmission submission) {
        try {
            return ResponseEntity.ok(evaluationService.evaluateQuiz(submission));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to evaluate quiz: " + e.getMessage());
        }
    }
} 