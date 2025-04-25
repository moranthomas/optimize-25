package com.optimize25.backend.controller;

import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.service.KnowledgeTreeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/knowledge-tree")
@CrossOrigin(origins = "http://localhost:3000")
public class KnowledgeTreeController {

    private final KnowledgeTreeService knowledgeTreeService;

    @Autowired
    public KnowledgeTreeController(KnowledgeTreeService knowledgeTreeService) {
        this.knowledgeTreeService = knowledgeTreeService;
    }

    @GetMapping("/roots")
    public ResponseEntity<List<KnowledgeNode>> getRootNodes() {
        List<KnowledgeNode> nodes = knowledgeTreeService.getRootNodes();
        // Ensure children are loaded for root nodes
        nodes.forEach(node -> {
            if (node.getChildren() != null) {
                node.getChildren().size(); // Force lazy loading
            }
        });
        return ResponseEntity.ok(nodes);
    }

    @GetMapping("/children/{parentId}")
    public ResponseEntity<List<KnowledgeNode>> getChildren(@PathVariable Long parentId) {
        List<KnowledgeNode> children = knowledgeTreeService.getChildren(parentId);
        // Ensure children are loaded for each child node
        children.forEach(node -> {
            if (node.getChildren() != null) {
                node.getChildren().size(); // Force lazy loading
            }
        });
        return ResponseEntity.ok(children);
    }

    @GetMapping("/search")
    public ResponseEntity<List<KnowledgeNode>> searchNodes(@RequestParam String query) {
        List<KnowledgeNode> nodes = knowledgeTreeService.searchNodes(query);
        // Ensure children are loaded for search results
        nodes.forEach(node -> {
            if (node.getChildren() != null) {
                node.getChildren().size(); // Force lazy loading
            }
        });
        return ResponseEntity.ok(nodes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<KnowledgeNode> getNode(@PathVariable Long id) {
        return knowledgeTreeService.getNode(id)
            .map(node -> {
                // Ensure children are loaded for the node
                if (node.getChildren() != null) {
                    node.getChildren().size(); // Force lazy loading
                }
                return ResponseEntity.ok(node);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<KnowledgeNode> createNode(@RequestBody KnowledgeNode node) {
        KnowledgeNode createdNode = knowledgeTreeService.createNode(node);
        // Ensure children are loaded for the created node
        if (createdNode.getChildren() != null) {
            createdNode.getChildren().size(); // Force lazy loading
        }
        return ResponseEntity.ok(createdNode);
    }

    @PutMapping("/{id}")
    public ResponseEntity<KnowledgeNode> updateNode(@PathVariable Long id, @RequestBody KnowledgeNode node) {
        try {
            KnowledgeNode updatedNode = knowledgeTreeService.updateNode(id, node);
            // Ensure children are loaded for the updated node
            if (updatedNode.getChildren() != null) {
                updatedNode.getChildren().size(); // Force lazy loading
            }
            return ResponseEntity.ok(updatedNode);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable Long id) {
        knowledgeTreeService.deleteNode(id);
        return ResponseEntity.ok().build();
    }
} 