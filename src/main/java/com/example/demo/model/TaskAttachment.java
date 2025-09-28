package com.example.demo.model;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "attachments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"task_id", "revision_number"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Dosya URL boş olamaz")
    @Size(max = 500)
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @NotBlank(message = "Dosya adı boş olamaz")
    @Size(max = 255)
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @NotBlank(message = "Revizyon numarası boş olamaz")
@Size(max = 50, message = "Revizyon numarası çok uzun")
@Column(name = "revision_number", nullable = false, length = 50)
private Double revisionNumber;


    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    // Task ilişkisi - hangi göreve ait
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    // Employee ilişkisi - kim yükledi
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private Employee uploadedBy;

    @PrePersist
    public void onUpload() {
        this.uploadedAt = LocalDateTime.now();
    }
}