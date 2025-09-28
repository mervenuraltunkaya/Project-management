package com.example.demo.service;

import com.example.demo.model.TeamMember;
import com.example.demo.model.Team;
import com.example.demo.model.Employee;
import com.example.demo.enums.TeamRole;
import com.example.demo.repository.TeamMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@Service
public class TeamMemberService {

    @Autowired
    private TeamMemberRepository teamMemberRepo;

    // Tüm takım üyeleri
    public List<TeamMember> getAllTeamMembers() {
        return teamMemberRepo.findAll();
    }

    // ID ile getirme
    public Optional<TeamMember> getTeamMember(Long id) {
        return teamMemberRepo.findById(id);
    }

    // Yeni üye ekle
    public TeamMember addTeamMember(TeamMember teamMember) {
        // Duplicate kontrolü (aynı kişi aynı takıma tekrar eklenmesin)
        if (teamMemberRepo.existsByTeamIdAndEmployeeId(
                teamMember.getTeam().getId(), 
                teamMember.getEmployee().getId())) {
            throw new RuntimeException("Bu çalışan zaten bu takıma eklenmiş.");
        }
        return teamMemberRepo.save(teamMember);
    }

    // Üye güncelle
    public TeamMember updateTeamMember(TeamMember teamMember) {
        if (teamMember.getId() != null && teamMemberRepo.existsById(teamMember.getId())) {
            return teamMemberRepo.save(teamMember);
        }
        throw new RuntimeException("Güncellenecek üye bulunamadı: " + teamMember.getId());
    }

    // Üye sil
    public void deleteTeamMember(Long id) {
        teamMemberRepo.deleteById(id);
    }

    // Belirli bir takımın üyeleri
    public List<TeamMember> getMembersByTeam(Team team) {
        return teamMemberRepo.findByTeam(team);
    }

    // Belirli bir çalışanın üyelikleri
    public List<TeamMember> getMembersByEmployee(Employee employee) {
        return teamMemberRepo.findByEmployee(employee);
    }

    // Belirli bir takımdaki role göre üyeler
    public List<TeamMember> getMembersByTeamAndRole(Long teamId, TeamRole role) {
        return teamMemberRepo.findByTeamIdAndRole(teamId, role);
    }

    // Belirli role sahip tüm üyeler (repository’ye findByRole eklediysen)
    public List<TeamMember> getMembersByRole(TeamRole role) {
        return teamMemberRepo.findByRole(role);
    }
}