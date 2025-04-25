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
import jakarta.persistence.EntityManager;

@Service
public class KnowledgeTreeService {

    private final KnowledgeNodeRepository repository;
    private static final Logger logger = LoggerFactory.getLogger(KnowledgeTreeService.class);

    @Autowired
    private EntityManager entityManager;

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
        logger.info("Starting update for node {} with new order {}", id, updatedNode.getNodeOrder());
        
        KnowledgeNode workingNode = entityManager.find(KnowledgeNode.class, id);
        if (workingNode == null) {
            logger.error("Initial node lookup failed - Node not found with id: {}", id);
            throw new RuntimeException("Node not found with id: " + id);
        }
        
        logger.info("Found node to update: {} (ID: {})", workingNode.getName(), workingNode.getId());

        // Store IDs for parent change handling
        final Long newParentId = updatedNode.getParent() != null ? updatedNode.getParent().getId() : null;
        final Long currentParentId = workingNode.getParent() != null ? workingNode.getParent().getId() : null;
        final Long nodeId = workingNode.getId();
        
        // Update basic properties if they are provided
        if (updatedNode.getName() != null) workingNode.setName(updatedNode.getName());
        if (updatedNode.getDescription() != null) workingNode.setDescription(updatedNode.getDescription());
        if (updatedNode.getContent() != null) workingNode.setContent(updatedNode.getContent());
        if (updatedNode.getExamples() != null) workingNode.setExamples(updatedNode.getExamples());
        if (updatedNode.getReferences() != null) workingNode.setReferences(updatedNode.getReferences());
        
        // Save basic property updates
        workingNode = entityManager.merge(workingNode);
        entityManager.flush();
        
        // Check if this is a parent change operation
        boolean isParentChange = updatedNode.getParent() != null && 
            ((newParentId == null && currentParentId != null) || 
             (newParentId != null && !newParentId.equals(currentParentId)));
        
        // Handle parent change if needed
        if (isParentChange) {
            logger.info("Parent is changing for node {} (Current: {}, New: {})", 
                nodeId, currentParentId, newParentId);

            // First, handle the old parent relationship
            if (currentParentId != null) {
                KnowledgeNode oldParent = entityManager.find(KnowledgeNode.class, currentParentId);
                if (oldParent != null) {
                    oldParent.getChildren().removeIf(child -> child.getId().equals(nodeId));
                    entityManager.merge(oldParent);
                    entityManager.flush();
                    
                    // Reorder siblings in old parent
                    reorderSiblings(currentParentId);
                }
            }

            // Then handle the new parent relationship
            if (newParentId != null) {
                KnowledgeNode newParent = entityManager.find(KnowledgeNode.class, newParentId);
                if (newParent == null) {
                    throw new RuntimeException("New parent node not found: " + newParentId);
                }
                workingNode.setParent(newParent);
                workingNode.setLevel(newParent.getLevel() + 1);
                
                // Add to new parent's children
                if (!newParent.getChildren().contains(workingNode)) {
                    newParent.addChild(workingNode);
                }
                entityManager.merge(newParent);
            } else {
                workingNode.setParent(null);
                workingNode.setLevel(0);
            }
            
            workingNode = entityManager.merge(workingNode);
            entityManager.flush();
        }

        // Handle reordering if needed
        if (updatedNode.getNodeOrder() != null) {
            logger.info("Reordering node {} to position {} within same parent", nodeId, updatedNode.getNodeOrder());
            
            List<KnowledgeNode> siblings;
            if (workingNode.getParent() != null) {
                siblings = repository.findByParentId(workingNode.getParent().getId());
            } else {
                siblings = repository.findByParentIsNull();
            }
            
            // Sort siblings by current order
            siblings.sort((a, b) -> {
                if (a.getNodeOrder() == null) return -1;
                if (b.getNodeOrder() == null) return 1;
                return a.getNodeOrder().compareTo(b.getNodeOrder());
            });
            
            // Remove the node from its current position
            siblings.removeIf(node -> node.getId().equals(nodeId));
            
            // Insert at the new position
            int targetPosition = Math.min(updatedNode.getNodeOrder(), siblings.size());
            siblings.add(targetPosition, workingNode);
            
            // Update all node orders sequentially
            for (int i = 0; i < siblings.size(); i++) {
                KnowledgeNode sibling = siblings.get(i);
                sibling.setNodeOrder(i);
                entityManager.merge(sibling);
            }
            
            entityManager.flush();
        }

        // Final verification and return
        entityManager.clear();
        KnowledgeNode result = entityManager.find(KnowledgeNode.class, nodeId);
        if (result == null) {
            throw new RuntimeException("Node not found after update: " + nodeId);
        }
        return result;
    }

    private void reorderSiblings(Long parentId) {
        List<KnowledgeNode> siblings;
        if (parentId != null) {
            siblings = repository.findByParentId(parentId);
        } else {
            siblings = repository.findByParentIsNull();
        }
        
        // Sort by current order
        siblings.sort((a, b) -> {
            if (a.getNodeOrder() == null) return -1;
            if (b.getNodeOrder() == null) return 1;
            return a.getNodeOrder().compareTo(b.getNodeOrder());
        });
        
        // Update orders sequentially
        for (int i = 0; i < siblings.size(); i++) {
            siblings.get(i).setNodeOrder(i);
        }
        repository.saveAll(siblings);
        entityManager.flush();
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