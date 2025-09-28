package com.example.demo.service;

import com.example.demo.model.Project;
import com.example.demo.model.Employee;
import com.example.demo.model.Team;
import com.example.demo.enums.SubTaskStatus;
import com.example.demo.enums.TaskPriority;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.TeamRepository;
import com.example.demo.model.Task;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepo;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private TeamRepository teamRepo;

    // Tüm projeler - ilişkiler önceden yükleniyor
    @Transactional(readOnly = true)
    public List<Project> getAllProjects() {
        List<Project> projects = projectRepo.findAll();
        projects.forEach(project -> {
            if (project.getEmployee() != null) {
                project.getEmployee().getFirstName();
            }
            if (project.getTeam() != null) {
                project.getTeam().getName();
            }
            if (project.getAssignedManager() != null) {
                project.getAssignedManager().getFirstName();
            }
            if (project.getCreatedBy() != null) {
                project.getCreatedBy().getFirstName();
            }
        });
        return projects;
    }

    // ID ile proje - ilişkiler yükleniyor
    @Transactional(readOnly = true)
    public Optional<Project> getProject(Long id) {
        Optional<Project> projectOpt = projectRepo.findById(id);
        if (projectOpt.isPresent()) {
            Project project = projectOpt.get();
            if (project.getEmployee() != null) {
                project.getEmployee().getFirstName();
            }
            if (project.getTeam() != null) {
                project.getTeam().getName();
            }
            if (project.getAssignedManager() != null) {
                project.getAssignedManager().getFirstName();
            }
            if (project.getCreatedBy() != null) {
                project.getCreatedBy().getFirstName();
            }
        }
        return projectOpt;
    }

    // Yeni proje ekle
    @Transactional
    public Project createProject(Project project) {
        try {
            // CreatedBy employee set et
            if (project.getCreatedBy() != null && project.getCreatedBy().getId() != null) {
                Employee createdBy = employeeRepo.findById(project.getCreatedBy().getId())
                        .orElseThrow(() -> new RuntimeException("Proje oluşturan kullanıcı bulunamadı"));
                project.setCreatedBy(createdBy);
            }

            // Assigned Manager set et
            if (project.getAssignedManager() != null && project.getAssignedManager().getId() != null) {
                Employee assignedManager = employeeRepo.findById(project.getAssignedManager().getId())
                        .orElseThrow(() -> new RuntimeException("Atanan yönetici bulunamadı"));
                project.setAssignedManager(assignedManager);
            }

            // Employee assignment
            if (project.getEmployee() != null && project.getEmployee().getId() != null) {
                Employee employee = employeeRepo.findById(project.getEmployee().getId())
                        .orElseThrow(() -> new RuntimeException("Atanan çalışan bulunamadı"));
                project.setEmployee(employee);
                project.setTeam(null); // Team'i null yap
            }

            // Team assignment
            if (project.getTeam() != null && project.getTeam().getId() != null) {
                Team team = teamRepo.findById(project.getTeam().getId())
                        .orElseThrow(() -> new RuntimeException("Atanan takım bulunamadı"));

                // Team’i managed state’e al
                team = teamRepo.save(team);

                project.setTeam(team);
                project.setEmployee(null); // Employee'yi null yap

                System.out.println("Team assigned: " + team.getName() + " (ID: " + team.getId() + ")");
            }

            // Tarihler
            if (project.getCreatedAt() == null) {
                project.setCreatedAt(LocalDateTime.now());
            }
            project.setUpdatedAt(LocalDateTime.now());

            // Validasyon
            project.validateAssignment();

            Project savedProject = projectRepo.save(project);

            // Fresh fetch
            return projectRepo.findById(savedProject.getId())
                    .orElse(savedProject);

        } catch (Exception e) {
            System.err.println("Proje kaydedilirken hata: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Proje kaydedilemedi: " + e.getMessage(), e);
        }
    }

    // Proje güncelle
    @Transactional
    public Project updateProject(Project project) {
        if (project.getId() == null) {
            throw new RuntimeException("Güncellenecek projenin ID'si boş olamaz");
        }

        Optional<Project> existingProjectOpt = projectRepo.findById(project.getId());
        if (!existingProjectOpt.isPresent()) {
            throw new RuntimeException("Güncellenecek proje bulunamadı: " + project.getId());
        }

        Project existingProject = existingProjectOpt.get();

        // Mevcut tasks’ları koru
        List<Task> existingTasks = existingProject.getTasks();

        // Assigned Manager güncelle
        if (project.getAssignedManager() != null && project.getAssignedManager().getId() != null) {
            Employee assignedManager = employeeRepo.findById(project.getAssignedManager().getId())
                    .orElseThrow(() -> new RuntimeException("Atanan yönetici bulunamadı"));
            existingProject.setAssignedManager(assignedManager);
        }

        // Employee/Team kontrol
        if (project.getEmployee() != null && project.getEmployee().getId() != null) {
            Employee employee = employeeRepo.findById(project.getEmployee().getId())
                    .orElseThrow(() -> new RuntimeException("Atanan çalışan bulunamadı"));
            existingProject.setEmployee(employee);
            existingProject.setTeam(null);
        }

        if (project.getTeam() != null && project.getTeam().getId() != null) {
            Team team = teamRepo.findById(project.getTeam().getId())
                    .orElseThrow(() -> new RuntimeException("Atanan takım bulunamadı"));
            existingProject.setTeam(team);
            existingProject.setEmployee(null);
        }

        // Diğer alanlar
        existingProject.setName(project.getName());
        existingProject.setDescription(project.getDescription());
        existingProject.setStatus(project.getStatus());
        existingProject.setPriority(project.getPriority());
        existingProject.setStartDate(project.getStartDate());
        existingProject.setEndDate(project.getEndDate());
        existingProject.setUpdatedAt(LocalDateTime.now());

        // Tasks geri ata
        existingProject.setTasks(existingTasks);

        // Validasyon
        try {
            existingProject.validateAssignment();
        } catch (IllegalStateException e) {
            System.err.println("Assignment validation failed: " + e.getMessage());
        }

        return projectRepo.save(existingProject);
    }

    // Proje sil
    @Transactional
    public void deleteProject(Long id) {
        projectRepo.deleteById(id);
    }

    // Statusüne göre projeler
    @Transactional(readOnly = true)
    public List<Project> getProjectsByStatus(SubTaskStatus status) {
        return projectRepo.findByStatus(status);
    }

    // Önceliğe göre projeler
    @Transactional(readOnly = true)
    public List<Project> getProjectsByPriority(TaskPriority priority) {
        return projectRepo.findByPriority(priority);
    }

    // Çalışana atanmış projeler
    @Transactional(readOnly = true)
    public List<Project> getProjectsByEmployee(Employee employee) {
        return projectRepo.findByEmployee(employee);
    }

    // Yöneticiye atanmış projeler
    @Transactional(readOnly = true)
    public List<Project> getProjectsByManager(Employee manager) {
        return projectRepo.findByAssignedManager(manager);
    }

    // Takıma atanmış projeler
    @Transactional(readOnly = true)
    public List<Project> getProjectsByTeam(Team team) {
        return projectRepo.findByTeam(team);
    }
}
