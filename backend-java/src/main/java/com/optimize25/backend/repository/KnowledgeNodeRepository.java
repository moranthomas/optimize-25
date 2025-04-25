package com.optimize25.backend.repository;

import com.optimize25.backend.model.KnowledgeNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface KnowledgeNodeRepository extends JpaRepository<KnowledgeNode, Long> {
    List<KnowledgeNode> findByParentId(Long parentId);
    List<KnowledgeNode> findByLevel(int level);
    
    @Query("SELECT n FROM KnowledgeNode n WHERE LOWER(n.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<KnowledgeNode> findByNameContainingIgnoreCase(@Param("query") String query);
} 