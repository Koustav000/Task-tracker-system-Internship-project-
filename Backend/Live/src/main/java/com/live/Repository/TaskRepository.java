package com.live.Repository;

import com.live.Model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    long countByStatus(String status);

    List<Task> findTop5ByOrderByCreatedAtDesc();

    List<Task> findByAssignedTo(String assignedTo);
}