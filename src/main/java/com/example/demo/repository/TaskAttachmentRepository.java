package com.example.demo.repository;

import com.example.demo.model.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Long> {

    // Belirli bir göreve ait tüm ekleri getir
    List<TaskAttachment> findByTaskId(Long taskId);

    // Belirli bir çalışan tarafından yüklenen ekleri getir
    List<TaskAttachment> findByUploadedById(Long employeeId);

    // Belirli bir görev ve revizyon numarasına göre ek(ler)
    List<TaskAttachment> findByTaskIdAndRevisionNumber(Long taskId, Double revisionNumber);

    // Eğer unique constraint varsa Optional daha uygun
    Optional<TaskAttachment> findFirstByTaskIdAndRevisionNumber(Long taskId, Double revisionNumber);

    // Dosya adına göre ara (tam eşleşme)
    List<TaskAttachment> findByFileName(String fileName);

    // Dosya adında geçen kelimeye göre (case-insensitive)
    List<TaskAttachment> findByFileNameContainingIgnoreCase(String fileName);

    // Belirli görevin eklerini tarihe göre sıralı getir
    List<TaskAttachment> findByTaskIdOrderByUploadedAtDesc(Long taskId);

    // Belirli göreve ait toplam ek sayısı
    Long countByTaskId(Long taskId);
}
