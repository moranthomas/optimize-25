package com.optimize25.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AskController {
    
    private static final Logger logger = LoggerFactory.getLogger(AskController.class);

    @GetMapping("/api/ask")
    public AnswerResponse askQuestion(@RequestParam String query) {
        logger.info("Received question: {}", query);
        // TODO: Implement actual LLM integration
        String response = "This is a placeholder response for: " + query;
        logger.info("Sending response: {}", response);
        return new AnswerResponse(response);
    }

    private static class AnswerResponse {
        private final String answer;

        public AnswerResponse(String answer) {
            this.answer = answer;
        }

        public String getAnswer() {
            return answer;
        }
    }
} 