package com.example.demo.controller;

import com.example.demo.model.TaskAttachment;
import com.example.demo.service.TaskAttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true") 
@RequestMapping("/api/attachments")
public class TaskAttachmentController {

    @Autowired
    private TaskAttachmentService attachmentService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    // ==== FILE UPLOAD ENDPOINTS ====

    // Dosya yükleme endpoint'i
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("taskId") Long taskId,
            @RequestParam("revisionNumber") Double revisionNumber,
            @RequestParam("uploadedBy") Long uploadedBy) {
        
        try {
            // Upload klasörünü oluştur
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Dosya adını unique yap
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            
            // Dosyayı kaydet
            Files.copy(file.getInputStream(), filePath);
            
            // File URL oluştur
            String fileUrl = "http://localhost:8080/api/attachments/files/" + fileName;
            
            // Response hazırla
            Map<String, Object> response = new HashMap<>();
            response.put("fileUrl", fileUrl);
            response.put("fileName", file.getOriginalFilename());
            response.put("savedAs", fileName);
            response.put("size", file.getSize());
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Dosya yüklenemedi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    // Dosya görüntüleme/indirme endpoint'i
    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> viewFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Resource resource = new FileSystemResource(filePath);
            
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            // MIME type'ı belirle
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
                
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Attachment ID ile dosya indirme
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        try {
            Optional<TaskAttachment> attachmentOpt = attachmentService.getAttachment(id);
            if (attachmentOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            TaskAttachment attachment = attachmentOpt.get();
            
            // URL'den dosya adını çıkar
            String fileUrl = attachment.getFileUrl();
            String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Resource resource = new FileSystemResource(filePath);
            
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            // MIME type'ı belirle
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
                
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==== EXISTING CRUD ENDPOINTS ====

    // Tüm ekleri getir
    @GetMapping
    public ResponseEntity<List<TaskAttachment>> getAllAttachments() {
        return ResponseEntity.ok(attachmentService.getAllAttachments());
    }

    // ID ile ek getir
    @GetMapping("/{id}")
    public ResponseEntity<TaskAttachment> getAttachmentById(@PathVariable Long id) {
        Optional<TaskAttachment> attachment = attachmentService.getAttachment(id);
        return attachment.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }

    // Belirli bir göreve ait ekler
    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TaskAttachment>> getAttachmentsByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByTask(taskId));
    }

    // Belirli bir çalışanın yüklediği ekler
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TaskAttachment>> getAttachmentsByUploader(@PathVariable Long employeeId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByUploader(employeeId));
    }

    // Görev + revizyon numarasına göre tek ek
    @GetMapping("/task/{taskId}/revision/{revisionNumber}")
    public ResponseEntity<TaskAttachment> getAttachmentByTaskAndRevision(
            @PathVariable Long taskId,
            @PathVariable Double revisionNumber) {

        Optional<TaskAttachment> attachment =
                attachmentService.getAttachmentByTaskAndRevision(taskId, revisionNumber);

        return attachment.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }

    // Dosya adına göre ekleri getir
    @GetMapping("/filename/{fileName}")
    public ResponseEntity<List<TaskAttachment>> getAttachmentsByFileName(@PathVariable String fileName) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByFileName(fileName));
    }

    // Yeni ek yükle (JSON ile - eski method)
    @PostMapping
    public ResponseEntity<TaskAttachment> addAttachment(@RequestBody TaskAttachment attachment) {
        return ResponseEntity.ok(attachmentService.addAttachment(attachment));
    }

    // Ek güncelle
    @PutMapping("/{id}")
    public ResponseEntity<TaskAttachment> updateAttachment(@PathVariable Long id,
                                                           @RequestBody TaskAttachment attachment) {
        attachment.setId(id);
        return ResponseEntity.ok(attachmentService.updateAttachment(attachment));
    }

    // Ek sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
        try {
            // Önce dosyayı sil
            Optional<TaskAttachment> attachmentOpt = attachmentService.getAttachment(id);
            if (attachmentOpt.isPresent()) {
                TaskAttachment attachment = attachmentOpt.get();
                String fileUrl = attachment.getFileUrl();
                
                if (fileUrl != null && fileUrl.contains("/files/")) {
                    String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
                    Path filePath = Paths.get(uploadDir).resolve(fileName);
                    
                    try {
                        Files.deleteIfExists(filePath);
                    } catch (IOException e) {
                        // Dosya silinemese de DB kaydını sil
                        System.err.println("Dosya silinemedi: " + e.getMessage());
                    }
                }
            }
            
            // DB kaydını sil
            attachmentService.deleteAttachment(id);
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}