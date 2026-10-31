import axios from "axios";

const api = axios.create({
    baseURL: "https://d3bdu90tt1ccwq.cloudfront.net"
});

// 🔐 Attach JWT token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;