package com.optimize25.backend.dto;

import java.time.LocalDateTime;

public class QuizResultDTO {
    private Long id;
    private String topic;
    private double score;
    private LocalDateTime createdAt;
    private String username;

    public QuizResultDTO(Long id, String topic, double score, LocalDateTime createdAt, String username) {
        this.id = id;
        this.topic = topic;
        this.score = score;
        this.createdAt = createdAt;
        this.username = username;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getTopic() {
        return topic;
    }

    public double getScore() {
        return score;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getUsername() {
        return username;
    }
} 