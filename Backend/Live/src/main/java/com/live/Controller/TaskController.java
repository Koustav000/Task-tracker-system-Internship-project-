package com.live.Controller;

import com.live.Model.Task;
import com.live.Repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin
public class TaskController {

    @Autowired
    private TaskRepository repo;

    // Create Task
    @PostMapping
    public Task createTask(@RequestBody Task task) {
        task.setCreatedAt(LocalDate.now());
        task.setUpdatedAt(LocalDate.now());
        return repo.save(task);
    }

    // Get All Tasks
    @GetMapping
    public List<Task> getAllTasks() {
        return repo.findAll();
    }

    // Get Tasks By User
    @GetMapping("/user/{username}")
    public List<Task> getTasksByUser(@PathVariable String username) {
        return repo.findByAssignedTo(username);
    }

    // Dashboard APIs

    @GetMapping("/count")
    public long totalTasks() {
        return repo.count();
    }

    @GetMapping("/completed")
    public long completedTasks() {
        return repo.countByStatus("COMPLETED");
    }

    @GetMapping("/pending")
    public long pendingTasks() {
        return repo.countByStatus("PENDING");
    }

    @GetMapping("/recent")
    public List<Task> recentTasks() {
        return repo.findTop5ByOrderByCreatedAtDesc();
    }
    @GetMapping("/dashboard/{username}")
    public Map<String, Object> getDashboard(@PathVariable String username) {

        List<Task> userTasks = repo.findByAssignedTo(username);

        long total = userTasks.size();
        long completed = userTasks.stream().filter(t -> t.getStatus().equals("COMPLETED")).count();
        long pending = userTasks.stream().filter(t -> t.getStatus().equals("PENDING")).count();

        List<Task> recent = userTasks.stream().limit(5).toList();

        Map<String, Object> data = new HashMap<>();
        data.put("totalTasks", total);
        data.put("completedTasks", completed);
        data.put("pendingTasks", pending);
        data.put("recentTasks", recent);

        return data;
    }
}