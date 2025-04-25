package com.optimize25.backend.service;

import com.optimize25.backend.model.Question;
import com.optimize25.backend.model.QuizResult;
import com.optimize25.backend.model.QuizSubmission;
import com.optimize25.backend.repository.QuizResultRepository;
import com.optimize25.backend.config.OpenAiConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.stream.Collectors;

@Service
public class EvaluationService {

    private static final Logger logger = LoggerFactory.getLogger(EvaluationService.class);
    private static final Map<String, List<Question>> quizCache = new HashMap<>();

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private QuizResultRepository quizResultRepository;

    @Autowired
    private OpenAiConfig openAiConfig;

    private final String model = "gpt-3.5-turbo";
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> generateQuiz(String topic) {
        // Check cache first
        if (quizCache.containsKey(topic)) {
            logger.info("Returning cached quiz for topic: {}", topic);
            Map<String, Object> result = new HashMap<>();
            result.put("questions", quizCache.get(topic));
            return result;
        }

        String prompt = String.format(
            "Generate 5 technical multiple choice questions about %s. " +
            "Each question must have 4 options and one correct answer. " +
            "Format as JSON array with fields: question, options, correctAnswer. " +
            "Return only the JSON array, without any wrapper object.",
            topic
        );

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", Arrays.asList(
            Map.of("role", "system", "content", "You are a technical quiz generator. Respond only with JSON."),
            Map.of("role", "user", "content", prompt)
        ));
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1000);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, openAiConfig.openaiHeaders());

        try {
            long startTime = System.currentTimeMillis();
            ResponseEntity<Map> response = restTemplate.postForEntity(
                openAiConfig.getOpenaiApiUrl(),
                request,
                Map.class
            );
            long endTime = System.currentTimeMillis();
            logger.info("Quiz generation took {} ms", endTime - startTime);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map responseBody = response.getBody();
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                String content = (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");

                // Log the raw response for debugging
                logger.debug("Raw response from ChatGPT: {}", content);

                // Parse the JSON string directly into a List of Question objects
                List<Question> questions = objectMapper.readValue(
                    content.trim(),
                    new TypeReference<List<Question>>() {}
                );

                // Validate that we got questions about the topic
                if (questions.isEmpty()) {
                    throw new RuntimeException("No questions generated");
                }

                // Cache the questions
                quizCache.put(topic, questions);

                Map<String, Object> result = new HashMap<>();
                result.put("questions", questions);
                return result;
            } else {
                throw new RuntimeException("Failed to get response from OpenAI API");
            }
        } catch (Exception e) {
            logger.error("Error generating quiz for topic: " + topic, e);
            throw new RuntimeException("Failed to generate quiz: " + e.getMessage());
        }
    }

    private Map<String, Object> generateMockQuestions(String topic) {
        List<Question> questions = new ArrayList<>();
        questions.add(createMockQuestion(
            "What is the capital of France?",
            Arrays.asList("London", "Berlin", "Paris", "Madrid"),
            "Paris"
        ));
        // Add more mock questions for testing
        questions.add(createMockQuestion(
            "Which planet is known as the Red Planet?",
            Arrays.asList("Venus", "Mars", "Jupiter", "Saturn"),
            "Mars"
        ));
        questions.add(createMockQuestion(
            "What is the chemical symbol for gold?",
            Arrays.asList("Ag", "Fe", "Au", "Cu"),
            "Au"
        ));
        questions.add(createMockQuestion(
            "Who painted the Mona Lisa?",
            Arrays.asList("Van Gogh", "Da Vinci", "Picasso", "Rembrandt"),
            "Da Vinci"
        ));
        questions.add(createMockQuestion(
            "What is the largest ocean on Earth?",
            Arrays.asList("Atlantic", "Indian", "Arctic", "Pacific"),
            "Pacific"
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("questions", questions);
        return response;
    }

    public Map<String, Object> evaluateQuiz(QuizSubmission submission) {
        int correctAnswers = 0;
        List<Question> questions = submission.getQuestions();
        Map<Integer, String> userAnswers = submission.getUserAnswers();

        for (int i = 0; i < questions.size(); i++) {
            if (userAnswers.containsKey(i) && 
                userAnswers.get(i).equals(questions.get(i).getCorrectAnswer())) {
                correctAnswers++;
            }
        }

        double score = (double) correctAnswers / questions.size() * 100;

        // Save the quiz result
        QuizResult quizResult = new QuizResult();
        quizResult.setTopic(submission.getTopic());
        quizResult.setScore(score);
        quizResultRepository.save(quizResult);

        Map<String, Object> result = new HashMap<>();
        result.put("score", score);
        result.put("correctAnswers", correctAnswers);
        result.put("totalQuestions", questions.size());

        // Get previous results for this topic
        List<QuizResult> previousResults = quizResultRepository.findByTopicOrderByCreatedAtDesc(submission.getTopic());
        if (!previousResults.isEmpty()) {
            result.put("previousBestScore", previousResults.stream()
                .mapToDouble(QuizResult::getScore)
                .max()
                .orElse(0.0));
        }

        return result;
    }

    private Question createMockQuestion(String question, List<String> options, String correctAnswer) {
        Question q = new Question();
        q.setQuestion(question);
        q.setOptions(options);
        q.setCorrectAnswer(correctAnswer);
        return q;
    }
} 