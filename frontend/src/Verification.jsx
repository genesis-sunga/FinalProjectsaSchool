import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Clock, RotateCcw, ShieldCheck, ArrowLeft, Mail } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import './Verification.css';

const getDashboardPath = (user) => {
    const roleName = (user?.role_name || '').toLowerCase();
    const legacyRole = (user?.legacy_role || '').toLowerCase();
    const workerRoleAliases = new Set(['worker', 'moderator', 'cashier']);

    if (roleName === 'admin') return '/admin-dashboard';
    if (workerRoleAliases.has(roleName) || workerRoleAliases.has(legacyRole)) return '/worker-dashboard';
    return '/catalog';
};

const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
};

const Verification = () => {
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(600);
    const [isTimedOut, setIsTimedOut] = useState(false);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('/isda_bg.png');
    const navigate = useNavigate();
    const location = useLocation();

    const queryEmail = new URLSearchParams(location.search).get('email');
    const initialEmail = (location.state?.email || queryEmail || sessionStorage.getItem('pendingVerificationEmail') || '').trim().toLowerCase();
    const [email, setEmail] = useState(initialEmail);
    const otpAlreadySent = location.state?.otpAlreadySent === true;
    const shouldAutoSendOtp = useRef(Boolean(initialEmail));

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

    useEffect(() => {
        if (!email) return;

        sessionStorage.setItem('pendingVerificationEmail', email);

        if (otpAlreadySent) return;
        if (!shouldAutoSendOtp.current) return;
        shouldAutoSendOtp.current = false;

        const resendKey = `verificationOtpSentAt:${email}`;
        const lastSentAt = Number(sessionStorage.getItem(resendKey) || 0);
        if (Date.now() - lastSentAt < 30000) return;

        sessionStorage.setItem(resendKey, String(Date.now()));
        axios.post('http://localhost:5000/api/resend-otp', { email })
            .then(() => {
                setTimer(600);
                setIsTimedOut(false);
                setOtp('');
            })
            .catch((err) => {
                sessionStorage.removeItem(resendKey);
                Swal.fire('Error', err.response?.data?.message || 'Could not send OTP. Please try again later.', 'error');
            });
    }, [email, otpAlreadySent]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        } else {
            setIsTimedOut(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = otp.trim();
        if (!normalizedEmail) return Swal.fire('Error', 'Please enter the email address for this OTP.', 'error');
        if (!/^\d{4}$/.test(normalizedOtp)) return Swal.fire('Error', 'Please enter the 4-digit code', 'error');
        if (isTimedOut) return Swal.fire('Expired', 'OTP has timed out. Please resend.', 'error');

        try {
            const res = await axios.post('http://localhost:5000/api/verify-account', { 
                email: normalizedEmail,
                otp: normalizedOtp 
            });
            
            if (res.status === 200) {
                if (res.data.user) {
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                }
                if (res.data.sessionLogId) {
                    localStorage.setItem('sessionLogId', String(res.data.sessionLogId));
                }
                if (res.data.sessionToken) {
                    localStorage.setItem('sessionToken', res.data.sessionToken);
                }
                sessionStorage.removeItem('pendingVerificationEmail');

                await Swal.fire({
                    icon: 'success',
                    title: 'Account Verified!',
                    text: 'Taking you to your account.',
                    confirmButtonColor: '#007bff'
                });
                navigate(getDashboardPath(res.data.user));
            }
        } catch (err) {
            Swal.fire('Invalid Code', err.response?.data?.message || 'The OTP you entered is incorrect or has expired.', 'error');
        }
    };

    const handleResend = async () => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) return Swal.fire('Error', 'Please enter the email address to receive a new OTP.', 'error');

        try {
            sessionStorage.setItem('pendingVerificationEmail', normalizedEmail);
            await axios.post('http://localhost:5000/api/resend-otp', { email: normalizedEmail });
            setTimer(600);
            setIsTimedOut(false);
            setOtp('');
            Swal.fire('Sent!', 'A new code has been sent to your email.', 'success');
        } catch (err) {
            Swal.fire('Error', 'Could not resend OTP. Please try again later.', 'error');
        }
    };

    return (
        <div className="auth-page-bg" style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
            <div className="auth-glass-card">
                <div className="auth-branding">
                    <h1 className="recovery-side-text">Identity Verification</h1>
                </div>

                <div className="recovery-form-container">
                    <h2 className="main-recovery-title">Verify Your Account</h2>
                    
                    <div className="central-column-stack">
                        <p className="verify-instruction-text">
                            We sent a 4-digit code to <br/>
                            <strong>{email || "your email"}</strong>
                        </p>

                        <div className="input-field-wrapper">
                            <Mail size={18} className="field-icon-main" />
                            <input
                                type="email"
                                placeholder="Email address"
                                className="centered-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                            />
                        </div>

                        <div className={`timer-badge ${isTimedOut ? 'timeout-text' : ''}`}>
                            <Clock size={16} />
                            <span>
                                {isTimedOut ? 'Code Expired' : `Expires in ${formatTimer(timer)}`}
                            </span>
                        </div>

                        <div className="input-field-wrapper">
                            <KeyRound size={18} className="field-icon-main" />
                            <input 
                                type="text" 
                                placeholder="0000" 
                                className="centered-input verify-otp-input" 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                maxLength={4}
                            />
                        </div>

                        <button className="blue-action-btn" onClick={handleVerify}>
                            <ShieldCheck size={18} style={{marginRight: '8px'}} />
                            Verify Account
                        </button>

                        <div className="resend-container">
                            <span className="resend-text">Didn't get the code? </span>
                            <button className="resend-link-btn" onClick={handleResend}>
                                <RotateCcw size={14} /> <b><u>Resend</u></b>
                            </button>
                        </div>

                        <button className="back-to-login-btn" onClick={() => navigate('/login')}>
                            <ArrowLeft size={16} /> Already verified? Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Verification;
