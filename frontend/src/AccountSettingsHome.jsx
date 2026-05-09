import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Camera, ChevronRight, KeyRound, LogOut, UserRound } from 'lucide-react';
import axios from 'axios';
import './AccountSettingsHome.css';

const settingsOptions = [
    {
        title: 'Profile Picture',
        description: 'Update the image shown on your account.',
        path: '/account/profile-picture',
        icon: Camera
    },
    {
        title: 'Name, Email, Contact, Address',
        description: 'Edit your personal and contact information.',
        path: '/account/personal-info',
        icon: UserRound
    },
    {
        title: 'Discount Verification Request',
        description: 'Submit or review your Senior/PWD discount request.',
        path: '/account/discount-verification',
        icon: BadgeCheck
    },
    {
        title: 'Change Password',
        description: 'Set a new password for your account.',
        path: '/account/change-password',
        icon: KeyRound
    }
];

const AccountSettingsHome = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userRole = String(user?.role_name || '').toLowerCase();
    const returnPath = userRole === 'worker'
        ? '/worker-dashboard'
        : userRole === 'admin'
            ? '/admin-dashboard'
            : '/catalog';
    const displayName = useMemo(
        () => (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Client'),
        [user]
    );

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/api/logout', {
                userId: user?.user_id,
                sessionLogId: localStorage.getItem('sessionLogId'),
                sessionToken: localStorage.getItem('sessionToken')
            });
        } catch {
            // Local cleanup still completes if the API is unavailable.
        }

        localStorage.removeItem('user');
        localStorage.removeItem('sessionLogId');
        localStorage.removeItem('sessionToken');
        navigate('/');
    };

    return (
        <div className="account-settings-home-screen">
            <header className="account-settings-home-header">
                <button className="account-settings-home-back" type="button" onClick={() => navigate(returnPath)} aria-label="Back">
                    <ArrowLeft size={20} />
                </button>
                <div className="account-settings-home-identity">
                    <strong>{displayName || 'Client'}</strong>
                    <span>{user?.email || 'Guest'}</span>
                </div>
                <div className="account-settings-home-header-copy">
                    <h2>Account Settings</h2>
                    <p>Manage profile details, verification, and password access.</p>
                </div>
                <button type="button" className="btn-logout" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                </button>
            </header>

            <main className="account-settings-home-shell">
                <section className="account-settings-home-intro">
                    <p className="account-settings-home-kicker">Profile Settings</p>
                    <h1>Account Settings</h1>
                    <p>Choose what you want to update.</p>
                </section>

                <section className="account-settings-options" aria-label="Account setting options">
                    {settingsOptions.map((option) => {
                        const Icon = option.icon;

                        return (
                            <button
                                key={option.path}
                                type="button"
                                className="account-settings-option"
                                onClick={() => navigate(option.path)}
                            >
                                <span className="account-settings-option-icon" aria-hidden="true">
                                    <Icon size={22} />
                                </span>
                                <span className="account-settings-option-copy">
                                    <strong>{option.title}</strong>
                                    <span>{option.description}</span>
                                </span>
                                <ChevronRight size={20} className="account-settings-option-arrow" aria-hidden="true" />
                            </button>
                        );
                    })}
                </section>
            </main>
        </div>
    );
};

export default AccountSettingsHome;
