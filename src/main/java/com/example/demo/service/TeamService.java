package com.example.demo.service;

import com.example.demo.model.Team;
import com.example.demo.model.Employee;
import com.example.demo.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepo;

    // Tüm takımlar - Transaction içinde lazy loading'i zorla
    @Transactional(readOnly = true)
    public List<Team> getAllTeams() {
        List<Team> teams = teamRepo.findAll();
        // Lazy loading'i force et
        teams.forEach(team -> {
            team.getMembers().size(); // Members'ı yükle
            team.getProjects().size(); // Projects'i yükle
        });
        return teams;
    }

    // ID ile takım - Transaction içinde
    @Transactional(readOnly = true)
    public Optional<Team> getTeam(Long id) {
        Optional<Team> teamOpt = teamRepo.findById(id);
        if (teamOpt.isPresent()) {
            Team team = teamOpt.get();
            // Lazy loading'i force et
            team.getMembers().size();
            team.getProjects().size();
        }
        return teamOpt;
    }

    // Yeni takım ekle
    @Transactional
    public Team createTeam(Team team) {
        team.setCreatedAt(LocalDateTime.now());
        team.setUpdatedAt(LocalDateTime.now());
        return teamRepo.save(team);
    }

    // Takım güncelle
    @Transactional
    public Team updateTeam(Team team) {
        if (team.getId() != null && teamRepo.existsById(team.getId())) {
            team.setUpdatedAt(LocalDateTime.now());
            Team savedTeam = teamRepo.save(team);
            // Lazy loading'i force et
            savedTeam.getMembers().size();
            savedTeam.getProjects().size();
            return savedTeam;
        }
        throw new RuntimeException("Güncellenecek takım bulunamadı: " + team.getId());
    }

    // Takım sil
    @Transactional
    public void deleteTeam(Long id) {
        teamRepo.deleteById(id);
    }

    // İsme göre arama
    @Transactional(readOnly = true)
    public List<Team> getTeamsByName(String name) {
        List<Team> teams = teamRepo.findByName(name);
        teams.forEach(team -> {
            team.getMembers().size();
            team.getProjects().size();
        });
        return teams;
    }

    // Çalışanın üye olduğu takımlar
    @Transactional(readOnly = true)
    public List<Team> getTeamsByMember(Employee employee) {
        List<Team> teams = teamRepo.findByMembers(employee);
        teams.forEach(team -> {
            team.getMembers().size();
            team.getProjects().size();
        });
        return teams;
    }
}