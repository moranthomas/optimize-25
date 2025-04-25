package com.optimize25.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.repository.KnowledgeNodeRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.env.Environment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ChatGPTService {

    private static final Logger logger = LoggerFactory.getLogger(ChatGPTService.class);
    private final String apiKey;
    private final String apiUrl = "https://api.openai.com/v1/chat/completions";
    private final RestTemplate restTemplate;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final ObjectMapper objectMapper;

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
    public void populateOptimizePhysical() {
        logger.info("Starting to populate Optimize Physical content");
        
        // Get the Optimize Physical root node
        KnowledgeNode optimizePhysical = knowledgeNodeRepository.findByName("Optimize Physical")
            .orElseThrow(() -> new RuntimeException("Optimize Physical node not found"));
        logger.info("Found Optimize Physical node with ID: {}", optimizePhysical.getId());

        // Prepare the prompt for ChatGPT
        String prompt = "Create a comprehensive knowledge tree for physical health and fitness optimization. " +
            "Include main categories and subtopics. " +
            "For each topic, provide a name, description, and detailed content. " +
            "Format the response as a JSON array of objects with the following structure: " +
            "[{name: string, description: string, content: string, children: [...]}]";
        logger.info("Prepared prompt for ChatGPT");

        // Call ChatGPT API
        Map<String, Object> request = new HashMap<>();
        request.put("model", "gpt-4");
        request.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        request.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
        
        try {
            logger.info("Sending request to ChatGPT API");
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);
            logger.info("Received response from ChatGPT API");
            
            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    if (firstChoice.containsKey("message")) {
                        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                        String content = (String) message.get("content");
                        logger.info("Extracted content from ChatGPT response");
                        
                        // Parse the response and create nodes
                        createNodesFromResponse(content, optimizePhysical);
                        logger.info("Successfully created nodes from ChatGPT response");
                    } else {
                        logger.error("No message in ChatGPT response");
                        throw new RuntimeException("No message in ChatGPT response");
                    }
                } else {
                    logger.error("No choices in ChatGPT response");
                    throw new RuntimeException("No choices in ChatGPT response");
                }
            } else {
                logger.error("Invalid response format from ChatGPT");
                throw new RuntimeException("Invalid response format from ChatGPT");
            }
        } catch (Exception e) {
            logger.error("Failed to populate Optimize Physical content", e);
            throw new RuntimeException("Failed to populate Optimize Physical content: " + e.getMessage());
        }
    }

    private void createNodesFromResponse(String content, KnowledgeNode parent) {
        try {
            logger.info("Parsing ChatGPT response content");
            Object parsed = objectMapper.readValue(content, Object.class);
            List<Map<String, Object>> nodes;
            
            if (parsed instanceof List) {
                // If the response is an array
                nodes = (List<Map<String, Object>>) parsed;
            } else if (parsed instanceof Map) {
                // If the response is a single object
                nodes = new ArrayList<>();
                nodes.add((Map<String, Object>) parsed);
            } else {
                throw new RuntimeException("Unexpected response format: " + parsed.getClass().getSimpleName());
            }
            
            logger.info("Successfully parsed {} nodes from response", nodes.size());
            
            for (Map<String, Object> nodeData : nodes) {
                KnowledgeNode node = new KnowledgeNode();
                String name = (String) nodeData.get("name");
                String description = (String) nodeData.get("description");
                String nodeContent = (String) nodeData.get("content");
                
                logger.info("Creating node - Name: {}, Description: {}, Content length: {}", 
                    name, description, nodeContent != null ? nodeContent.length() : 0);
                
                node.setName(name);
                node.setDescription(description);
                node.setContent(nodeContent);
                node.setParent(parent);
                node.setLevel(parent.getLevel() + 1);
                node.setNodeOrder((int) (knowledgeNodeRepository.countByParent(parent) + 1));
                
                KnowledgeNode savedNode = knowledgeNodeRepository.save(node);
                logger.info("Saved node with ID: {}, Parent ID: {}, Level: {}", 
                    savedNode.getId(), 
                    parent != null ? parent.getId() : "null", 
                    savedNode.getLevel());
                
                // Recursively create child nodes
                if (nodeData.containsKey("children")) {
                    List<Map<String, Object>> children = (List<Map<String, Object>>) nodeData.get("children");
                    logger.info("Processing {} children for node: {}", children.size(), name);
                    for (Map<String, Object> childData : children) {
                        createNodesFromResponse(objectMapper.writeValueAsString(childData), savedNode);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to parse ChatGPT response", e);
            throw new RuntimeException("Failed to parse ChatGPT response: " + e.getMessage());
        }
    }

    @Transactional
    public void populateNode(String nodeName) {
        logger.info("Starting to populate node: {}", nodeName);
        
        // Get the node by name
        KnowledgeNode node = knowledgeNodeRepository.findByName(nodeName)
            .orElseThrow(() -> new RuntimeException("Node not found: " + nodeName));
        logger.info("Found node with ID: {}", node.getId());

        // Prepare the prompt for ChatGPT
        String prompt = String.format(
            "Create a list of subtopics and content for %s. " +
            "Do not include %s itself in the response, only its children. " +
            "For each subtopic, provide a name, description, and detailed content. " +
            "Format the response as a JSON array of objects with the following structure: " +
            "[{name: string, description: string, content: string, children: [...]}]. " +
            "Each subtopic should be unique and focused on a specific aspect of %s.",
            nodeName, nodeName, nodeName
        );
        logger.info("Prepared prompt for ChatGPT");

        // Call ChatGPT API
        Map<String, Object> request = new HashMap<>();
        request.put("model", "gpt-4");
        request.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        request.put("temperature", 0.7);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
        
        try {
            logger.info("Sending request to ChatGPT API");
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);
            logger.info("Received response from ChatGPT API");
            
            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> firstChoice = choices.get(0);
                    if (firstChoice.containsKey("message")) {
                        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
                        String content = (String) message.get("content");
                        logger.info("Extracted content from ChatGPT response");
                        
                        // Parse the response and create nodes
                        createNodesFromResponse(content, node);
                        logger.info("Successfully created nodes from ChatGPT response");
                    } else {
                        logger.error("No message in ChatGPT response");
                        throw new RuntimeException("No message in ChatGPT response");
                    }
                } else {
                    logger.error("No choices in ChatGPT response");
                    throw new RuntimeException("No choices in ChatGPT response");
                }
            } else {
                logger.error("Invalid response format from ChatGPT");
                throw new RuntimeException("Invalid response format from ChatGPT");
            }
        } catch (Exception e) {
            logger.error("Failed to populate node: " + nodeName, e);
            throw new RuntimeException("Failed to populate node: " + nodeName + ": " + e.getMessage());
        }
    }
} 