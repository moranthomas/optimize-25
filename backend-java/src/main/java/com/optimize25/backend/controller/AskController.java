package com.optimize25.backend.controller;

import com.optimize25.backend.config.OpenAiConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@RestController
@RequestMapping("/api/chatgpt")
@CrossOrigin(origins = "http://localhost:3000")
public class AskController {

    @Autowired
    private OpenAiConfig openAiConfig;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/ask")
    public ResponseEntity<?> askQuestion(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Question cannot be empty");
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            requestBody.put("messages", Arrays.asList(
                Map.of("role", "system", "content", "You are a helpful assistant."),
                Map.of("role", "user", "content", question)
            ));
            requestBody.put("temperature", 0.7);

            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(requestBody, openAiConfig.openaiHeaders());

            ResponseEntity<Map> response = restTemplate.postForEntity(
                openAiConfig.getOpenaiApiUrl(),
                httpEntity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, String> message = (Map<String, String>) choice.get("message");
                    String content = message.get("content");
                    return ResponseEntity.ok(Map.of("answer", content));
                }
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to get response from ChatGPT");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error processing request: " + e.getMessage());
        }
    }
} 