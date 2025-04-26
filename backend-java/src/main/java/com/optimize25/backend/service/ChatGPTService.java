package com.optimize25.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.repository.KnowledgeNodeRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.env.Environment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class ChatGPTService {

    private static final Logger logger = LoggerFactory.getLogger(ChatGPTService.class);
    private final String apiKey;
    private final String apiUrl = "https://api.openai.com/v1/chat/completions";
    private final RestTemplate restTemplate;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final ObjectMapper objectMapper;
    private static final int BATCH_SIZE = 50;
    private static final Set<String> nodesBeingPopulated = Collections.synchronizedSet(new HashSet<>());
    private static final Set<String> KNOWN_CATEGORIES = Set.of(
        "Software Engineering", "Data Science", "Business", "Psychology", "Mathematics", "Physics", "Biology"
    );

    public ChatGPTService(KnowledgeNodeRepository knowledgeNodeRepository, Environment environment) {
        this.restTemplate = new RestTemplate();
        this.knowledgeNodeRepository = knowledgeNodeRepository;
        this.objectMapper = new ObjectMapper();
        this.apiKey = environment.getProperty("OPENAI_API_KEY");
        if (this.apiKey == null || this.apiKey.isEmpty()) {
            throw new IllegalStateException("OPENAI_API_KEY environment variable is not set");
        }
    }

    @Transactional
    public void populateNode(String nodeName) {
        logger.info("Starting to populate node: {}", nodeName);
        
        // Check if node is already being populated
        if (!nodesBeingPopulated.add(nodeName)) {
            logger.info("Node {} is already being populated, skipping request", nodeName);
            throw new RuntimeException("This topic is already being populated. Please wait for the current operation to complete.");
        }
        
        try {
            // First, determine the appropriate parent category for this node
            KnowledgeNode parentNode = determineParentCategory(nodeName);
            
            // Create or get the node
            KnowledgeNode node;
            Optional<KnowledgeNode> existingNode = knowledgeNodeRepository.findByName(nodeName);
            
            if (existingNode.isPresent()) {
                node = existingNode.get();
                // Update parent if needed
                if (!node.getParent().equals(parentNode)) {
                    node.setParent(parentNode);
                    node = knowledgeNodeRepository.save(node);
                }
            } else {
                // Create new node under determined parent
                node = new KnowledgeNode();
                node.setName(nodeName);
                node.setParent(parentNode);
                node.setLevel(parentNode.getLevel() + 1);
                node = knowledgeNodeRepository.save(node);
            }
            
            // Get existing children names for duplicate detection
            Set<String> existingChildrenNames = new HashSet<>(
                knowledgeNodeRepository.findChildrenNamesByParentId(node.getId())
            );
            
            logger.info("Found/Created node with ID: {} under parent: {}, with {} existing children", 
                node.getId(), parentNode.getName(), existingChildrenNames.size());

            // Prepare the prompt for ChatGPT with context
            String prompt = buildPromptWithContext(nodeName, existingChildrenNames);
            
            try {
                String content = callChatGPT(prompt);
                List<Map<String, Object>> nodeDataList = parseResponse(content);
                
                // Process nodes in batches
                createNodesInBatches(nodeDataList, node, existingChildrenNames);
                
            } catch (Exception e) {
                logger.error("Failed to populate node: " + nodeName, e);
                throw new RuntimeException("Failed to populate node: " + e.getMessage());
            }
        } finally {
            nodesBeingPopulated.remove(nodeName);
        }
    }

    private String buildPromptWithContext(String nodeName, Set<String> existingChildrenNames) {
        StringBuilder prompt = new StringBuilder();
        prompt.append(String.format(
            "Create a detailed learning plan for %s. ", nodeName));
        
        if (!existingChildrenNames.isEmpty()) {
            // Get existing nodes' details
            List<KnowledgeNode> existingNodes = knowledgeNodeRepository.findByParentId(
                knowledgeNodeRepository.findByName(nodeName)
                    .orElseThrow(() -> new RuntimeException("Node not found: " + nodeName))
                    .getId()
            );
            
            prompt.append("\nExisting subtopics and their content:\n");
            for (KnowledgeNode node : existingNodes) {
                prompt.append("\nTopic: ").append(node.getName())
                      .append("\nDescription: ").append(node.getDescription())
                      .append("\nKey Concepts: ").append(node.getContent())
                      .append("\n");
            }
            prompt.append("\nPlease analyze the existing content above and provide complementary topics that:")
                  .append("\n1. Fill any knowledge gaps")
                  .append("\n2. Add depth to existing topics where needed")
                  .append("\n3. Introduce related concepts not yet covered")
                  .append("\n4. Avoid duplicating existing content");
        }
        
        prompt.append("\nFor each new topic, provide:\n")
              .append("1. A clear, concise name\n")
              .append("2. A detailed description explaining its importance and how it relates to existing topics\n")
              .append("3. Specific learning objectives and key concepts\n")
              .append("4. Practical examples or exercises\n")
              .append("5. References or resources\n")
              .append("Format as JSON array: [{name, description, content, examples, references}]");
        
        return prompt.toString();
    }

    private String callChatGPT(String prompt) {
        Map<String, Object> request = new HashMap<>();
        request.put("model", "gpt-4");
        request.put("messages", List.of(
            Map.of("role", "system", "content", 
                "You are an expert curriculum designer. Create detailed, practical learning plans."),
            Map.of("role", "user", "content", prompt)
        ));
        request.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
        
        try {
            logger.info("Sending request to ChatGPT API");
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);
            
            if (response == null || !response.containsKey("choices")) {
                throw new RuntimeException("Invalid response from ChatGPT API");
            }
            
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices.isEmpty()) {
                throw new RuntimeException("No content in ChatGPT response");
            }
            
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");
            
        } catch (Exception e) {
            logger.error("Error calling ChatGPT API", e);
            throw new RuntimeException("Failed to get response from ChatGPT: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> parseResponse(String content) {
        try {
            Object parsed = objectMapper.readValue(content, Object.class);
            
            if (parsed instanceof List) {
                return (List<Map<String, Object>>) parsed;
            } else if (parsed instanceof Map) {
                return Collections.singletonList((Map<String, Object>) parsed);
            } else {
                throw new RuntimeException("Unexpected response format");
            }
        } catch (Exception e) {
            logger.error("Failed to parse ChatGPT response", e);
            throw new RuntimeException("Failed to parse response: " + e.getMessage());
        }
    }

    private String extractStringValue(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof String) {
            return (String) value;
        }
        if (value instanceof Map) {
            // For nested objects, convert to JSON string
            try {
                return objectMapper.writeValueAsString(value);
            } catch (Exception e) {
                logger.warn("Failed to convert nested object to string for key {}: {}", key, e.getMessage());
                return value.toString();
            }
        }
        return value.toString();
    }

    @Transactional
    private void createNodesInBatches(
        List<Map<String, Object>> nodeDataList, 
        KnowledgeNode parent,
        Set<String> existingChildrenNames
    ) {
        List<KnowledgeNode> nodeBatch = new ArrayList<>();
        long orderCounter = knowledgeNodeRepository.countByParent(parent);
        
        for (Map<String, Object> nodeData : nodeDataList) {
            String nodeName = extractStringValue(nodeData, "name");
            if (nodeName == null) {
                logger.warn("Skipping node with missing name");
                continue;
            }
            
            // Skip if node with this name already exists
            if (existingChildrenNames.contains(nodeName)) {
                logger.info("Skipping duplicate node: {}", nodeName);
                continue;
            }
            
            try {
                KnowledgeNode node = new KnowledgeNode();
                node.setName(nodeName);
                node.setDescription(extractStringValue(nodeData, "description"));
                node.setContent(extractStringValue(nodeData, "content"));
                node.setExamples(extractStringValue(nodeData, "examples"));
                node.setReferences(extractStringValue(nodeData, "references"));
                node.setParent(parent);
                node.setLevel(parent.getLevel() + 1);
                node.setNodeOrder(Math.toIntExact(++orderCounter));
                
                nodeBatch.add(node);
                
                // Save batch when it reaches the size limit
                if (nodeBatch.size() >= BATCH_SIZE) {
                    saveNodeBatch(nodeBatch);
                    nodeBatch.clear();
                }
                
            } catch (Exception e) {
                logger.error("Error creating node: {}", nodeName, e);
            }
        }
        
        // Save any remaining nodes
        if (!nodeBatch.isEmpty()) {
            saveNodeBatch(nodeBatch);
        }
    }

    private void saveNodeBatch(List<KnowledgeNode> nodes) {
        int batchSize = 50;
        for (int i = 0; i < nodes.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, nodes.size());
            List<KnowledgeNode> batch = nodes.subList(i, endIndex);
            try {
                knowledgeNodeRepository.saveAll(batch);
            } catch (DataIntegrityViolationException e) {
                logger.error("Error saving batch of nodes: {}", e.getMessage());
                // Handle individual nodes in the batch
                for (KnowledgeNode node : batch) {
                    try {
                        knowledgeNodeRepository.save(node);
                    } catch (DataIntegrityViolationException ex) {
                        logger.error("Error saving individual node {}: {}", node.getName(), ex.getMessage());
                    }
                }
            }
        }
    }

    private KnowledgeNode determineParentCategory(String nodeName) {
        try {
            // If the topic itself is a known category, place it directly under Learning Plan
            if (KNOWN_CATEGORIES.stream().anyMatch(cat -> cat.equalsIgnoreCase(nodeName))) {
                return knowledgeNodeRepository.findByName("Learning Plan")
                    .orElseThrow(() -> new RuntimeException("Learning Plan root node not found"));
            }

            String prompt = String.format(
                "Analyze the topic '%s' and determine its most appropriate category path. " +
                "Consider these main categories:\n" +
                "1. Software Engineering (for programming, development, computer science)\n" +
                "2. Data Science (for statistics, machine learning, data analysis)\n" +
                "3. Business (for management, finance, entrepreneurship)\n" +
                "4. Psychology (for mental health, behavior, cognitive science)\n" +
                "5. Mathematics (for pure math, algebra, calculus)\n" +
                "6. Physics (for physical sciences, mechanics, quantum physics)\n" +
                "7. Biology (for life sciences, genetics, ecology)\n" +
                "Format response as JSON: {\"category\": \"main category\", \"subcategory\": \"specific area\"}\n" +
                "If the topic is itself a main category, return it as the category and leave subcategory blank.\n" +
                "Example: For 'TCP/IP' return {\"category\": \"Software Engineering\", \"subcategory\": \"Networking\"}. For 'Psychology' return {\"category\": \"Psychology\", \"subcategory\": \"\"}", 
                nodeName
            );

            Map<String, Object> request = new HashMap<>();
            request.put("model", "gpt-4");
            request.put("messages", List.of(
                Map.of("role", "system", "content", "You are a knowledgeable academic advisor."),
                Map.of("role", "user", "content", prompt)
            ));
            request.put("temperature", 0.3);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);
            
            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");
                    Map<String, String> categoryInfo = objectMapper.readValue(content, Map.class);
                    
                    // Get or create the main category
                    String mainCategory = categoryInfo.get("category");
                    String subcategory = categoryInfo.get("subcategory");
                    
                    KnowledgeNode learningPlan = knowledgeNodeRepository.findByName("Learning Plan")
                        .orElseThrow(() -> new RuntimeException("Learning Plan root node not found"));

                    // If the main category is not recognized or is the same as the topic, place under Learning Plan
                    if (mainCategory == null || !KNOWN_CATEGORIES.contains(mainCategory) || mainCategory.equalsIgnoreCase(nodeName)) {
                        return learningPlan;
                    }

                    KnowledgeNode mainCategoryNode = knowledgeNodeRepository.findByName(mainCategory)
                        .orElseGet(() -> {
                            KnowledgeNode newCategory = new KnowledgeNode();
                            newCategory.setName(mainCategory);
                            newCategory.setParent(learningPlan);
                            newCategory.setLevel(learningPlan.getLevel() + 1);
                            return knowledgeNodeRepository.save(newCategory);
                        });

                    // Get or create the subcategory if provided
                    if (subcategory != null && !subcategory.isEmpty() && !subcategory.equalsIgnoreCase(nodeName)) {
                        return knowledgeNodeRepository.findByNameAndParent(subcategory, mainCategoryNode)
                            .orElseGet(() -> {
                                KnowledgeNode newSubcategory = new KnowledgeNode();
                                newSubcategory.setName(subcategory);
                                newSubcategory.setParent(mainCategoryNode);
                                newSubcategory.setLevel(mainCategoryNode.getLevel() + 1);
                                return knowledgeNodeRepository.save(newSubcategory);
                            });
                    }
                    
                    return mainCategoryNode;
                }
            }
            
            throw new RuntimeException("Failed to determine category for: " + nodeName);
        } catch (Exception e) {
            logger.error("Error determining category for {}: {}", nodeName, e.getMessage());
            throw new RuntimeException("Failed to determine appropriate category: " + e.getMessage());
        }
    }
} 