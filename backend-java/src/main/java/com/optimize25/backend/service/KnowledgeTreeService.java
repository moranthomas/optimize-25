package com.optimize25.backend.service;

import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.repository.KnowledgeNodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class KnowledgeTreeService {

    private final KnowledgeNodeRepository repository;

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
                existingNode.setName(updatedNode.getName());
                existingNode.setDescription(updatedNode.getDescription());
                existingNode.setContent(updatedNode.getContent());
                existingNode.setExamples(updatedNode.getExamples());
                existingNode.setReferences(updatedNode.getReferences());
                return repository.save(existingNode);
            })
            .orElseThrow(() -> new RuntimeException("Node not found with id: " + id));
    }

    @Transactional
    public void deleteNode(Long id) {
        repository.findById(id).ifPresent(node -> {
            if (node.getParent() != null) {
                node.getParent().getChildren().remove(node);
            }
            repository.delete(node);
        });
    }
} 