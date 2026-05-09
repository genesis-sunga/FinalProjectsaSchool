import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ArrowLeft, Eye, EyeOff, LogOut } from 'lucide-react';
import './AccountSettingsPage.css';

const ALLOWED_SUFFIXES = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

const sectionLabels = {
    profilePicture: 'Profile Picture',
    personalInfo: 'Personal Details',
    discountVerification: 'Discount Verification Request',
    changePassword: 'Change Password'
};

const AccountSettingsPage = ({ section }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.user_id || null;
    const userRole = String(user?.role_name || '').toLowerCase();
    const returnPath = userRole === 'worker'
        ? '/worker-dashboard'
        : userRole === 'admin'
            ? '/admin-dashboard'
            : '/catalog';
    const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Client';
    const profileImageStorageKey = userId ? `clientProfileImage:${userId}` : 'clientProfileImage';

    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [discountLoading, setDiscountLoading] = useState(false);
    const [profileImagePreview, setProfileImagePreview] = useState(localStorage.getItem(profileImageStorageKey) || user?.profile_image_url || user?.id_image_url || '');
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileEdit, setProfileEdit] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        birthday: '',
        gender: '',
        contact_number: '',
        address: '',
        email: ''
    });
    const [passwordEdit, setPasswordEdit] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordRequirements, setPasswordRequirements] = useState({ length: false, upper: false, lower: false, number: false, symbol: false });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [discountRequestType, setDiscountRequestType] = useState('none');
    const [discountIdFrontFile, setDiscountIdFrontFile] = useState(null);
    const [discountIdBackFile, setDiscountIdBackFile] = useState(null);
    const [discountState, setDiscountState] = useState({
        is_senior: 0,
        is_pwd: 0,
        senior_verified: null,
        pwd_verified: null,
        id_image_url: '',
        id_front_image_url: '',
        id_back_image_url: ''
    });

    useEffect(() => {
        if (!userId) {
            navigate('/');
            return;
        }

        const loadProfile = async () => {
            setProfileLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/user-profile/${userId}`);
                setProfileEdit({
                    first_name: res.data.first_name || '',
                    middle_name: res.data.middle_name || '',
                    last_name: res.data.last_name || '',
                    suffix: res.data.suffix || '',
                    birthday: res.data.birthday || '',
                    gender: res.data.gender || '',
                    contact_number: res.data.contact_number || '',
                    address: res.data.address || '',
                    email: res.data.email || ''
                });
                setDiscountState({
                    is_senior: Number(res.data.is_senior || 0),
                    is_pwd: Number(res.data.is_pwd || 0),
                    senior_verified: res.data.senior_verified,
                    pwd_verified: res.data.pwd_verified,
                    id_image_url: res.data.id_image_url || '',
                    id_front_image_url: res.data.id_front_image_url || '',
                    id_back_image_url: res.data.id_back_image_url || ''
                });
                setDiscountRequestType(
                    Number(res.data.is_senior || 0) === 1
                        ? 'senior'
                        : Number(res.data.is_pwd || 0) === 1
                            ? 'pwd'
                            : 'none'
                );
                setProfileImagePreview(res.data.profile_image_url || res.data.id_image_url || localStorage.getItem(profileImageStorageKey) || '');
            } catch {
                Swal.fire('Error', 'Failed to load profile', 'error');
            } finally {
                setProfileLoading(false);
            }
        };

        loadProfile();
    }, [navigate, profileImageStorageKey, userId]);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/api/logout', {
                userId,
                sessionLogId: localStorage.getItem('sessionLogId'),
                sessionToken: localStorage.getItem('sessionToken')
            });
        } catch {
            // Session cleanup still happens locally if the API call fails.
        }
        localStorage.removeItem('user');
        localStorage.removeItem('sessionLogId');
        localStorage.removeItem('sessionToken');
        navigate('/');
    };

    const handleProfileEditChange = (e) => {
        const { name, value } = e.target;
        setProfileEdit((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordEditChange = (e) => {
        const { name, value } = e.target;
        setPasswordEdit((prev) => ({ ...prev, [name]: value }));

        if (name === 'newPassword') {
            setPasswordRequirements({
                length: value.length >= 8,
                upper: /[A-Z]/.test(value),
                lower: /[a-z]/.test(value),
                number: /[0-9]/.test(value),
                symbol: /[@#$%^&*\-_+=!?]/.test(value)
            });
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileLoading(true);

        try {
            if (!ALLOWED_SUFFIXES.includes(profileEdit.suffix || '')) {
                throw new Error('Invalid suffix selection.');
            }

            let uploadedImageUrl = profileImagePreview;

            if (profileImageFile) {
                const formData = new FormData();
                formData.append('image', profileImageFile);
                const uploadRes = await axios.post('http://localhost:5000/api/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedImageUrl = uploadRes.data.imageUrl;
            }

            await axios.put(`http://localhost:5000/api/account/${userId}`, {
                first_name: profileEdit.first_name,
                last_name: profileEdit.last_name,
                suffix: profileEdit.suffix,
                email: profileEdit.email,
                contact_number: profileEdit.contact_number,
                address: profileEdit.address,
                id_image_url: uploadedImageUrl
            });

            const updatedUser = {
                ...user,
                first_name: profileEdit.first_name,
                last_name: profileEdit.last_name,
                suffix: profileEdit.suffix,
                email: profileEdit.email,
                contact_number: profileEdit.contact_number,
                address: profileEdit.address,
                id_image_url: uploadedImageUrl,
                profile_image_url: uploadedImageUrl
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem(profileImageStorageKey, uploadedImageUrl || '');
            setProfileImagePreview(uploadedImageUrl || '');
            setProfileImageFile(null);
            Swal.fire('Success', 'Profile updated!', 'success');
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || err.message || 'Update failed', 'error');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);

        try {
            if (!passwordEdit.oldPassword || !passwordEdit.newPassword || !passwordEdit.confirmPassword) {
                throw new Error('Please complete all password fields.');
            }
            if (passwordEdit.newPassword !== passwordEdit.confirmPassword) {
                throw new Error('New passwords do not match');
            }
            if (passwordEdit.newPassword.length < 8 || !/[A-Z]/.test(passwordEdit.newPassword) || !/[a-z]/.test(passwordEdit.newPassword) || !/[0-9]/.test(passwordEdit.newPassword) || !/[@#$%^&*\-_+=!?]/.test(passwordEdit.newPassword)) {
                throw new Error('Password must have 8+ chars, uppercase, lowercase, number, and symbol (@#$%^&*-_+=!?).');
            }

            await axios.put(`http://localhost:5000/api/account/${userId}/password`, {
                oldPassword: passwordEdit.oldPassword,
                newPassword: passwordEdit.newPassword
            });

            setPasswordEdit({ oldPassword: '', newPassword: '', confirmPassword: '' });
            Swal.fire('Success', 'Password updated!', 'success');
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || err.message || 'Update failed', 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDiscountRequestConfirm = async () => {
        const hasApprovedDiscount = Number(discountState.senior_verified) === 1 || Number(discountState.pwd_verified) === 1;

        if (hasApprovedDiscount) {
            Swal.fire('Locked', 'This discount request is already approved and locked.', 'info');
            return;
        }
        if (discountRequestType === 'none') {
            Swal.fire('Select Request', 'Please select Senior Citizen or PWD before confirming.', 'warning');
            return;
        }
        if (!discountIdFrontFile || !discountIdBackFile) {
            Swal.fire('ID Required', 'Please upload both the front and back of your ID for discount verification.', 'warning');
            return;
        }

        setDiscountLoading(true);

        try {
            const idFormData = new FormData();
            idFormData.append('idFront', discountIdFrontFile);
            idFormData.append('idBack', discountIdBackFile);
            idFormData.append('userId', String(userId));
            idFormData.append('isSenior', String(discountRequestType === 'senior'));
            idFormData.append('isPwd', String(discountRequestType === 'pwd'));

            const requestRes = await axios.post('http://localhost:5000/api/upload-id', idFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setDiscountState((prev) => ({
                ...prev,
                is_senior: discountRequestType === 'senior' ? 1 : 0,
                is_pwd: discountRequestType === 'pwd' ? 1 : 0,
                senior_verified: discountRequestType === 'senior' ? null : 0,
                pwd_verified: discountRequestType === 'pwd' ? null : 0,
                id_image_url: requestRes.data?.idFrontImageUrl || prev.id_image_url,
                id_front_image_url: requestRes.data?.idFrontImageUrl || prev.id_front_image_url,
                id_back_image_url: requestRes.data?.idBackImageUrl || prev.id_back_image_url
            }));

            setDiscountIdFrontFile(null);
            setDiscountIdBackFile(null);
            Swal.fire('Submitted', 'Discount request submitted. Waiting for admin approval.', 'success');
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || err.message || 'Failed to submit discount request', 'error');
        } finally {
            setDiscountLoading(false);
        }
    };

    const scrollToSection = useCallback((targetSection) => {
        document.getElementById(`account-section-${targetSection}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, []);

    useEffect(() => {
        if (!profileLoading && section) {
            scrollToSection(section);
        }
    }, [profileLoading, scrollToSection, section]);

    const renderSection = (targetSection) => {
        if (profileLoading) {
            return <div className="account-settings-loading">Loading...</div>;
        }

        if (targetSection === 'profilePicture') {
            return (
                <form className="account-settings-form" onSubmit={handleProfileSave}>
                    <div className="profile-image-row">
                        {profileImagePreview ? (
                            <img src={profileImagePreview} alt="Profile Preview" className="profile-image-preview" />
                        ) : (
                            <div className="profile-image-preview profile-image-fallback">{displayName ? displayName[0].toUpperCase() : 'C'}</div>
                        )}
                        <div className="profile-image-picker">
                            <label htmlFor="account-profile-image" className="field-label">Profile Image</label>
                            <input
                                id="account-profile-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    setProfileImageFile(file || null);
                                    if (file) {
                                        setProfileImagePreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <PageActions loading={profileLoading} onCancel={() => navigate(returnPath)} />
                </form>
            );
        }

        if (targetSection === 'personalInfo') {
            return (
                <form className="account-settings-form" onSubmit={handleProfileSave}>
                    <div className="form-row">
                        <div className="form-field">
                            <label className="field-label" htmlFor="account-first-name">First Name</label>
                            <input id="account-first-name" name="first_name" value={profileEdit.first_name || ''} onChange={handleProfileEditChange} placeholder="First Name" />
                        </div>
                        <div className="form-field">
                            <label className="field-label" htmlFor="account-last-name">Last Name</label>
                            <input id="account-last-name" name="last_name" value={profileEdit.last_name || ''} onChange={handleProfileEditChange} placeholder="Last Name" />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-field">
                            <label className="field-label" htmlFor="account-suffix">Suffix (Optional)</label>
                            <select id="account-suffix" name="suffix" value={profileEdit.suffix || ''} onChange={handleProfileEditChange}>
                                <option value="">None</option>
                                <option value="Jr.">Jr.</option>
                                <option value="Sr.">Sr.</option>
                                <option value="II">II</option>
                                <option value="III">III</option>
                                <option value="IV">IV</option>
                                <option value="V">V</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-field">
                            <label className="field-label" htmlFor="account-email">Email</label>
                            <input id="account-email" name="email" value={profileEdit.email || ''} onChange={handleProfileEditChange} placeholder="Email" />
                        </div>
                        <div className="form-field">
                            <label className="field-label" htmlFor="account-contact-number">Contact Number</label>
                            <input id="account-contact-number" name="contact_number" value={profileEdit.contact_number || ''} onChange={handleProfileEditChange} placeholder="Contact Number" />
                        </div>
                    </div>
                    <div className="form-row form-row-full">
                        <div className="form-field">
                            <label className="field-label" htmlFor="account-address">Address</label>
                            <textarea id="account-address" name="address" value={profileEdit.address || ''} onChange={handleProfileEditChange} placeholder="Address" rows={3} />
                        </div>
                    </div>
                    <PageActions loading={profileLoading} onCancel={() => navigate(returnPath)} />
                </form>
            );
        }

        if (targetSection === 'discountVerification') {
            const hasApprovedDiscount = Number(discountState.senior_verified) === 1 || Number(discountState.pwd_verified) === 1;
            const hasPendingRequest = (Number(discountState.is_senior) === 1 && discountState.senior_verified === null)
                || (Number(discountState.is_pwd) === 1 && discountState.pwd_verified === null);
            const discountLabel = Number(discountState.is_senior) === 1 ? 'Senior Citizen'
                : Number(discountState.is_pwd) === 1 ? 'PWD' : 'None';

            return (
                <div className={`discount-request-section ${hasApprovedDiscount ? 'discount-request-approved' : ''}`}>
                    <p className="discount-help-text">Request Senior/PWD discount by selecting one option and submitting a valid ID proof.</p>
                    <div className="discount-radio-group" role="radiogroup" aria-label="Discount request type">
                        <label><input type="radio" name="discountRequestType" value="none" checked={discountRequestType === 'none'} onChange={(e) => setDiscountRequestType(e.target.value)} disabled={hasApprovedDiscount} /> No request</label>
                        <label><input type="radio" name="discountRequestType" value="senior" checked={discountRequestType === 'senior'} onChange={(e) => setDiscountRequestType(e.target.value)} disabled={hasApprovedDiscount} /> Senior Citizen</label>
                        <label><input type="radio" name="discountRequestType" value="pwd" checked={discountRequestType === 'pwd'} onChange={(e) => setDiscountRequestType(e.target.value)} disabled={hasApprovedDiscount} /> PWD</label>
                    </div>
                    <div className="form-field">
                        <label className="field-label" htmlFor="account-discount-id-front">Upload ID Front</label>
                        <input id="account-discount-id-front" type="file" accept="image/*" disabled={hasApprovedDiscount} onChange={(e) => setDiscountIdFrontFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="form-field">
                        <label className="field-label" htmlFor="account-discount-id-back">Upload ID Back</label>
                        <input id="account-discount-id-back" type="file" accept="image/*" disabled={hasApprovedDiscount} onChange={(e) => setDiscountIdBackFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="discount-status-action-row">
                        <p className="discount-status-message">
                            {hasApprovedDiscount
                                ? `Approved: ${discountLabel} discount is active. Request is now locked.`
                                : hasPendingRequest
                                    ? `Pending: ${discountLabel} request is waiting for admin review.`
                                    : 'No active discount request.'}
                        </p>
                    </div>
                    <p className="discount-file-note">Upload both the front and back images of your ID, then click Confirm to submit the request.</p>
                    <div className="account-settings-actions">
                        <button type="button" className="btn-secondary" onClick={() => navigate(returnPath)}>Cancel</button>
                        <button type="button" className="btn-primary discount-confirm-btn" onClick={handleDiscountRequestConfirm} disabled={hasApprovedDiscount || discountLoading}>
                            {discountLoading ? 'Confirming...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <form className="account-settings-form password-section" onSubmit={handlePasswordSave}>
                <PasswordField id="account-old-password" label="Old Password" name="oldPassword" value={passwordEdit.oldPassword} show={showOldPassword} onChange={handlePasswordEditChange} onToggle={() => setShowOldPassword((prev) => !prev)} />
                <PasswordField id="account-new-password" label="New Password" name="newPassword" value={passwordEdit.newPassword} show={showNewPassword} onChange={handlePasswordEditChange} onToggle={() => setShowNewPassword((prev) => !prev)} />
                <PasswordField id="account-confirm-password" label="Confirm Password" name="confirmPassword" value={passwordEdit.confirmPassword} show={showConfirmPassword} onChange={handlePasswordEditChange} onToggle={() => setShowConfirmPassword((prev) => !prev)} />
                {passwordEdit.newPassword && (
                    <div className="password-requirements">
                        <div style={{ opacity: passwordRequirements.length ? 1 : 0.5 }}>8+ Chars</div>
                        <div style={{ opacity: passwordRequirements.upper ? 1 : 0.5 }}>Uppercase</div>
                        <div style={{ opacity: passwordRequirements.lower ? 1 : 0.5 }}>Lowercase</div>
                        <div style={{ opacity: passwordRequirements.number ? 1 : 0.5 }}>Number</div>
                        <div style={{ opacity: passwordRequirements.symbol ? 1 : 0.5 }}>Symbol</div>
                    </div>
                )}
                <PageActions loading={passwordLoading} onCancel={() => navigate(returnPath)} />
            </form>
        );
    };

    const allSections = ['profilePicture', 'personalInfo', 'discountVerification', 'changePassword'];

    return (
        <div className="account-settings-screen">
            <header className="account-settings-header">
                <button className="account-settings-back" type="button" onClick={() => navigate(returnPath)} aria-label="Back">
                    <ArrowLeft size={20} />
                </button>
                <div className="account-settings-identity">
                    <strong>{displayName || 'Client'}</strong>
                    <span>{user?.email || 'Guest'}</span>
                </div>
                <button type="button" className="btn-logout" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                </button>
            </header>

            <main className="account-settings-shell">
                <nav className="account-settings-nav" aria-label="Edit personal information sections">
                    <div className="account-settings-nav-title">Account Settings</div>
                    <button type="button" onClick={() => scrollToSection('profilePicture')}>Profile Picture</button>
                    <button type="button" onClick={() => scrollToSection('personalInfo')}>Name, Email, Contact, Address</button>
                    <button type="button" onClick={() => scrollToSection('discountVerification')}>Discount Verification Request</button>
                    <button type="button" onClick={() => scrollToSection('changePassword')}>Change Password</button>
                </nav>
                <section className="account-settings-card">
                    <h1>Account Settings</h1>
                    {profileLoading ? (
                        <div className="account-settings-loading">Loading...</div>
                    ) : (
                        <div className="account-settings-all-sections">
                            {allSections.map((accountSection) => (
                                <section
                                    key={accountSection}
                                    id={`account-section-${accountSection}`}
                                    className="account-settings-section"
                                >
                                    <h2>{sectionLabels[accountSection]}</h2>
                                    {renderSection(accountSection)}
                                </section>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

const PageActions = ({ loading, onCancel }) => (
    <div className="account-settings-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
    </div>
);

const PasswordField = ({ id, label, name, value, show, onChange, onToggle }) => (
    <div className="password-input-wrap">
        <label className="field-label" htmlFor={id}>{label}</label>
        <input id={id} type={show ? 'text' : 'password'} name={name} value={value} onChange={onChange} placeholder={label} />
        <button type="button" className="password-toggle" onClick={onToggle} aria-label={`Toggle ${label}`}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    </div>
);

export default AccountSettingsPage;
