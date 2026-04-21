import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Token expirado/inválido: limpa sessão e redireciona para login
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
        }
        return Promise.reject(error);
    }
);

export default api;
