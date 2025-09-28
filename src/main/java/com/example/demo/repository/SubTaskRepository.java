package com.example.demo.repository;

import com.example.demo.model.SubTask;
import com.example.demo.enums.SubTaskStatus;
import com.example.demo.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubTaskRepository extends JpaRepository<SubTask, Long> {

    // Belirli bir Task’a ait tüm SubTask’lar
    List<SubTask> findByTaskId(Long taskId);

    // Task entity üzerinden alt görevler
    List<SubTask> findByTask(Task task);

    // Belirli bir durumdaki SubTask’lar (TODO, IN_PROGRESS, DONE)
    List<SubTask> findByStatus(SubTaskStatus status);

    // Belirli bir Task’a ait, belirli durumdaki SubTask’lar
    List<SubTask> findByTaskIdAndStatus(Long taskId, SubTaskStatus status);

    // Belirli bir kişiye atanmış alt görevler
    List<SubTask> findByAssignedToId(Long employeeId);

    // Belirli bir kişiye ait ve belirli durumdaki alt görevler
    List<SubTask> findByAssignedToIdAndStatus(Long employeeId, SubTaskStatus status);

    // Task bazlı sıralama
    List<SubTask> findByTaskIdOrderByStartDateAsc(Long taskId);
    List<SubTask> findByTaskIdOrderByEndDateDesc(Long taskId);

    // Üst raporlama için
    Long countByTaskId(Long taskId);
    Long countByTaskIdAndStatus(Long taskId, SubTaskStatus status);

    // Pageable destekli (çok veri varsa performans için)
    Page<SubTask> findByTaskId(Long taskId, Pageable pageable);
}
