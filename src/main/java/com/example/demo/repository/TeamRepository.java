package com.example.demo.repository;

import com.example.demo.model.Team;
import com.example.demo.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    // Takım adı ile arama (tam eşleşme)
    List<Team> findByName(String name);

    // tam eşleşme takım adı arama
    List<Team> findByNameIgnoreCase(String name);

    // İsme göre parça arama (örn: "dev" → "Development Team")
    List<Team> findByNameContainingIgnoreCase(String keyword);

    // Belirli bir çalışanın üye olduğu tüm takımlar
    List<Team> findByMembers(Employee employee);

    // Çalışanın üye olduğu takım sayısı
    Long countByMembers(Employee employee);

    // En son oluşturulan takımları sırala
    List<Team> findAllByOrderByCreatedAtDesc();
}
