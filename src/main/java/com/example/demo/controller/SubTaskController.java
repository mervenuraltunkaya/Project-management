package com.example.demo.controller;
import com.example.demo.model.SubTask;
import com.example.demo.model.Task;
import com.example.demo.enums.SubTaskStatus;
import com.example.demo.service.SubTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/subtasks")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class SubTaskController {
    @Autowired
    private SubTaskService subTaskService;

    // ==== GET ====
    // Tüm alt görevler
    @GetMapping
    public ResponseEntity<List<SubTask>> getAllSubTasks() {
        return ResponseEntity.ok(subTaskService.getAllSubTasks());
    }

    // ID ile alt görev
    @GetMapping("/{id}")
    public ResponseEntity<SubTask> getSubTaskById(@PathVariable Long id) {
        Optional<SubTask> subTask = subTaskService.getSubTask(id);
        return subTask.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==== POST ====
    // Yeni alt görev ekle
    @PostMapping
    public ResponseEntity<SubTask> createSubTask(@RequestBody SubTask subTask) {
        return ResponseEntity.ok(subTaskService.createSubTask(subTask));
    }

    // ==== PUT ====
    // Alt görev güncelle (tüm obje)
    @PutMapping("/{id}")
    public ResponseEntity<SubTask> updateSubTask(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        try {
            // Eğer sadece status güncelleniyorsa
            if (updates.containsKey("status") && updates.size() == 1) {
                String statusStr = (String) updates.get("status");
                SubTaskStatus status = SubTaskStatus.valueOf(statusStr);
                SubTask updated = subTaskService.updateSubTaskStatus(id, status);
                return ResponseEntity.ok(updated);
            }
            
            // Diğer durumlarda tüm objeyi güncelle
            Optional<SubTask> existingSubTask = subTaskService.getSubTask(id);
            if (existingSubTask.isPresent()) {
                SubTask subTask = existingSubTask.get();
                subTask.setId(id);
                
                // Güncellenen alanları set et
                if (updates.containsKey("name")) {
                    subTask.setName((String) updates.get("name"));
                }
                if (updates.containsKey("description")) {
                    subTask.setDescription((String) updates.get("description"));
                }
                if (updates.containsKey("status")) {
                    String statusStr = (String) updates.get("status");
                    subTask.setStatus(SubTaskStatus.valueOf(statusStr));
                }
                
                return ResponseEntity.ok(subTaskService.updateSubTask(subTask));
            }
            
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ==== DELETE ====
    // Alt görev sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubTask(@PathVariable Long id) {
        try {
            subTaskService.deleteSubTask(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ==== FİLTRELER ====
    // Göreve göre alt görevler
    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<SubTask>> getSubTasksByTask(@PathVariable Long taskId) {
        Task task = new Task();
        task.setId(taskId);
        return ResponseEntity.ok(subTaskService.getSubTasksByTask(task));
    }

    // Statüye göre alt görevler
    @GetMapping("/status/{status}")
    public ResponseEntity<List<SubTask>> getSubTasksByStatus(@PathVariable SubTaskStatus status) {
        return ResponseEntity.ok(subTaskService.getSubTasksByStatus(status));
    }
}
