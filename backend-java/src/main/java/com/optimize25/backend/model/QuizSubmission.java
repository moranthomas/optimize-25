package com.optimize25.backend.model;

import java.util.List;
import java.util.Map;

public class QuizSubmission {
    private String topic;
    private List<Question> questions;
    private Map<Integer, String> userAnswers;

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

    public Map<Integer, String> getUserAnswers() {
        return userAnswers;
    }

    public void setUserAnswers(Map<Integer, String> userAnswers) {
        this.userAnswers = userAnswers;
    }
} 