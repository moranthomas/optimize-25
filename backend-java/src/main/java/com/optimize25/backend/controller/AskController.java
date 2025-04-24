package com.optimize25.backend.controller;

import com.optimize25.backend.config.OpenAiConfig;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api")
public class AskController {

    private static final Logger logger = LoggerFactory.getLogger(AskController.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private OpenAiConfig openAiConfig;

    @GetMapping("/ask")
    public ResponseEntity<Map<String, String>> ask(@RequestParam String query) {
        try {
            logger.info("Received question: {}", query);
            
            // Step 1: (Stub) fetch related Confluence page content
            String pageContent = "Content from Confluence (stubbed for now)";
            logger.info("Retrieved Confluence content (stub)");

            // Step 2: Ask OpenAI
            String prompt;
            if (pageContent.equals("Content from Confluence (stubbed for now)")) {
                prompt = query;  // Just ask the question directly if we don't have real Confluence content
            } else {
                prompt = "Based on the following documentation, answer this question: \n" +
                        pageContent + "\nQuestion: " + query;
            }
            logger.info("Sending prompt to OpenAI");

            String response = callOpenAi(prompt);
            logger.info("Received response from OpenAI");

            Map<String, String> result = new HashMap<>();
            result.put("answer", response);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("Error processing request", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to process request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    private String callOpenAi(String prompt) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-3.5-turbo");
            body.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
            ));
            body.put("temperature", 0.7);

            HttpHeaders headers = new HttpHeaders();
            String apiKey = openAiConfig.getKey();
            if (apiKey == null || apiKey.isEmpty() || apiKey.equals("sk-your-actual-api-key")) {
                logger.error("OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.");
                throw new RuntimeException("OpenAI API key not configured");
            }
            logger.info("Using API key (first 7 chars): {}", apiKey.substring(0, Math.min(7, apiKey.length())) + "...");
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("Content-Type", "application/json");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            
            // Log the request details (excluding sensitive data)
            logger.info("Sending request to: {}", openAiConfig.getUrl());
            logger.info("Request body: {}", objectMapper.writeValueAsString(body));

            Map<String, Object> response = restTemplate.exchange(
                openAiConfig.getUrl(),
                org.springframework.http.HttpMethod.POST,
                request,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            ).getBody();

            // Extract the actual response text from the OpenAI response
            if (response != null) {
                logger.debug("OpenAI Response: {}", objectMapper.writeValueAsString(response));
                
                if (response.containsKey("error")) {
                    Map<?, ?> error = (Map<?, ?>) response.get("error");
                    String errorMessage = error.containsKey("message") ? 
                        error.get("message").toString() : "Unknown error from OpenAI";
                    throw new RuntimeException("OpenAI API Error: " + errorMessage);
                }

                if (response.containsKey("choices")) {
                    Object choices = response.get("choices");
                    if (choices instanceof List) {
                        List<?> choicesList = (List<?>) choices;
                        if (!choicesList.isEmpty() && choicesList.get(0) instanceof Map) {
                            Map<?, ?> firstChoice = (Map<?, ?>) choicesList.get(0);
                            if (firstChoice.containsKey("message")) {
                                Map<?, ?> message = (Map<?, ?>) firstChoice.get("message");
                                if (message.containsKey("content")) {
                                    return message.get("content").toString();
                                }
                            }
                        }
                    }
                }
                throw new RuntimeException("Unexpected response format from OpenAI");
            }
            throw new RuntimeException("Empty response from OpenAI");
        } catch (Exception e) {
            logger.error("Error calling OpenAI API: {}", e.getMessage());
            logger.error("Stack trace: ", e);
            throw new RuntimeException("Failed to get response from OpenAI: " + e.getMessage());
        }
    }
} 