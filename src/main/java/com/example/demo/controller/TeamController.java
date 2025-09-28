package com.example.demo.controller;

import com.example.demo.model.Team;
import com.example.demo.model.TeamMember;
import com.example.demo.service.TeamService;
import com.example.demo.service.TeamMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/teams")
public class TeamController {

    @Autowired
    private TeamService teamService;
    
    @Autowired
    private TeamMemberService teamMemberService;

    // ==== GET ====

    // Tüm takımları getir (üye detayları ile birlikte)
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllTeams() {
        List<Team> teams = teamService.getAllTeams();
        List<Map<String, Object>> teamsWithMembers = teams.stream().map(team -> {
            Map<String, Object> teamData = new HashMap<>();
            teamData.put("id", team.getId());
            teamData.put("name", team.getName());
            teamData.put("description", team.getDescription());
            teamData.put("createdAt", team.getCreatedAt());
            teamData.put("updatedAt", team.getUpdatedAt());
            
            // Takım üyelerini detaylı şekilde al
            List<TeamMember> members = teamMemberService.getMembersByTeam(team);
            List<Map<String, Object>> memberDetails = members.stream().map(member -> {
                Map<String, Object> memberData = new HashMap<>();
                memberData.put("id", member.getId());
                memberData.put("firstName", member.getEmployee().getFirstName());
                memberData.put("lastName", member.getEmployee().getLastName());
                memberData.put("email", member.getEmployee().getEmail());
                memberData.put("role", member.getRole());
                memberData.put("joinedAt", member.getJoinedAt());
                return memberData;
            }).toList();
            
            teamData.put("members", memberDetails);
            return teamData;
        }).toList();
        
        return ResponseEntity.ok(teamsWithMembers);
    }

    // ID ile takım getir (üye detayları ile birlikte)
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTeamById(@PathVariable Long id) {
        Optional<Team> teamOpt = teamService.getTeam(id);
        
        if (teamOpt.isPresent()) {
            Team team = teamOpt.get();
            Map<String, Object> teamData = new HashMap<>();
            teamData.put("id", team.getId());
            teamData.put("name", team.getName());
            teamData.put("description", team.getDescription());
            teamData.put("createdAt", team.getCreatedAt());
            teamData.put("updatedAt", team.getUpdatedAt());
            
            // Takım üyelerini detaylı şekilde al
            List<TeamMember> members = teamMemberService.getMembersByTeam(team);
            List<Map<String, Object>> memberDetails = members.stream().map(member -> {
                Map<String, Object> memberData = new HashMap<>();
                memberData.put("id", member.getId());
                memberData.put("firstName", member.getEmployee().getFirstName());
                memberData.put("lastName", member.getEmployee().getLastName());
                memberData.put("email", member.getEmployee().getEmail());
                memberData.put("role", member.getRole());
                memberData.put("joinedAt", member.getJoinedAt());
                return memberData;
            }).toList();
            
            teamData.put("members", memberDetails);
            return ResponseEntity.ok(teamData);
        }
        
        return ResponseEntity.notFound().build();
    }

    // ==== POST ====

    // Yeni takım ekle
    @PostMapping
    public ResponseEntity<Team> addTeam(@RequestBody Team team) {
        return ResponseEntity.ok(teamService.createTeam(team));
    }

    // ==== PUT ====

    // Takım güncelle
    @PutMapping("/{id}")
    public ResponseEntity<Team> updateTeam(@PathVariable Long id, @RequestBody Team team) {
        team.setId(id);
        return ResponseEntity.ok(teamService.updateTeam(team));
    }

    // ==== DELETE ====

    // Takım sil
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }
}