package com.optimize25.backend.repository;

import com.optimize25.backend.model.KnowledgeNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface KnowledgeNodeRepository extends JpaRepository<KnowledgeNode, Long> {
    Optional<KnowledgeNode> findByName(String name);
    
    List<KnowledgeNode> findByParentId(Long parentId);
    
    @Query("SELECT COUNT(k) FROM KnowledgeNode k WHERE k.parent = ?1")
    long countByParent(KnowledgeNode parent);
    
    List<KnowledgeNode> findByParentIsNull();
    
    List<KnowledgeNode> findByLevel(int level);
    
    @Query("SELECT n FROM KnowledgeNode n WHERE LOWER(n.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<KnowledgeNode> findByNameContainingIgnoreCase(@Param("query") String query);
} 