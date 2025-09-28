package com.example.demo.service;
import com.example.demo.model.SubTask;
import com.example.demo.model.Task;
import com.example.demo.enums.SubTaskStatus;
import com.example.demo.repository.SubTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SubTaskService {
    @Autowired
    private SubTaskRepository subTaskRepo;

    // Tüm alt görevler
    public List<SubTask> getAllSubTasks() {
        return subTaskRepo.findAll();
    }

    // ID ile alt görev
    public Optional<SubTask> getSubTask(Long id) {
        return subTaskRepo.findById(id);
    }

    // Yeni alt görev ekle
    public SubTask createSubTask(SubTask subTask) {
        subTask.setStartDate(LocalDateTime.now());
        return subTaskRepo.save(subTask);
    }

    // Alt görev güncelle (tüm obje)
    public SubTask updateSubTask(SubTask subTask) {
        subTask.setUpdatedAt(LocalDateTime.now());
        return subTaskRepo.save(subTask);
    }

    // Sadece status güncelle (YENİ METHOD)
    public SubTask updateSubTaskStatus(Long id, SubTaskStatus status) {
        Optional<SubTask> optionalSubTask = subTaskRepo.findById(id);
        if (optionalSubTask.isPresent()) {
            SubTask subTask = optionalSubTask.get();
            subTask.setStatus(status);
            subTask.setUpdatedAt(LocalDateTime.now());
            
            // Eğer DONE yapılıyorsa endDate set et
            if (status == SubTaskStatus.DONE) {
                subTask.setEndDate(LocalDateTime.now());
            }
            
            return subTaskRepo.save(subTask);
        }
        throw new RuntimeException("SubTask bulunamadı: " + id);
    }

    // Alt görev sil
    public void deleteSubTask(Long id) {
        subTaskRepo.deleteById(id);
    }

    // Belirli bir göreve ait alt görevler
    public List<SubTask> getSubTasksByTask(Task task) {
        return subTaskRepo.findByTask(task);
    }

    // Statüsüne göre alt görevler
    public List<SubTask> getSubTasksByStatus(SubTaskStatus status) {
        return subTaskRepo.findByStatus(status);
    }
}