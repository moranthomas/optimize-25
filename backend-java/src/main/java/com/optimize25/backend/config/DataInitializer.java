package com.optimize25.backend.config;

import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.repository.KnowledgeNodeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Configuration
public class DataInitializer {
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initData(KnowledgeNodeRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                logger.info("Initializing knowledge tree data...");
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    Map<String, Object> data = mapper.readValue(
                        new ClassPathResource("knowledge-tree.json").getFile(),
                        Map.class
                    );

                    // Create and save root node first
                    KnowledgeNode root = new KnowledgeNode();
                    root.setName(data.get("topic").toString());
                    root.setDescription("Root node for the knowledge tree");
                    root.setLevel(0);
                    root.setNodeOrder(0);
                    root = repository.save(root); // Save root to get its ID
                    logger.info("Created root node with ID: " + root.getId());

                    // Process branches
                    List<Map<String, Object>> branches = (List<Map<String, Object>>) data.get("branches");
                    int nodeOrder = 1;
                    
                    for (Map<String, Object> branch : branches) {
                        KnowledgeNode branchNode = new KnowledgeNode();
                        branchNode.setName(branch.get("name").toString());
                        branchNode.setDescription("Main branch: " + branch.get("name").toString());
                        branchNode.setParentId(root.getId());
                        branchNode.setLevel(1);
                        branchNode.setNodeOrder(nodeOrder++);
                        branchNode = repository.save(branchNode); // Save branch to get its ID
                        logger.info("Created branch node: " + branchNode.getName() + " with ID: " + branchNode.getId());

                        // Process subtopics
                        List<String> subtopics = (List<String>) branch.get("subtopics");
                        for (String subtopic : subtopics) {
                            KnowledgeNode subtopicNode = new KnowledgeNode();
                            subtopicNode.setName(subtopic);
                            subtopicNode.setDescription("Topic: " + subtopic);
                            subtopicNode.setParentId(branchNode.getId());
                            subtopicNode.setLevel(2);
                            subtopicNode.setNodeOrder(nodeOrder++);
                            subtopicNode = repository.save(subtopicNode);
                            logger.info("Created subtopic node: " + subtopicNode.getName() + " with ID: " + subtopicNode.getId());
                        }
                    }

                    logger.info("Knowledge tree data initialized successfully");
                } catch (IOException e) {
                    logger.error("Failed to initialize knowledge tree data", e);
                    throw e; // Rethrow to ensure Spring knows initialization failed
                }
            } else {
                logger.info("Knowledge tree data already exists, skipping initialization");
            }
        };
    }
} 