package com.example.demo.service;

import com.example.demo.model.TaskAttachment;
import com.example.demo.repository.TaskAttachmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@Service
public class TaskAttachmentService {
    
    @Autowired
    private TaskAttachmentRepository attachmentRepo;

    // Tüm ekleri getir
    public List<TaskAttachment> getAllAttachments() {
        return attachmentRepo.findAll();
    }

    // ID ile ek getir
    public Optional<TaskAttachment> getAttachment(Long id) {
        return attachmentRepo.findById(id);
    }

    // Yeni ek ekle
    public TaskAttachment addAttachment(TaskAttachment attachment) {
        return attachmentRepo.save(attachment);
    }

    // Ek güncelle
    public TaskAttachment updateAttachment(TaskAttachment attachment) {
        if (attachment.getId() != null && attachmentRepo.existsById(attachment.getId())) {
            return attachmentRepo.save(attachment);
        }
        throw new RuntimeException("Güncellenecek ek bulunamadı: " + attachment.getId());
    }

    // Ek sil
    public void deleteAttachment(Long id) {
        attachmentRepo.deleteById(id);
    }

    // Belirli bir göreve ait ekler
    public List<TaskAttachment> getAttachmentsByTask(Long taskId) {
        return attachmentRepo.findByTaskId(taskId);
    }

    // Belirli bir çalışan tarafından yüklenen ekler
    public List<TaskAttachment> getAttachmentsByUploader(Long employeeId) {
        return attachmentRepo.findByUploadedById(employeeId);
    }

    // Belirli görev ve revizyon numarası
    public Optional<TaskAttachment> getAttachmentByTaskAndRevision(Long taskId, Double revisionNumber) {
        return attachmentRepo.findFirstByTaskIdAndRevisionNumber(taskId, revisionNumber);
    }

    // Dosya adına göre ara
    public List<TaskAttachment> getAttachmentsByFileName(String fileName) {
        return attachmentRepo.findByFileName(fileName);
    }
}
