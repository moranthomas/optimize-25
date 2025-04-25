package com.optimize25.backend.config;

import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.repository.KnowledgeNodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private KnowledgeNodeRepository knowledgeNodeRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (knowledgeNodeRepository.count() == 0) {
            logger.info("Initializing database with sample data...");
            
            // Create root nodes
            List<String> rootNodeNames = Arrays.asList(
                "Core Learning Modules",
                "Optimize Physical",
                "Optimize Mental",
                "Optimize Emotional",
                "Optimize Productivity",
                "Career",
                "School"
            );

            for (int i = 0; i < rootNodeNames.size(); i++) {
                KnowledgeNode rootNode = new KnowledgeNode();
                rootNode.setName(rootNodeNames.get(i));
                rootNode.setDescription("Root node for " + rootNodeNames.get(i));
                rootNode.setLevel(0);
                rootNode.setNodeOrder(i + 1);
                knowledgeNodeRepository.save(rootNode);
                logger.info("Created root node: {}", rootNode.getName());
            }

            // Get the School node
            KnowledgeNode schoolNode = knowledgeNodeRepository.findByName("School")
                .orElseThrow(() -> new RuntimeException("School node not found"));

            // Create Software Engineering under School
            KnowledgeNode softwareEngineering = new KnowledgeNode();
            softwareEngineering.setName("Software Engineering");
            softwareEngineering.setDescription("Software development and engineering principles");
            softwareEngineering.setLevel(1);
            softwareEngineering.setNodeOrder(1);
            softwareEngineering.setParent(schoolNode);
            schoolNode.addChild(softwareEngineering);
            knowledgeNodeRepository.save(softwareEngineering);
            logger.info("Created Software Engineering node under School");

            // Create main branches under Software Engineering
            List<String> branchNames = Arrays.asList(
                "Networking",
                "Security",
                "Algorithms",
                "Software Architecture"
            );

            for (int i = 0; i < branchNames.size(); i++) {
                KnowledgeNode branchNode = new KnowledgeNode();
                branchNode.setName(branchNames.get(i));
                branchNode.setDescription("Main branch: " + branchNames.get(i));
                branchNode.setLevel(2);
                branchNode.setNodeOrder(i + 1);
                branchNode.setParent(softwareEngineering);
                softwareEngineering.addChild(branchNode);
                knowledgeNodeRepository.save(branchNode);
                logger.info("Created branch node: {} under Software Engineering", branchNode.getName());
            }

            // Get the Networking branch
            KnowledgeNode networkingNode = knowledgeNodeRepository.findByName("Networking")
                .orElseThrow(() -> new RuntimeException("Networking node not found"));

            // Create subtopics under Networking
            List<String> networkingSubtopics = Arrays.asList(
                "Network Protocols (TCP/IP, HTTP, WebSocket)",
                "Network Security (SSL/TLS, Firewalls)"
            );

            for (int i = 0; i < networkingSubtopics.size(); i++) {
                KnowledgeNode subtopicNode = new KnowledgeNode();
                subtopicNode.setName(networkingSubtopics.get(i));
                subtopicNode.setDescription("Understanding " + networkingSubtopics.get(i));
                subtopicNode.setLevel(3);
                subtopicNode.setNodeOrder(i + 1);
                subtopicNode.setParent(networkingNode);
                networkingNode.addChild(subtopicNode);
                knowledgeNodeRepository.save(subtopicNode);
                logger.info("Created subtopic: {} under Networking", subtopicNode.getName());
            }

            logger.info("Database initialization completed successfully");
        } else {
            logger.info("Database already contains data, skipping initialization");
        }
    }
} 