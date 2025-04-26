package com.optimize25.backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "knowledge_nodes", schema = "public")
public class KnowledgeNode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonBackReference
    private KnowledgeNode parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<KnowledgeNode> children = new ArrayList<>();
    
    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String examples;

    @Column(name = "reference_links", columnDefinition = "TEXT")
    private String references;
    
    @Column(nullable = false)
    private Integer level;
    
    @Column(name = "node_order")
    private Integer nodeOrder;

    @Transient
    private List<Long> childIds;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public KnowledgeNode getParent() {
        return parent;
    }

    public void setParent(KnowledgeNode parent) {
        this.parent = parent;
        if (parent != null && !parent.getChildren().contains(this)) {
            parent.getChildren().add(this);
        }
    }

    public List<KnowledgeNode> getChildren() {
        return children;
    }

    public void setChildren(List<KnowledgeNode> children) {
        this.children = children;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getExamples() {
        return examples;
    }

    public void setExamples(String examples) {
        this.examples = examples;
    }

    public String getReferences() {
        return references;
    }

    public void setReferences(String references) {
        this.references = references;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public Integer getNodeOrder() {
        return nodeOrder;
    }

    public void setNodeOrder(Integer nodeOrder) {
        this.nodeOrder = nodeOrder;
    }

    public List<Long> getChildIds() {
        if (childIds == null) {
            childIds = children.stream()
                .map(KnowledgeNode::getId)
                .collect(Collectors.toList());
        }
        return childIds;
    }

    public void setChildIds(List<Long> childIds) {
        this.childIds = childIds;
    }

    // Helper method to manage bidirectional relationship
    public void addChild(KnowledgeNode child) {
        children.add(child);
        child.setParent(this);
    }
} 