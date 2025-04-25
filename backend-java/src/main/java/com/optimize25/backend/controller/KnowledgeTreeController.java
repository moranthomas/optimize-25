package com.optimize25.backend.controller;

import com.optimize25.backend.model.KnowledgeNode;
import com.optimize25.backend.service.KnowledgeTreeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/knowledge")
@CrossOrigin(origins = "http://localhost:3000")
public class KnowledgeTreeController {
    @Autowired
    private KnowledgeTreeService service;

    @GetMapping("/root")
    public ResponseEntity<List<KnowledgeNode>> getRootNodes() {
        List<KnowledgeNode> nodes = service.getRootNodes();
        return ResponseEntity.ok(nodes);
    }

    @GetMapping("/children/{parentId}")
    public ResponseEntity<List<KnowledgeNode>> getChildren(@PathVariable Long parentId) {
        List<KnowledgeNode> children = service.getChildren(parentId);
        return ResponseEntity.ok(children);
    }

    @PostMapping
    public ResponseEntity<KnowledgeNode> createNode(@RequestBody KnowledgeNode node) {
        KnowledgeNode createdNode = service.createNode(node);
        return ResponseEntity.ok(createdNode);
    }

    @PutMapping("/{id}")
    public ResponseEntity<KnowledgeNode> updateNode(@PathVariable Long id, @RequestBody KnowledgeNode node) {
        KnowledgeNode updatedNode = service.updateNode(id, node);
        if (updatedNode != null) {
            return ResponseEntity.ok(updatedNode);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNode(@PathVariable Long id) {
        service.deleteNode(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<KnowledgeNode>> searchNodes(@RequestParam String query) {
        List<KnowledgeNode> nodes = service.searchNodes(query);
        return ResponseEntity.ok(nodes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<KnowledgeNode> getNode(@PathVariable Long id) {
        KnowledgeNode node = service.getNode(id);
        if (node != null) {
            return ResponseEntity.ok(node);
        }
        return ResponseEntity.notFound().build();
    }
} 