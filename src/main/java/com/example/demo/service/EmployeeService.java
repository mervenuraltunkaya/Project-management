package com.example.demo.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.model.Employee;
import com.example.demo.model.Role;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.RoleRepository;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired

    private RoleRepository roleRepository;
    //Tüm çalışanları getirme
    public List<Employee> getAllEmployees() {

        return employeeRepository.findAll();

    }
    //Id ile çalışan getirme
    public Employee getEmployeeById(Long id) {

        return employeeRepository.findById(id)

                .orElseThrow(() -> new RuntimeException("Çalışan bulunamadı"));

    }
    // Çalışan kayıt
    public Employee saveEmployee(Employee employee) {

        return employeeRepository.save(employee);

    }
    // Silme
    public void deleteEmployee(Long id) {

        employeeRepository.deleteById(id);

    }
    //Rol getirme
    public Role getRoleById(Long roleId) {

        return roleRepository.findById(roleId)

                .orElseThrow(() -> new RuntimeException("Rol bulunamadı"));

    }
    // Tüm roller
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
    //Çalışana rol atama
    public Employee assignRoleToEmployee(Long employeeId, Long roleId) {

        Employee employee = getEmployeeById(employeeId);

        Role role = getRoleById(roleId);

        employee.setRole(role); // fk role_id

        return employeeRepository.save(employee);

    }
    // Mail ile çalışan bulma
    public Employee findByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }

}