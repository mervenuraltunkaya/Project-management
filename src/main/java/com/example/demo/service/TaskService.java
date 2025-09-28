package com.example.demo.service;

import com.example.demo.model.Task;
import com.example.demo.model.Employee;
import com.example.demo.model.Project;
import com.example.demo.enums.TaskPriority;
import com.example.demo.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepo;

    // Tüm görevleri getir
    public List<Task> getAllTasks() {
        return taskRepo.findAll();
    }

    // ID ile görev getir
    public Optional<Task> getTask(Long id) {
        return taskRepo.findById(id);
    }

    // Yeni görev ekle
    public Task createTask(Task task) {
        return taskRepo.save(task);
    }

    // Görev güncelle
    public Task updateTask(Task task) {
        if (task.getId() != null && taskRepo.existsById(task.getId())) {
            return taskRepo.save(task);
        }
        throw new RuntimeException("Güncellenecek görev bulunamadı: " + task.getId());
    }

    // Görev sil
    @Transactional
    public void deleteTask(Long id) {
        if (taskRepo.existsById(id)) {
            taskRepo.deleteById(id);
        } else {
            throw new RuntimeException("Task bulunamadı: " + id);
        }
    }

    // Projeye göre görevler
    public List<Task> getTasksByProject(Project project) {
        return taskRepo.findByProject(project);
    }

    // Çalışana göre görevler (GÜNCELLENMIŞ)
    public List<Task> getTasksByAssigned(Long employeeId) {
        return taskRepo.findByAssignedEmployee(employeeId);
    }

    // Önceliğe göre görevler
    public List<Task> getTasksByPriority(TaskPriority priority) {
        return taskRepo.findByPriority(priority);
    }
}