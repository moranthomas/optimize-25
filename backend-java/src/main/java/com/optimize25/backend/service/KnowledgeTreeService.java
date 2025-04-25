package com.optimize25.backend.service;

import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.repository.KnowledgeNodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class KnowledgeTreeService {

    private final KnowledgeNodeRepository repository;
    private static final Logger logger = LoggerFactory.getLogger(KnowledgeTreeService.class);

    @Autowired
    public KnowledgeTreeService(KnowledgeNodeRepository repository) {
        this.repository = repository;
    }

    public List<KnowledgeNode> getRootNodes() {
        return repository.findByParentIsNull();
    }

    public List<KnowledgeNode> getChildren(Long parentId) {
        return repository.findByParentId(parentId);
    }

    public List<KnowledgeNode> searchNodes(String query) {
        return repository.findByNameContainingIgnoreCase(query);
    }

    public Optional<KnowledgeNode> getNode(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public KnowledgeNode createNode(KnowledgeNode node) {
        if (node.getParent() != null) {
            // Set the level based on parent's level
            node.setLevel(node.getParent().getLevel() + 1);
            // Set the node order
            node.setNodeOrder((int) (repository.countByParent(node.getParent()) + 1));
            // Add the node to parent's children
            node.getParent().addChild(node);
        } else {
            // Root node
            node.setLevel(0);
            node.setNodeOrder((int) (repository.countByParent(null) + 1));
        }
        return repository.save(node);
    }

    @Transactional
    public KnowledgeNode updateNode(Long id, KnowledgeNode updatedNode) {
        return repository.findById(id)
            .map(existingNode -> {
                // Update basic properties
                existingNode.setName(updatedNode.getName());
                existingNode.setDescription(updatedNode.getDescription());
                existingNode.setContent(updatedNode.getContent());
                existingNode.setExamples(updatedNode.getExamples());
                existingNode.setReferences(updatedNode.getReferences());
                
                // Handle parent change and reordering
                if (updatedNode.getParent() != null) {
                    KnowledgeNode newParent = repository.findById(updatedNode.getParent().getId())
                        .orElseThrow(() -> new RuntimeException("Parent node not found"));
                    
                    // If parent has changed
                    if (existingNode.getParent() == null || 
                        !existingNode.getParent().getId().equals(newParent.getId())) {
                        // Remove from old parent if it exists
                        if (existingNode.getParent() != null) {
                            existingNode.getParent().getChildren().remove(existingNode);
                        }
                        // Set new parent
                        existingNode.setParent(newParent);
                        existingNode.setLevel(newParent.getLevel() + 1);
                    }
                } else if (updatedNode.getParent() == null && existingNode.getParent() != null) {
                    // Node is being moved to root level
                    existingNode.getParent().getChildren().remove(existingNode);
                    existingNode.setParent(null);
                    existingNode.setLevel(0);
                }

                // Update node order
                if (updatedNode.getNodeOrder() != null) {
                    existingNode.setNodeOrder(updatedNode.getNodeOrder());
                    // Reorder siblings
                    List<KnowledgeNode> siblings;
                    if (existingNode.getParent() != null) {
                        siblings = repository.findByParentId(existingNode.getParent().getId());
                    } else {
                        siblings = repository.findByParentIsNull();
                    }
                    
                    // Remove the current node from the list
                    siblings.remove(existingNode);
                    // Insert it at the new position
                    siblings.add(updatedNode.getNodeOrder(), existingNode);
                    // Update all sibling orders
                    for (int i = 0; i < siblings.size(); i++) {
                        siblings.get(i).setNodeOrder(i);
                    }
                    repository.saveAll(siblings);
                }

                return repository.save(existingNode);
            })
            .orElseThrow(() -> new RuntimeException("Node not found with id: " + id));
    }

    @Transactional
    public void deleteNode(Long id) {
        repository.findById(id).ifPresent(node -> {
            logger.info("Deleting node: {} (ID: {})", node.getName(), node.getId());
            
            // If this is a child node, remove it from parent's children
            if (node.getParent() != null) {
                logger.info("Removing node from parent's children list");
                node.getParent().getChildren().remove(node);
                
                // Reorder remaining siblings
                List<KnowledgeNode> siblings = repository.findByParentId(node.getParent().getId());
                siblings.remove(node);
                for (int i = 0; i < siblings.size(); i++) {
                    siblings.get(i).setNodeOrder(i);
                }
                repository.saveAll(siblings);
            }
            
            // Delete all children recursively
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                logger.info("Deleting {} child nodes", node.getChildren().size());
                deleteChildrenRecursively(node);
            }
            
            // Finally delete the node itself
            repository.delete(node);
            logger.info("Node deleted successfully");
        });
    }

    private void deleteChildrenRecursively(KnowledgeNode parent) {
        List<KnowledgeNode> children = new ArrayList<>(parent.getChildren());
        for (KnowledgeNode child : children) {
            if (child.getChildren() != null && !child.getChildren().isEmpty()) {
                deleteChildrenRecursively(child);
            }
            repository.delete(child);
            logger.info("Deleted child node: {} (ID: {})", child.getName(), child.getId());
        }
        parent.getChildren().clear();
    }
} 