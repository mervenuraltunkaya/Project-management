package com.example.demo.controller;

import com.example.demo.model.Project;
import com.example.demo.model.Employee;
import com.example.demo.model.Team;
import com.example.demo.enums.SubTaskStatus;
import com.example.demo.enums.TaskPriority;
import com.example.demo.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.HashMap; // sadece gerekiyorsa
import java.util.ArrayList; // sadece gerekiyorsa
import java.util.Map;
import java.math.BigDecimal;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true") 
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    // Tüm projeler
    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    // ID ile proje
    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        Optional<Project> project = projectService.getProject(id);
        return project.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    // Yeni proje oluştur
   @PostMapping
public ResponseEntity<Project> createProject(@RequestBody Project project) {
    try {
        System.out.println("Gelen project data: " + project.toString());
        System.out.println("Employee ID: " + (project.getEmployee() != null ? project.getEmployee().getId() : "null"));
        System.out.println("Team ID: " + (project.getTeam() != null ? project.getTeam().getId() : "null"));
        
        Project savedProject = projectService.createProject(project);
        return ResponseEntity.ok(savedProject);
    } catch (Exception e) {
        System.err.println("Proje kaydetme hatası: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
    }
}

    // Proje güncelle
    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project project) {
        project.setId(id);
        return ResponseEntity.ok(projectService.updateProject(project));
    }

    // Proje sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // Statüye göre projeler
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Project>> getProjectsByStatus(@PathVariable SubTaskStatus status) {
        return ResponseEntity.ok(projectService.getProjectsByStatus(status));
    }

    // Önceliğe göre projeler
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<Project>> getProjectsByPriority(@PathVariable TaskPriority priority) {
        return ResponseEntity.ok(projectService.getProjectsByPriority(priority));
    }

    // Çalışana göre projeler
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Project>> getProjectsByEmployee(@PathVariable Long employeeId) {
        Employee employee = new Employee();
        employee.setId(employeeId);
        return ResponseEntity.ok(projectService.getProjectsByEmployee(employee));
    }

    // Takıma göre projeler
    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<Project>> getProjectsByTeam(@PathVariable Long teamId) {
        Team team = new Team();
        team.setId(teamId);
        return ResponseEntity.ok(projectService.getProjectsByTeam(team));
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<Project> updateProgress(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            // ProjectService'teki getProject metodunu kullan
            Optional<Project> projectOpt = projectService.getProject(id);
            if (!projectOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Project project = projectOpt.get();

            Number progressNum = (Number) request.get("progress");
            project.setProgress(BigDecimal.valueOf(progressNum.intValue()));

            // ProjectService'teki updateProject metodunu kullan
            Project updated = projectService.updateProject(project);

            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}")
public ResponseEntity<Project> patchProject(@PathVariable Long id, @RequestBody Project projectUpdates) {
    try {
        System.out.println("PATCH request for project ID: " + id);
        System.out.println("Updates: " + projectUpdates.toString());
        
        Optional<Project> existingProjectOpt = projectService.getProject(id);
        if (!existingProjectOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Project existingProject = existingProjectOpt.get();
        
        // Sadece gönderilen alanları güncelle
        if (projectUpdates.getName() != null) {
            existingProject.setName(projectUpdates.getName());
        }
        if (projectUpdates.getDescription() != null) {
            existingProject.setDescription(projectUpdates.getDescription());
        }
        if (projectUpdates.getStatus() != null) {
            existingProject.setStatus(projectUpdates.getStatus());
        }
        if (projectUpdates.getPriority() != null) {
            existingProject.setPriority(projectUpdates.getPriority());
        }
        if (projectUpdates.getStartDate() != null) {
            existingProject.setStartDate(projectUpdates.getStartDate());
        }
        if (projectUpdates.getEndDate() != null) {
            existingProject.setEndDate(projectUpdates.getEndDate());
        }
        
        // Employee/Team güncellemeleri
        if (projectUpdates.getEmployee() != null) {
            existingProject.setEmployee(projectUpdates.getEmployee());
            existingProject.setTeam(null); // Team'i temizle
        }
        if (projectUpdates.getTeam() != null) {
            existingProject.setTeam(projectUpdates.getTeam());
            existingProject.setEmployee(null); // Employee'yi temizle
        }
        
        // Tasks'ları korumak için hiçbir şey yapmıyoruz - mevcut tasks korunur
        
        Project updatedProject = projectService.updateProject(existingProject);
        return ResponseEntity.ok(updatedProject);
        
    } catch (Exception e) {
        System.err.println("Proje güncelleme hatası: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
    }
}
}