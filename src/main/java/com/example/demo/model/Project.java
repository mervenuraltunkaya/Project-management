package com.example.demo.model;

import com.example.demo.enums.TaskPriority;
import com.example.demo.enums.SubTaskStatus;
import com.example.demo.enums.TeamRole;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description; 

    @Enumerated(EnumType.STRING)  
    @Column(nullable = false, length = 20)
    private SubTaskStatus status = SubTaskStatus.TODO;

    @Enumerated(EnumType.STRING)  
    @Column(nullable = false, length = 10)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(name = "start_date")
    private LocalDateTime startDate; 

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "actual_end_date")
    private LocalDateTime actualEndDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Employee createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_manager")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Employee assignedManager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY) 
    @JoinColumn(name = "team_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Team team;

    @Column(precision = 5, scale = 2)
    private BigDecimal progress;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    private void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        validateAssignment();
    }

    @PreUpdate
    private void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        validateAssignment();
    }

    public void validateAssignment() {
        if (employee != null && team != null) {
            throw new IllegalStateException("Bir proje hem employee hem team'e atanamaz!");
        }
        if (employee == null && team == null) {
            throw new IllegalStateException("Bir proje mutlaka employee veya team'e atanmalıdır!");
        }
    }

    // Task ilişkisini JSON serialization'dan hariç tutmak için JsonIgnore ekleyin
    @OneToMany(mappedBy = "project", cascade = {CascadeType.PERSIST, CascadeType.MERGE}, orphanRemoval = false)
@JsonIgnoreProperties("project")
private List<Task> tasks = new ArrayList<>();

    // Custom constructor
    public Project(String name,
                   String description,
                   SubTaskStatus status,
                   TaskPriority priority,
                   LocalDateTime startDate,
                   LocalDateTime endDate,
                   LocalDateTime actualEndDate,
                   Employee createdBy,
                   Employee assignedManager,
                   Employee employee,
                   Team team,
                   BigDecimal progress) {
        this.name = name;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.startDate = startDate;
        this.endDate = endDate;
        this.actualEndDate = actualEndDate;
        this.createdBy = createdBy;
        this.assignedManager = assignedManager;
        this.employee = employee;
        this.team = team;
        this.progress = progress;
    }
}