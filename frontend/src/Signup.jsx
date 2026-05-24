import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2'; 
import axios from 'axios';
import './Signup.css';

const ADDRESS_API_BASE = 'https://psgc.cloud/api';

const normalizeLocationName = (value) => {
    const text = String(value || '').trim();
    if (!text) return '';

    try {
        const decoded = decodeURIComponent(escape(text));
        return decoded.includes('Ã') || decoded.includes('Â') ? decoded : decoded;
    } catch {
        return text;
    }
};

const Signup = () => {
    const [formData, setFormData] = useState({
        firstName: '', middleName: '', lastName: '', suffix: '', gender: '',
        birthday: '', contact: '', houseDetails: '', provinceCode: '', provinceName: '',
        cityCode: '', cityName: '', barangayCode: '', barangayName: '', zipCode: '',
        address: '', email: '', password: '', confirmPassword: ''
    });
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);
    const [locationLoading, setLocationLoading] = useState({ provinces: false, cities: false, barangays: false });


    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('/isda_bg.png');
    const navigate = useNavigate();
    const [requirements, setRequirements] = useState({ length: false, upper: false, lower: false, number: false, symbol: false });
    const [strength, setStrength] = useState({ label: '', color: '', score: 0 });
    const [errors, setErrors] = useState({});
    const [showFormError, setShowFormError] = useState(false);

    useEffect(() => {
        fetchBackground();
    }, []);

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

    // Helper to get min/max date for 18+ years old
    const getMaxBirthday = () => {
        const today = new Date();
        today.setFullYear(today.getFullYear() - 18);
        return today.toISOString().split('T')[0];
    };
    const getMinBirthday = () => {
        // Optional: set a reasonable min, e.g. 100 years ago
        const min = new Date();
        min.setFullYear(min.getFullYear() - 100);
        return min.toISOString().split('T')[0];
    };

    const fetchProvinces = async () => {
        setLocationLoading(prev => ({ ...prev, provinces: true }));
        try {
            const res = await axios.get(`${ADDRESS_API_BASE}/provinces`);
            const list = Array.isArray(res.data) ? [...res.data] : [];
            list.forEach((item) => {
                item.name = normalizeLocationName(item.name);
            });
            list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
            setProvinces(list);
        } catch {
            Swal.fire('Address API Error', 'Unable to load provinces right now. Please try again later.', 'error');
        } finally {
            setLocationLoading(prev => ({ ...prev, provinces: false }));
        }
    };

    const fetchCitiesByProvince = async (provinceCode) => {
        if (!provinceCode) {
            setCities([]);
            return;
        }
        setLocationLoading(prev => ({ ...prev, cities: true }));
        try {
            const res = await axios.get(`${ADDRESS_API_BASE}/provinces/${provinceCode}/cities-municipalities`);
            const list = Array.isArray(res.data) ? [...res.data] : [];
            list.forEach((item) => {
                item.name = normalizeLocationName(item.name);
            });
            list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
            setCities(list);
        } catch {
            setCities([]);
            Swal.fire('Address API Error', 'Unable to load cities/municipalities for the selected province.', 'error');
        } finally {
            setLocationLoading(prev => ({ ...prev, cities: false }));
        }
    };

    const fetchBarangaysByCity = async (cityCode) => {
        if (!cityCode) {
            setBarangays([]);
            return;
        }
        setLocationLoading(prev => ({ ...prev, barangays: true }));
        try {
            const res = await axios.get(`${ADDRESS_API_BASE}/cities-municipalities/${cityCode}/barangays`);
            const list = Array.isArray(res.data) ? [...res.data] : [];
            list.forEach((item) => {
                item.name = normalizeLocationName(item.name);
            });
            list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
            setBarangays(list);
        } catch {
            setBarangays([]);
            Swal.fire('Address API Error', 'Unable to load barangays for the selected city/municipality.', 'error');
        } finally {
            setLocationLoading(prev => ({ ...prev, barangays: false }));
        }
    };

    React.useEffect(() => {
        fetchProvinces();
    }, []);

    const handleInputChange = (e) => {
        let { name, value } = e.target;
        if (name === 'contact') value = value.replace(/\D/g, '').slice(0, 9);
        if (name === 'zipCode') value = value.replace(/\D/g, '').slice(0, 4);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProvinceChange = async (e) => {
        const provinceCode = e.target.value;
        const selectedProvince = provinces.find((item) => item.code === provinceCode);

        setFormData(prev => ({
            ...prev,
            provinceCode,
            provinceName: selectedProvince?.name || '',
            cityCode: '',
            cityName: '',
            barangayCode: '',
            barangayName: '',
            zipCode: ''
        }));

        setCities([]);
        setBarangays([]);
        await fetchCitiesByProvince(provinceCode);
    };

    const handleCityChange = async (e) => {
        const cityCode = e.target.value;
        const selectedCity = cities.find((item) => item.code === cityCode);
        const normalizedZip = String(selectedCity?.zip_code || '').replace(/\D/g, '').slice(0, 4);

        setFormData(prev => ({
            ...prev,
            cityCode,
            cityName: selectedCity?.name || '',
            barangayCode: '',
            barangayName: '',
            zipCode: normalizedZip
        }));

        setBarangays([]);
        await fetchBarangaysByCity(cityCode);
    };

    const handleBarangayChange = (e) => {
        const barangayCode = e.target.value;
        const selectedBarangay = barangays.find((item) => item.code === barangayCode);

        setFormData(prev => ({
            ...prev,
            barangayCode,
            barangayName: selectedBarangay?.name || ''
        }));
    };

    const handlePasswordChange = (val) => {
        setFormData(prev => ({ ...prev, password: val }));
        const reqs = {
            length: val.length >= 8,
            upper: /[A-Z]/.test(val),
            lower: /[a-z]/.test(val),
            number: /[0-9]/.test(val),
            symbol: /[@#$%^&*\-_+=!?]/.test(val)
        };
        setRequirements(reqs);
        const score = Object.values(reqs).filter(Boolean).length;
        if (val.length === 0) setStrength({ label: '', color: '', score: 0 });
        else if (score <= 1) setStrength({ label: 'Weak', color: '#ff4d4d', score: 1 });
        else if (score <= 4) setStrength({ label: 'Medium', color: '#ffa500', score: 2 });
        else setStrength({ label: 'Strong', color: '#22c55e', score: 5 });
    };

    const handleSignup = async () => {
        const newErrors = {};
        const {
            firstName, lastName, gender, birthday, contact, houseDetails,
            provinceName, cityName, barangayName, zipCode, email, password, confirmPassword
        } = formData;
        
        if (!firstName) newErrors.firstName = 'First name is required';
        if (!lastName) newErrors.lastName = 'Last name is required';
        if (!gender) newErrors.gender = 'Gender is required';
        if (!birthday) newErrors.birthday = 'Birthday is required';
        if (!contact) newErrors.contact = 'Contact is required';
        if (!houseDetails) newErrors.houseDetails = 'House details are required';
        if (!provinceName) newErrors.province = 'Province is required';
        if (!cityName) newErrors.city = 'City/Municipality is required';
        if (!barangayName) newErrors.barangay = 'Barangay is required';
        if (!zipCode) newErrors.zipCode = 'ZIP code is required';
        if (!email) newErrors.email = 'Email is required';
        if (!password) newErrors.password = 'Password is required';
        
        if (contact && contact.length !== 9) {
            newErrors.contact = 'Contact must be 9 digits (after 09 prefix)';
        }
        if (!/^\d{4}$/.test(zipCode)) {
            newErrors.zipCode = 'ZIP code must be exactly 4 digits';
        }
        const normalizedEmail = email.toLowerCase().trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailPattern.test(normalizedEmail)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        const minDate = getMinBirthday();
        const maxDate = getMaxBirthday();
        if (birthday && (birthday < minDate || birthday > maxDate)) {
            newErrors.birthday = 'You must be at least 18 years old';
        }
        
        const allMet = Object.values(requirements).every(Boolean);
        if (password && !allMet) {
            newErrors.password = 'Password needs 8+ chars, uppercase, lowercase, number, and symbol';
        }
        if (password !== confirmPassword && password && confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            if (newErrors.form) {
                setShowFormError(true);
            }
            return;
        }
        try {
            setErrors({});
            const fullContact = `09${contact}`;
            const fullAddress = `${houseDetails}, ${barangayName}, ${cityName}, ${provinceName}, ${zipCode}`;
            await axios.post('http://localhost:5000/api/signup', { 
                ...formData, 
                contact: fullContact,
                address: fullAddress,
                email: normalizedEmail 
            });
            sessionStorage.setItem('pendingVerificationEmail', normalizedEmail);
            Swal.fire('Success', 'Account created! Check your email for OTP.', 'success').then(() => {
                navigate('/verify', { state: { email: normalizedEmail, otpAlreadySent: true } });
            });
        } catch (err) {
            setErrors({ form: err.response?.data?.message || 'Registration failed' });
            setShowFormError(true);
        }
    };

    return (
        <div className="signup-page-container" style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
            {showFormError && (
                <div className="error-modal-overlay" onClick={() => setShowFormError(false)}>
                    <div className="error-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="error-modal-header">
                            <h3>Error</h3>
                            <button className="error-modal-close" onClick={() => setShowFormError(false)}>×</button>
                        </div>
                        <div className="error-modal-content">
                            {errors.form}
                        </div>
                    </div>
                </div>
            )}
            <div className="auth-glass-card narrow-signup">
                <div className="signup-main-form">
                    <h2 className="form-header">Signup</h2>
                    <div className="signup-grid">
                        <div className="input-group col-4">
                            <label>First Name <span className="required-asterisk">*</span>{errors.firstName && <span className="label-error">{errors.firstName}</span>}</label>
                            <input type="text" name="firstName" placeholder="First Name" onChange={handleInputChange} required />
                        </div>
                        <div className="input-group col-2">
                            <label>Middle Name</label>
                            <input type="text" name="middleName" placeholder="Middle Name" onChange={handleInputChange} />
                        </div>
                        <div className="input-group col-4">
                            <label>Last Name <span className="required-asterisk">*</span>{errors.lastName && <span className="label-error">{errors.lastName}</span>}</label>
                            <input type="text" name="lastName" placeholder="Last Name" onChange={handleInputChange} required />
                        </div>
                        <div className="input-group col-2">
                            <label>Suffix</label>
                            <select name="suffix" value={formData.suffix} onChange={handleInputChange}>
                                <option value="">None</option>
                                <option value="Jr.">Jr.</option>
                                <option value="Sr.">Sr.</option>
                                <option value="II">II</option>
                                <option value="III">III</option>
                                <option value="IV">IV</option>
                                <option value="V">V</option>
                            </select>
                        </div>
                        <div className="input-group col-4 birthday-group">
                            <label>Birthday <span className="required-asterisk">*</span>{errors.birthday && <span className="label-error">{errors.birthday}</span>}</label>
                            <input
                                type="date"
                                name="birthday"
                                value={formData.birthday}
                                min={getMinBirthday()}
                                max={getMaxBirthday()}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="input-group col-4">
                            <label>Gender <span className="required-asterisk">*</span>{errors.gender && <span className="label-error">{errors.gender}</span>}</label>
                            <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                                <option value="" disabled>Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                        <div className="input-group col-4">
                            <label>Contact <span className="required-asterisk">*</span>{errors.contact && <span className="label-error">{errors.contact}</span>}</label>
                            <div className="prefixed-input">
                                <span className="input-prefix">09</span>
                                <input type="text" name="contact" value={formData.contact} placeholder="123456789" maxLength={9} inputMode="numeric" pattern="[0-9]*" onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="input-group col-12">
                            <label>House No., Street, Subdivision/Village <span className="required-asterisk">*</span>{errors.houseDetails && <span className="label-error">{errors.houseDetails}</span>}</label>
                            <input type="text" name="houseDetails" value={formData.houseDetails} placeholder="House #, Street, Subdivision/Village" onChange={handleInputChange} />
                        </div>
                        <div className="input-group col-3">
                            <label>Province <span className="required-asterisk">*</span>{errors.province && <span className="label-error">{errors.province}</span>}</label>
                            <select name="provinceCode" value={formData.provinceCode} onChange={handleProvinceChange} required disabled={locationLoading.provinces}>
                                <option value="" disabled>{locationLoading.provinces ? 'Loading provinces...' : 'Select province'}</option>
                                {provinces.map((province) => (
                                    <option key={province.code} value={province.code}>{province.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group col-4">
                            <label>City/Municipality <span className="required-asterisk">*</span>{errors.city && <span className="label-error">{errors.city}</span>}</label>
                            <select name="cityCode" value={formData.cityCode} onChange={handleCityChange} required disabled={!formData.provinceCode || locationLoading.cities}>
                                <option value="" disabled>{locationLoading.cities ? 'Loading cities/municipalities...' : 'Select city/municipality'}</option>
                                {cities.map((city) => (
                                    <option key={city.code} value={city.code}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group col-3">
                            <label>Barangay <span className="required-asterisk">*</span>{errors.barangay && <span className="label-error">{errors.barangay}</span>}</label>
                            <select name="barangayCode" value={formData.barangayCode} onChange={handleBarangayChange} required disabled={!formData.cityCode || locationLoading.barangays}>
                                <option value="" disabled>{locationLoading.barangays ? 'Loading barangays...' : 'Select barangay'}</option>
                                {barangays.map((barangay) => (
                                    <option key={barangay.code} value={barangay.code}>{barangay.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group col-2">
                            <label>ZIP Code <span className="required-asterisk">*</span>{errors.zipCode && <span className="label-error">{errors.zipCode}</span>}</label>
                            <input type="text" name="zipCode" value={formData.zipCode} placeholder={formData.cityCode ? "Auto-filled from city/municipality" : "Select city first"} maxLength={4} inputMode="numeric" pattern="[0-9]*" onChange={handleInputChange} disabled={!formData.cityCode} />
                        </div>
                        <div className="input-group col-12">
                            <label>Email <span className="required-asterisk">*</span>{errors.email && <span className="label-error">{errors.email}</span>}</label>
                            <input type="email" name="email" placeholder="email@gmail.com" onChange={handleInputChange} />
                        </div>

                        <div className="input-group col-12">
                            <label>Password <span className="required-asterisk">*</span>{errors.password && <span className="label-error">{errors.password}</span>}</label>
                            <div className="pass-input-container">
                                <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" onChange={(e) => handlePasswordChange(e.target.value)} />
                                <span className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span>
                            </div>
                            
                            {/* Password Strength & Requirements Section */}
                            {formData.password && (
                                <div className="strength-feedback-compact">
                                    <div className="bar-bg">
                                        <div className="bar-fill" style={{ width: `${(strength.score / 4) * 100}%`, backgroundColor: strength.color }}></div>
                                    </div>
                                    <div className="req-grid">
                                        <div className={requirements.length ? "met" : ""}>8+ Chars</div>
                                        <div className={requirements.upper ? "met" : ""}>Uppercase</div>
                                        <div className={requirements.lower ? "met" : ""}>Lowercase</div>
                                        <div className={requirements.number ? "met" : ""}>Number</div>
                                        <div className={requirements.symbol ? "met" : ""}>Symbol</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="input-group col-12">
                            <label>Confirm Password <span className="required-asterisk">*</span>{errors.confirmPassword && <span className="label-error">{errors.confirmPassword}</span>}</label>
                            <div className="pass-input-container">
                                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="••••••••" onChange={handleInputChange} />
                                <span className="eye-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span>
                            </div>
                        </div>
                    </div>
                    <div className="signup-footer-compact">
                        <button className="signup-btn-small" onClick={handleSignup}>Sign Up</button>
                        <div className="back-link-small" onClick={() => navigate('/login')}><ArrowLeft size={14} /> Already have an account? Login</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Signup;
