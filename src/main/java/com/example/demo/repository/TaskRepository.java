package com.example.demo.repository;

import com.example.demo.model.Task;
import com.example.demo.enums.TaskPriority;
import com.example.demo.model.Employee;
import com.example.demo.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    // Belirli bir projeye ait tüm görevleri getir
    List<Task> findByProject(Project project);
    
    // Belirli bir çalışana atanmış görevleri getir (ÇOKLU ASSIGNMENT İÇİN)
    @Query("SELECT t FROM Task t JOIN t.assignedEmployees e WHERE e.id = :employeeId")
    List<Task> findByAssignedEmployee(@Param("employeeId") Long employeeId);
    
    // Önceliğe göre görevleri getir
    List<Task> findByPriority(TaskPriority priority);
    
    // Belirli bir çalışanın oluşturduğu görevleri getir
    List<Task> findByCreatedBy(Employee employee);
}