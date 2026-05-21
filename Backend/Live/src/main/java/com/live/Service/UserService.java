package com.live.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.live.DTO.RegisterRequest;
import com.live.Model.User;
import com.live.Repository.MainRepository;
import com.live.Util.PasswordUtil;

@Service
public class UserService {

    @Autowired
    private MainRepository repo;

    @Autowired
    private PasswordEncoder encoder;

    // 🔐 LOGIN
    public User login(String userName, String password) {

        User user = repo.findByUserName(userName).orElse(null);

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return user;
    }

    // 📝 REGISTER
    public User register(RegisterRequest request) {

        if (repo.findByUserName(request.getUserName()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        if (repo.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        if (!PasswordUtil.isValidPassword(request.getPassword())) {
            throw new RuntimeException(
                "Password must be 8+ chars with uppercase, lowercase, number & special character"
            );
        }

        User user = new User();
        user.setUserName(request.getUserName());
        user.setEmail(request.getEmail());

        String hashedPassword = encoder.encode(request.getPassword());
        user.setPassword(hashedPassword);

        user.setRole("User");

        return repo.save(user);
    }
}