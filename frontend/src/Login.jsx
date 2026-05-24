import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import './Login.css';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('/isda_bg.png');
    const navigate = useNavigate();

    const fetchBackground = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/background-settings');
            const setting = Array.isArray(res.data)
                ? res.data.find((item) => item.setting_name === 'auth_background')
                : null;
            setBackgroundImageUrl(setting?.setting_value || '/isda_bg.png');
        } catch {
            setBackgroundImageUrl('/isda_bg.png');
        }
    };

    useEffect(() => {
        fetchBackground();
    }, []);

    const handleLogin = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        try {
            const res = await axios.post('http://localhost:5000/api/login', { 
                email: normalizedEmail, 
                password 
            });
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(res.data.user));
            if (res.data.sessionLogId) {
                localStorage.setItem('sessionLogId', String(res.data.sessionLogId));
            }
            if (res.data.sessionToken) {
                localStorage.setItem('sessionToken', res.data.sessionToken);
            }
            
            Swal.fire({
                title: 'Welcome Back!',
                text: 'Login Successful',
                icon: 'success',
                confirmButtonColor: '#2563eb',
                timer: 1500
            });

            const roleName = (res.data?.user?.role_name || '').toLowerCase();
            const legacyRole = (res.data?.user?.legacy_role || '').toLowerCase();
            const workerRoleAliases = new Set(['worker', 'moderator', 'cashier']);

            if (roleName === 'admin') {
                navigate('/admin-dashboard');
            } else if (workerRoleAliases.has(roleName) || workerRoleAliases.has(legacyRole)) {
                navigate('/worker-dashboard');
            } else {
                navigate('/catalog');
            }
        } catch (err) {
            if (err.response && err.response.status === 403) {
                Swal.fire({
                    title: 'Verify Account',
                    text: 'Your account is not yet verified.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Verify Now',
                    confirmButtonColor: '#2563eb',
                }).then((result) => {
                    if (result.isConfirmed) {
                        sessionStorage.setItem('pendingVerificationEmail', normalizedEmail);
                        navigate('/verify', { state: { email: normalizedEmail, otpAlreadySent: false } });
                    }
                });
            } else {
                Swal.fire({
                    title: 'Login failed!',
                    text: 'Please check your email and password if they are correct.',
                    icon: 'error',
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#2563eb'
                });
            }
        }
    };

    return (
        <div className="auth-page-bg" style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
            <div className="auth-glass-card">
                <div className="auth-branding">
                    <h1>Welcome to TongTong Fish Culture</h1>
                </div>
                <div className="auth-form-container">
                    <h2>Login</h2>
                    
                    <label className="auth-label">Email:</label>
                    <input 
                        type="email" 
                        className="auth-input" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        style={{marginBottom: '15px'}} 
                    />

                    <label className="auth-label">Password:</label>
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            className="auth-input" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                        <div className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </div>
                    </div>

                    {/* RESTORED: Forgot Password Link */}
                    <div className="forgot-link-container">
                        <span className="forgot-link">
                            Forgot Password? <span className="link-span" onClick={() => navigate('/forgot-password')}>Click Here</span>
                        </span>
                    </div>

                    <div className="button-container">
                        <button className="auth-button" onClick={handleLogin}>Log In</button>
                        <p className="auth-footer-text">
                            No Account Yet? <span className="link-span" onClick={() => navigate('/signup')}>Signup Now</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
