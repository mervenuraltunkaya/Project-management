package com.example.demo.controller;

import com.example.demo.model.Employee;
import com.example.demo.model.Role;
import com.example.demo.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")  // CORS eklendi
public class AuthController {

    @Autowired 
    private EmployeeService employeeService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> registerEmployee(@RequestBody Map<String, Object> body) {
        // Gelen JSON verisinden alanları ayıklayıp ilgili değişkenlere ata
        String firstName = (String) body.get("firstName");
        String lastName = (String) body.get("lastName");
        String email = (String) body.get("email");
        String phoneNumber = (String) body.get("phoneNumber");
        String password = (String) body.get("password");
        String passwordConfirm = (String) body.get("passwordConfirm");
        Long roleId = Long.valueOf(body.get("roleId").toString());

        // E-posta kontrol
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        if (!Pattern.matches(emailRegex, email)) {
            return ResponseEntity.badRequest().body("Geçerli bir e-posta adresi giriniz! (Örnek: kullanici@ornek.com)");
        }
        // Telefon numarası kontrol
        String phoneRegex = "^\\(\\d{3}\\) \\d{3}-\\d{4}$";
        if (!Pattern.matches(phoneRegex, phoneNumber)) {
            return ResponseEntity.badRequest().body("Telefon numarası formatı hatalı! Lütfen (XXX) XXX-XXXX formatında giriniz.");
        }
        // Şifrelerin eşleşmesi
        if (!password.equals(passwordConfirm)) {
            return ResponseEntity.badRequest().body("Şifreler eşleşmiyor! Lütfen kontrol ediniz.");
        }
        // Şifre: 8+ karakter, büyük/küçük harf, rakam, özel karakter zorunlu
         String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$";
        if (!Pattern.matches(passwordRegex, password)) {
            return ResponseEntity.badRequest()
                    .body("Şifre en az 8 karakter olmalı, büyük harf, küçük harf, rakam ve özel karakter içermelidir.");
        }
        // e-posta tekrarı
        if (employeeService.findByEmail(email) != null) {
            return ResponseEntity.badRequest().body("Bu e-posta adresi kayıtlı!");
        }
        // Rol kontrol 
        Role role = employeeService.getRoleById(roleId);
        if (role == null) {
            return ResponseEntity.badRequest().body("Geçersiz rol seçimi!");
        }
        // Çalışan nesnesi oluşturma ve kaydetme
        Employee employee = new Employee();
        employee.setFirstName(firstName);
        employee.setLastName(lastName);
        employee.setEmail(email);
        employee.setPhoneNumber(phoneNumber);
        employee.setPassword(passwordEncoder.encode(password));
        employee.setRole(role);

        // VT kaydetme ve sonuç döndürme
           try {
            employeeService.saveEmployee(employee);
            return ResponseEntity.ok("Kayıt başarılı!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Kayıt sırasında hata oluştu: " + e.getMessage());
        }
    }

    //Kayıtlı kullanıcılar için
    @PostMapping("/login")
    public ResponseEntity<?> processLogin(@RequestBody Map<String, String> body, HttpSession session) {
        // Kullanıcının girdiği email ve şifreyi al
        String email = body.get("email");
        String password = body.get("password");
        // Email formatı doğru mu? (örnek: ali@firma.com)
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        if (!Pattern.matches(emailRegex, email)) {
            return ResponseEntity.badRequest().body("Geçerli bir e-posta adresi giriniz!");
        }
        // Veritabanında bu email ile çalışan var mı?
        Employee employee = employeeService.findByEmail(email);
        if (employee == null || !passwordEncoder.matches(password, employee.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Geçersiz e-posta veya şifre.");
        }
        // Giriş başarılı!(session)
        session.setAttribute("loggedInUser", employee);
        return ResponseEntity.ok(employee); // frontend'e kullanıcı bilgisi gönderir
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok("Çıkış yapıldı");
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getRoles(){
        return ResponseEntity.ok(employeeService.getAllRoles());
    }

     @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session) {
        Employee employee = (Employee) session.getAttribute("loggedInUser");
        if (employee == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Giriş yapılmamış.");
        }
        return ResponseEntity.ok(employee);
    }

    @GetMapping("/employees")
    public ResponseEntity<?> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<?> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }
}