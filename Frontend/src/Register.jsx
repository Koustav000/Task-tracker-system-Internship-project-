import React, { useState } from "react";
import api from "./api";

const Register = () => {

    const [form, setForm] = useState({
        userName: "",
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            await api.post("/register", form);

            alert("Registered Successfully");
            window.location.href = "/";

        } catch (err) {
            alert(err.response?.data || "Registration failed");
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleRegister} style={styles.card}>
                <h2>Register</h2>

                <input
                    type="text"
                    name="userName"
                    placeholder="Username"
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    required
                />

                <button type="submit">Register</button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
    },
    card: {
        padding: "30px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    }
};

export default Register;