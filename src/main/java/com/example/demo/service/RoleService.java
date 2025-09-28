package com.example.demo.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.model.Role;
import com.example.demo.repository.RoleRepository;


@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    //Tüm rolleri getir
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
    //Rol kaydet
    public Role saveRole(Role role) {
        return roleRepository.save(role);
    }
    //Id ile rol getirme
    public Role getRoleById(Long id) {
        return roleRepository.findById(id).orElse(null);
    }
     //Rol silme
    public void deleteRoleById(Long id) {
        roleRepository.deleteById(id);
    }

}