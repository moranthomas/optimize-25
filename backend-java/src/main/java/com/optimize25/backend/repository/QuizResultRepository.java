package com.optimize25.backend.repository;

import com.optimize25.backend.model.QuizResult;
import com.optimize25.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findByTopicOrderByCreatedAtDesc(String topic);
    List<QuizResult> findAllByOrderByCreatedAtDesc();
    List<QuizResult> findByUserOrderByCreatedAtDesc(User user);
    List<QuizResult> findByUserAndTopicOrderByCreatedAtDesc(User user, String topic);
} 