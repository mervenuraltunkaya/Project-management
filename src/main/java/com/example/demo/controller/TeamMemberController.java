package com.example.demo.controller;

import com.example.demo.model.TeamMember;
import com.example.demo.model.Team;
import com.example.demo.model.Employee;
import com.example.demo.enums.TeamRole;
import com.example.demo.service.TeamMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/teamMembers")
public class TeamMemberController {

    @Autowired
    private TeamMemberService teamMemberService;

    // ==== GET ====

    // Tüm üyeleri getir
    @GetMapping
    public ResponseEntity<List<TeamMember>> getAllTeamMembers() {
        return ResponseEntity.ok(teamMemberService.getAllTeamMembers());
    }

    // ID ile üye getir
    @GetMapping("/{id}")
    public ResponseEntity<TeamMember> getTeamMemberById(@PathVariable Long id) {
        Optional<TeamMember> teamMember = teamMemberService.getTeamMember(id);
        return teamMember.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }

    // Belirli bir takımın üyeleri
    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<TeamMember>> getMembersByTeam(@PathVariable Long teamId) {
        Team team = new Team();
        team.setId(teamId);
        return ResponseEntity.ok(teamMemberService.getMembersByTeam(team));
    }

    // Belirli bir çalışanın üyelikleri
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TeamMember>> getMembersByEmployee(@PathVariable Long employeeId) {
        Employee employee = new Employee();
        employee.setId(employeeId);
        return ResponseEntity.ok(teamMemberService.getMembersByEmployee(employee));
    }

    // Belirli bir takım + rol
    @GetMapping("/team/{teamId}/role/{role}")
    public ResponseEntity<List<TeamMember>> getMembersByTeamAndRole(@PathVariable Long teamId,
                                                                    @PathVariable TeamRole role) {
        return ResponseEntity.ok(teamMemberService.getMembersByTeamAndRole(teamId, role));
    }

    // Sadece role göre tüm üyeler (repository’de findByRole varsa)
    @GetMapping("/role/{role}")
    public ResponseEntity<List<TeamMember>> getMembersByRole(@PathVariable TeamRole role) {
        return ResponseEntity.ok(teamMemberService.getMembersByRole(role));
    }

    // ==== POST ====

    // Yeni üye ekle
    @PostMapping
    public ResponseEntity<TeamMember> addTeamMember(@RequestBody TeamMember teamMember) {
        return ResponseEntity.ok(teamMemberService.addTeamMember(teamMember));
    }

    // ==== PUT ====

    // Üye güncelle
    @PutMapping("/{id}")
    public ResponseEntity<TeamMember> updateTeamMember(@PathVariable Long id,
                                                       @RequestBody TeamMember teamMember) {
        teamMember.setId(id);
        return ResponseEntity.ok(teamMemberService.updateTeamMember(teamMember));
    }

    // ==== DELETE ====

    // Üye sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeamMember(@PathVariable Long id) {
        teamMemberService.deleteTeamMember(id);
        return ResponseEntity.noContent().build();
    }
}