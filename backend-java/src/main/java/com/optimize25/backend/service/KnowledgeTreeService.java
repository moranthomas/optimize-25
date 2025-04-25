package com.optimize25.backend.service;

import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.repository.KnowledgeNodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class KnowledgeTreeService {
    @Autowired
    private KnowledgeNodeRepository repository;

    public List<KnowledgeNode> getRootNodes() {
        List<KnowledgeNode> roots = repository.findByLevel(0);
        roots.forEach(this::populateChildIds);
        return roots;
    }

    public List<KnowledgeNode> getChildren(Long parentId) {
        List<KnowledgeNode> children = repository.findByParentId(parentId);
        children.forEach(this::populateChildIds);
        return children;
    }

    private void populateChildIds(KnowledgeNode node) {
        List<Long> childIds = repository.findByParentId(node.getId())
            .stream()
            .map(KnowledgeNode::getId)
            .collect(Collectors.toList());
        node.setChildIds(childIds);
    }

    public KnowledgeNode createNode(KnowledgeNode node) {
        KnowledgeNode savedNode = repository.save(node);
        populateChildIds(savedNode);
        return savedNode;
    }

    public KnowledgeNode updateNode(Long id, KnowledgeNode node) {
        Optional<KnowledgeNode> existingNode = repository.findById(id);
        if (existingNode.isPresent()) {
            node.setId(id);
            KnowledgeNode savedNode = repository.save(node);
            populateChildIds(savedNode);
            return savedNode;
        }
        return null;
    }

    public void deleteNode(Long id) {
        repository.deleteById(id);
    }

    public List<KnowledgeNode> searchNodes(String query) {
        List<KnowledgeNode> nodes = repository.findByNameContainingIgnoreCase(query);
        nodes.forEach(this::populateChildIds);
        return nodes;
    }

    public KnowledgeNode getNode(Long id) {
        Optional<KnowledgeNode> node = repository.findById(id);
        if (node.isPresent()) {
            KnowledgeNode foundNode = node.get();
            populateChildIds(foundNode);
            return foundNode;
        }
        return null;
    }
} 