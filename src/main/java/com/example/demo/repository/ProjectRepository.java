package com.example.demo.repository;

import com.example.demo.model.Project;
import com.example.demo.model.Employee;
import com.example.demo.enums.SubTaskStatus;
import com.example.demo.enums.TaskPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.demo.model.Team;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // İsme göre arama
    List<Project> findByName(String name);

    //Takıma göre projeler
    List<Project> findByTeam(Team team);

    // Manager'a göre projeler
    List<Project> findByAssignedManager(Employee assignedManager);

    // Çalışana göre projeler
    List<Project> findByEmployee(Employee employee);

    // Duruma göre projeler
    List<Project> findByStatus(SubTaskStatus status);

    // Önceliğe göre projeler
    List<Project> findByPriority(TaskPriority priority);
}
