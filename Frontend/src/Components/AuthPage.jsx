import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";
import axios from "axios";

function AuthPage() {
    const navigate=useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [userName, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // ✅ NEW STATES
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isLogin) {
                // LOGIN
                const res = await axios.post("http://localhost:8080/api/login", {
                    userName,
                    password
                });
                
                const token = res.data.token;
                const userRole=res.data.role;
                localStorage.setItem("token", token);
                localStorage.setItem("role",userRole.toUpperCase().trim());
                localStorage.setItem("username", userName);
                
                if (userRole === "Admin") {
                     navigate("/admin-dashboard");
                } else if(userRole==="User") {
                      navigate("/dashboard");
                          }
                 else
                      {
                      navigate("/");
                           }
                   setMessage("Login Successful ✅");
                setIsError(false);

                setUserName("");
                setPassword("");

            } else {
                // REGISTER
                if (!email.includes("@") || !email.includes(".")) {
                    setMessage("Enter a valid email");
                    setIsError(true);
                    return;
                }

                const res = await axios.post("http://localhost:8080/api/register", {
                    userName,
                    email,
                    password
                });

                setMessage(res.data.message); // backend message
                setIsError(false);

                setUserName("");
                setEmail("");
                setPassword("");
                setIsLogin(true);
            }

        } catch (err) {
            setMessage(
    err.response?.data?.message || 
    err.response?.data || 
    "Server error"
);
            setIsError(true);
        }

        // 🔥 Auto hide message
        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    const handleToggle = () => {
        setIsLogin(!isLogin);

        // clear fields
        setUserName("");
        setEmail("");
        setPassword("");
        setMessage("");
    };

    return (
        <div className="auth-container">
                {/* ✅ MESSAGE UI */}
                {message && (
    <div className={`toast ${isError ? "toast-error" : "toast-success"}`}>
        {isError ? "❌" : "✅"} {message}
    </div>
)}
<form className="auth-form" onSubmit={handleSubmit}>
    <h2>{isLogin ? "Welcome Back 👋" : "Create Account 🚀"}</h2>

                <input
                    type="text"
                    placeholder="Username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                />

                {!isLogin && (
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                )}

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">
                    {isLogin ? "Login" : "Register"}
                </button>

                <p className="toggle-text">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <span onClick={handleToggle}>
                        {isLogin ? " Sign Up" : " Login"}
                    </span>
                </p>

            </form>
        </div>
    );
}

export default AuthPage;