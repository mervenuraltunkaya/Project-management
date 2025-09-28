package com.example.demo.repository;

import com.example.demo.model.TeamMember;
import com.example.demo.model.Team;
import com.example.demo.model.Employee;
import com.example.demo.enums.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    // Belirli bir takıma ait tüm üyeler
    List<TeamMember> findByTeamId(Long teamId);
    List<TeamMember> findByTeam(Team team);

    // Belirli bir çalışanın üye olduğu tüm takımlar
    List<TeamMember> findByEmployeeId(Long employeeId);
    List<TeamMember> findByEmployee(Employee employee);

    // Takım + rol bilgisine göre üyeler
    List<TeamMember> findByTeamIdAndRole(Long teamId, TeamRole role);

    List<TeamMember> findByRole(TeamRole role);

    // Çalışanın belirli bir takımda olup olmadığını kontrol et
    boolean existsByTeamIdAndEmployeeId(Long teamId, Long employeeId);

    // Sayma işlemleri
    Long countByTeamId(Long teamId);
    Long countByTeamIdAndRole(Long teamId, TeamRole role);
}
