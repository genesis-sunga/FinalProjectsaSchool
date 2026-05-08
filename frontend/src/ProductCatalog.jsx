import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { User, ShoppingCart, Package, Settings, LogOut, Eye, EyeOff, X, Mic, MicOff } from 'lucide-react';
import './ProductCatalog.css';

const ALLOWED_SUFFIXES = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

const ProductCatalog = () => {
    const [clientTheme, setClientTheme] = useState({
        pageBg: '#e9f7f6',
        cardBg: '#ffffff',
        panelBg: '#f8fcfc',
        softBg: '#dff4f2'
    });
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('ASC');
    const [loading, setLoading] = useState(true);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordRequirements, setPasswordRequirements] = useState({ length: false, upper: false, lower: false, number: false, symbol: false });
    const [passwordStrength, setPasswordStrength] = useState({ label: '', color: '', score: 0 });
    const [discountRequestType, setDiscountRequestType] = useState('none');
    const [discountIdFrontFile, setDiscountIdFrontFile] = useState(null);
    const [discountIdBackFile, setDiscountIdBackFile] = useState(null);
    const [discountLoading, setDiscountLoading] = useState(false);
    const [discountState, setDiscountState] = useState({
        is_senior: 0,
        is_pwd: 0,
        senior_verified: null,
        pwd_verified: null,
        id_image_url: '',
        id_front_image_url: '',
        id_back_image_url: ''
    });

    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.user_id || null;
    const userRole = user?.role_name || null;
    const isAdmin = String(userRole || '').toLowerCase() === 'admin';
    const isClientLike = ['client', 'customer'].includes(String(userRole || '').toLowerCase());
    const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Client';
    const profileImageStorageKey = userId ? `clientProfileImage:${userId}` : 'clientProfileImage';
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

    const normalizeSearchInput = (value) => String(value || '')
        .replace(/\s+/g, ' ')
        .replace(/[.,!?;:。]+$/g, '')
        .trim();

    useEffect(() => {
        const fetchClientTheme = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/background-settings');
                const settings = Array.isArray(res.data) ? res.data : [];
                const getSetting = (name, fallback) => settings.find((item) => item.setting_name === name)?.setting_value || fallback;
                setClientTheme({
                    pageBg: getSetting('client_theme_page_bg', '#e9f7f6'),
                    cardBg: getSetting('client_theme_card_bg', '#ffffff'),
                    panelBg: getSetting('client_theme_panel_bg', '#f8fcfc'),
                    softBg: getSetting('client_theme_soft_bg', '#dff4f2')
                });
            } catch {}
        };

        fetchClientTheme();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/api/logout', {
                userId,
                sessionLogId: localStorage.getItem('sessionLogId'),
                sessionToken: localStorage.getItem('sessionToken')
            });
        } catch {}
        localStorage.removeItem('user');
        localStorage.removeItem('sessionLogId');
        localStorage.removeItem('sessionToken');
        navigate('/');
    };

    useEffect(() => {
        fetchProducts();
        // Load profile image on mount
        if (userId) {
            axios.get(`http://localhost:5000/api/user-profile/${userId}`)
                .then(res => {
                    setProfileImagePreview(res.data.profile_image_url || res.data.id_image_url || localStorage.getItem(profileImageStorageKey) || '');
                })
                .catch(() => {
                    setProfileImagePreview(localStorage.getItem(profileImageStorageKey) || user?.profile_image_url || user?.id_image_url || '');
                });
        }
    }, []);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                transcript += event.results[i][0].transcript;
            }
            setSearch(normalizeSearchInput(transcript));
        };

        recognitionRef.current = recognition;
        setSpeechSupported(true);

        return () => {
            try {
                recognition.stop();
            } catch {}
        };
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/products', {
                params: { includeDeleted: true }
            });
            setProducts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const isProductDeleted = (product) => {
        const normalized = String(product?.is_deleted ?? '').toLowerCase();
        return normalized === '1' || normalized === 'true';
    };

    const visibleProducts = useMemo(() => {
        const searchTerm = normalizeSearchInput(search).toLowerCase();
        const filtered = (products || []).filter((product) => {
            const name = String(product.name || '').toLowerCase();
            const category = String(product.category || '').toLowerCase();
            const isDeleted = isProductDeleted(product);
            const isOutOfStock = Number(product.stock || 0) <= 0;
            const isUnavailable = isDeleted || isOutOfStock;

            // Default dashboard view hides unavailable products.
            if (!searchTerm) {
                return !isUnavailable;
            }

            const matchesName = name.includes(searchTerm);
            const matchesCategory = category.includes(searchTerm);

            // Unavailable products only appear when searched by product name.
            if (isUnavailable) {
                return matchesName;
            }

            return matchesName || matchesCategory;
        });

        return [...filtered].sort((left, right) => {
            const a = String(left.name || '').toLowerCase();
            const b = String(right.name || '').toLowerCase();
            return sortOrder === 'DESC' ? b.localeCompare(a) : a.localeCompare(b);
        });
    }, [products, search, sortOrder]);

    const handleAddToCart = async (product) => {
        if (!userId) {
            Swal.fire('Login Required', 'Please login first', 'warning');
            navigate('/');
            return;
        }

        if (isProductDeleted(product) || Number(product.stock || 0) <= 0) {
            Swal.fire('Unavailable', 'This product is not available for purchase.', 'info');
            return;
        }

        const { value: quantityValue } = await Swal.fire({
            title: `Add ${product.name} to cart`,
            input: 'number',
            inputLabel: `Enter quantity (max ${product.stock})`,
            inputValue: 1,
            inputAttributes: {
                min: '1',
                max: String(product.stock),
                step: '1'
            },
            showCancelButton: true,
            confirmButtonText: 'Add to Cart',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#0ea5a8',
            preConfirm: (value) => {
                const parsed = Number(value);
                if (!Number.isFinite(parsed) || parsed < 1) {
                    Swal.showValidationMessage('Quantity must be at least 1');
                    return null;
                }
                if (parsed > Number(product.stock || 0)) {
                    Swal.showValidationMessage(`Only ${product.stock} available`);
                    return null;
                }
                return parsed;
            }
        });

        if (!quantityValue) {
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/cart', {
                userId,
                productId: product.product_id,
                quantity: Number(quantityValue)
            });

            Swal.fire('Success', `${product.name} x${quantityValue} added to cart`, 'success');
        } catch {
            Swal.fire('Error', 'Failed to add to cart', 'error');
        }
    };

    const openProfileModal = async () => {
        if (!userId) return;

        setShowProfileModal(true);
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
            setDiscountIdFrontFile(null);
            setDiscountIdBackFile(null);
            setProfileImagePreview(res.data.profile_image_url || res.data.id_image_url || localStorage.getItem(profileImageStorageKey) || '');
        } catch {
            Swal.fire('Error', 'Failed to load profile', 'error');
            setShowProfileModal(false);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleProfileEditChange = (e) => {
        const { name, value } = e.target;
        setProfileEdit((prev) => ({ ...prev, [name]: value }));
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
                id_image_url: uploadedImageUrl
            });

            if (passwordEdit.oldPassword || passwordEdit.newPassword || passwordEdit.confirmPassword) {
                if (!passwordEdit.oldPassword || !passwordEdit.newPassword || !passwordEdit.confirmPassword) {
                    throw new Error('Please complete all password fields.');
                }

                if (passwordEdit.newPassword !== passwordEdit.confirmPassword) {
                    throw new Error('New passwords do not match');
                }

                if (passwordEdit.newPassword.length < 8 || !/[A-Z]/.test(passwordEdit.newPassword) || !/[a-z]/.test(passwordEdit.newPassword) || !/[0-9]/.test(passwordEdit.newPassword) || !/[@#$%^&*\-_+=!?]/.test(passwordEdit.newPassword)) {
                    throw new Error('Password must have 8+ chars, uppercase, lowercase, number, and symbol (@#$%^&*-_+=!?).');
                }

                setPasswordLoading(true);
                await axios.put(`http://localhost:5000/api/account/${userId}/password`, {
                    oldPassword: passwordEdit.oldPassword,
                    newPassword: passwordEdit.newPassword
                });
            }

            const updatedUser = {
                ...user,
                first_name: profileEdit.first_name,
                last_name: profileEdit.last_name,
                suffix: profileEdit.suffix,
                email: profileEdit.email,
                id_image_url: uploadedImageUrl
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem(profileImageStorageKey, uploadedImageUrl || '');
            setProfileImagePreview(uploadedImageUrl || '');
            setProfileImageFile(null);
            setPasswordEdit({ oldPassword: '', newPassword: '', confirmPassword: '' });
            Swal.fire('Success', 'Profile updated!', 'success');
            setShowProfileModal(false);
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || err.message || 'Update failed', 'error');
        } finally {
            setProfileLoading(false);
            setPasswordLoading(false);
        }
    };

    const handlePasswordEditChange = (e) => {
        const { name, value } = e.target;
        setPasswordEdit((prev) => ({ ...prev, [name]: value }));
        
        // Update password requirements if it's the newPassword field
        if (name === 'newPassword') {
            const reqs = {
                length: value.length >= 8,
                upper: /[A-Z]/.test(value),
                lower: /[a-z]/.test(value),
                number: /[0-9]/.test(value),
                symbol: /[@#$%^&*\-_+=!?]/.test(value)
            };
            setPasswordRequirements(reqs);
            const score = Object.values(reqs).filter(Boolean).length;
            if (value.length === 0) setPasswordStrength({ label: '', color: '', score: 0 });
            else if (score <= 1) setPasswordStrength({ label: 'Weak', color: '#ff4d4d', score: 1 });
            else if (score <= 4) setPasswordStrength({ label: 'Medium', color: '#ffa500', score: 2 });
            else setPasswordStrength({ label: 'Strong', color: '#22c55e', score: 5 });
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();

        if (passwordEdit.newPassword !== passwordEdit.confirmPassword) {
            Swal.fire('Error', 'Passwords do not match', 'error');
            return;
        }

        setPasswordLoading(true);

        try {
            await axios.put(`http://localhost:5000/api/account/${userId}/password`, {
                oldPassword: passwordEdit.oldPassword,
                newPassword: passwordEdit.newPassword
            });

            Swal.fire('Success', 'Password changed', 'success');
            setShowProfileModal(false);
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
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

    const handleSpeechToggle = () => {
        if (!speechSupported || !recognitionRef.current) {
            Swal.fire('Not Supported', 'Speech recognition is not supported in this browser.', 'info');
            return;
        }

        try {
            if (isListening) {
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
            }
        } catch (err) {
            console.error(err);
            setIsListening(false);
        }
    };

    return (
        <div
            className="catalog-container"
            style={{
                '--client-page-bg': clientTheme.pageBg,
                '--client-card-bg': clientTheme.cardBg,
                '--client-panel-bg': clientTheme.panelBg,
                '--client-soft-bg': clientTheme.softBg
            }}
        >
            <div className="catalog-header glass-panel">
                <div className="client-header-left">
                    <button className="client-profile-button" type="button" title="Profile">
                        {profileImagePreview ? (
                            <img src={profileImagePreview} alt="Profile" className="client-profile-image" />
                        ) : (
                            <div className="client-profile-fallback">{displayName ? displayName[0].toUpperCase() : 'C'}</div>
                        )}
                    </button>
                    <div className="client-header-user-meta">
                        <div className="client-header-name">{displayName || 'Client'}</div>
                        <div className="client-header-role">{user?.email || 'Guest'}</div>
                    </div>
                </div>

                <h1>TongTong Fish Culture</h1>

                <div className="client-header-right">
                    {isClientLike && (
                        <>
                            <button className="client-settings-button" onClick={openProfileModal} title="Settings">
                                <Settings size={20} />
                            </button>
                            <button className="client-order-button" onClick={() => navigate('/order-info')} title="Order Info">
                                <Package size={20} />
                            </button>
                            <button className="client-cart-button" onClick={() => navigate('/cart')} title="Cart">
                                <ShoppingCart size={20} />
                            </button>
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <button
                                onClick={() => {
                                    localStorage.setItem('adminActiveTab', 'products');
                                    navigate('/admin-dashboard');
                                }}
                                className="client-admin-link"
                            >
                                Admin
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="product-toolbar glass-panel">
                <div className="filter-group search-filter">
                    <div className="search-input-wrap-client">
                        <input
                            type="text"
                            placeholder="Search by name or category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="speech-control">
                            {isListening && (
                                <div className="voice-listening-popover" role="status" aria-live="polite">
                                    <div className="voice-listening-toolbar">
                                        <button
                                            type="button"
                                            className="voice-listening-close"
                                            onClick={handleSpeechToggle}
                                            aria-label="Stop voice search"
                                            title="Stop voice search"
                                        >
                                            <X size={14} />
                                        </button>
                                        <Mic size={18} />
                                        <span className="voice-listening-focus" aria-hidden="true" />
                                    </div>
                                    <div className="voice-listening-label">Tell me what you're looking for.</div>
                                </div>
                            )}
                            <button
                                type="button"
                                className={`speech-button ${isListening ? 'listening' : ''}`}
                                onClick={handleSpeechToggle}
                                title={speechSupported ? (isListening ? 'Stop voice input' : 'Start voice input') : 'Speech not supported'}
                                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                                disabled={!speechSupported}
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="filter-group select-filter">
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="ASC">A-Z</option>
                        <option value="DESC">Z-A</option>
                    </select>
                </div>
            </div>

            <div className="products-grid">
                {loading ? (
                    <p>Loading...</p>
                ) : visibleProducts.length === 0 ? (
                    <p>No products found</p>
                ) : (
                    visibleProducts.map((product) => {
                        const isDiscontinued = isProductDeleted(product);
                        const isOutOfStock = !isDiscontinued && Number(product.stock || 0) <= 0;
                        const isUnavailable = isDiscontinued || isOutOfStock;
                        const canOpenDetails = !isDiscontinued;
                        const unavailableLabel = isDiscontinued ? 'Discontinued' : 'Out of Stock';
                        const cardClassName = [
                            'product-card',
                            isDiscontinued ? 'discontinued' : '',
                            isOutOfStock ? 'out-of-stock' : ''
                        ]
                            .filter(Boolean)
                            .join(' ');

                        return (
                            <div
                                key={product.product_id}
                                className={cardClassName}
                                onClick={canOpenDetails ? () => navigate(`/product/${product.product_id}`) : undefined}
                                role={canOpenDetails ? 'button' : 'article'}
                                tabIndex={canOpenDetails ? 0 : -1}
                                aria-disabled={!canOpenDetails}
                                onKeyDown={canOpenDetails ? (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        navigate(`/product/${product.product_id}`);
                                    }
                                } : undefined}
                            >
                                <div className="product-image">
                                    <img
                                        src={product.image_url || 'https://via.placeholder.com/200'}
                                        alt={product.name}
                                    />
                                </div>

                                <div className="product-info">
                                    <h4 className="product-title">{product.name}</h4>
                                    <div className="product-meta-line">
                                        <div className="price">₱{Number(product.price || 0).toFixed(2)}</div>
                                        <div className="stock-and-category">
                                            <div className="stock-text">Stock: {Number(product.stock || 0)}</div>
                                            <div className="category">{product.category}</div>
                                        </div>
                                        {isUnavailable && (
                                            <div className="product-status unavailable">{unavailableLabel}</div>
                                        )}
                                    </div>

                                    {!isDiscontinued && !isOutOfStock && (
                                        <button
                                            className="btn-cart"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCart(product);
                                            }}
                                        >
                                            Add to Cart
                                        </button>
                                    )}

                                    {!isDiscontinued && isOutOfStock && (
                                        <button
                                            className="btn-cart btn-cart-disabled-state"
                                            type="button"
                                            disabled
                                        >
                                            Out of Stock
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showProfileModal && (
                <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Profile Settings</h3>
                            <button className="close-button" onClick={() => setShowProfileModal(false)}><X size={24} /></button>
                        </div>

                        {profileLoading ? (
                            <p>Loading...</p>
                        ) : (
                            <form onSubmit={handleProfileSave} className="profile-form">
                                <div className="profile-image-row">
                                    {profileImagePreview ? (
                                        <img src={profileImagePreview} alt="Profile Preview" className="profile-image-preview" />
                                    ) : (
                                        <div className="profile-image-preview profile-image-fallback">{displayName ? displayName[0].toUpperCase() : 'C'}</div>
                                    )}
                                    <div className="profile-image-picker">
                                        <label htmlFor="client-profile-image" className="field-label">Profile Image</label>
                                        <input
                                            id="client-profile-image"
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

                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="field-label" htmlFor="client-first-name">First Name</label>
                                        <input id="client-first-name" name="first_name" value={profileEdit.first_name || ''} onChange={handleProfileEditChange} placeholder="First Name" />
                                    </div>
                                    <div className="form-field">
                                        <label className="field-label" htmlFor="client-last-name">Last Name</label>
                                        <input id="client-last-name" name="last_name" value={profileEdit.last_name || ''} onChange={handleProfileEditChange} placeholder="Last Name" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="field-label" htmlFor="client-suffix">Suffix (Optional)</label>
                                        <select id="client-suffix" name="suffix" value={profileEdit.suffix || ''} onChange={handleProfileEditChange}>
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
                                        <label className="field-label" htmlFor="client-email">Email</label>
                                        <input id="client-email" name="email" value={profileEdit.email || ''} onChange={handleProfileEditChange} placeholder="Email" />
                                    </div>
                                    <div className="form-field">
                                        <label className="field-label" htmlFor="client-contact-number">Contact Number</label>
                                        <input id="client-contact-number" name="contact_number" value={profileEdit.contact_number || ''} onChange={handleProfileEditChange} placeholder="Contact Number" />
                                    </div>
                                </div>

                                <div className="form-row form-row-full">
                                    <div className="form-field">
                                        <label className="field-label" htmlFor="client-address">Address</label>
                                        <textarea id="client-address" name="address" value={profileEdit.address || ''} onChange={handleProfileEditChange} placeholder="Address" rows={3} />
                                    </div>
                                </div>

                                {(() => {
                                    const hasApprovedDiscount = Number(discountState.senior_verified) === 1 || Number(discountState.pwd_verified) === 1;
                                    const hasPendingRequest = (Number(discountState.is_senior) === 1 && discountState.senior_verified === null)
                                        || (Number(discountState.is_pwd) === 1 && discountState.pwd_verified === null);
                                    const discountLabel = Number(discountState.is_senior) === 1 ? 'Senior Citizen'
                                        : Number(discountState.is_pwd) === 1 ? 'PWD' : 'None';

                                    return (
                                        <div className={`discount-request-section ${hasApprovedDiscount ? 'discount-request-approved' : ''}`}>
                                            <h4>Discount Verification Request</h4>
                                            <p className="discount-help-text">Request Senior/PWD discount by selecting one option and submitting a valid ID proof.</p>

                                            <div className="discount-radio-group" role="radiogroup" aria-label="Discount request type">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="discountRequestType"
                                                        value="none"
                                                        checked={discountRequestType === 'none'}
                                                        onChange={(e) => setDiscountRequestType(e.target.value)}
                                                        disabled={hasApprovedDiscount}
                                                    />
                                                    No request
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="discountRequestType"
                                                        value="senior"
                                                        checked={discountRequestType === 'senior'}
                                                        onChange={(e) => setDiscountRequestType(e.target.value)}
                                                        disabled={hasApprovedDiscount}
                                                    />
                                                    Senior Citizen
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="discountRequestType"
                                                        value="pwd"
                                                        checked={discountRequestType === 'pwd'}
                                                        onChange={(e) => setDiscountRequestType(e.target.value)}
                                                        disabled={hasApprovedDiscount}
                                                    />
                                                    PWD
                                                </label>
                                            </div>

                                            <div className="form-field">
                                                <label className="field-label" htmlFor="client-discount-id-front">Upload ID Front</label>
                                                <input
                                                    id="client-discount-id-front"
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={hasApprovedDiscount}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        setDiscountIdFrontFile(file || null);
                                                    }}
                                                />
                                            </div>

                                            <div className="form-field">
                                                <label className="field-label" htmlFor="client-discount-id-back">Upload ID Back</label>
                                                <input
                                                    id="client-discount-id-back"
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={hasApprovedDiscount}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        setDiscountIdBackFile(file || null);
                                                    }}
                                                />
                                            </div>

                                            <div className="discount-status-action-row">
                                                <p className="discount-status-message">
                                                    {hasApprovedDiscount
                                                        ? `Approved: ${discountLabel} discount is active. Request is now locked.`
                                                        : hasPendingRequest
                                                            ? `Pending: ${discountLabel} request is waiting for admin review.`
                                                            : 'No active discount request.'}
                                                </p>

                                                <button
                                                    type="button"
                                                    className="btn-primary discount-confirm-btn"
                                                    onClick={handleDiscountRequestConfirm}
                                                    disabled={hasApprovedDiscount || discountLoading}
                                                >
                                                    {discountLoading ? 'Confirming...' : 'Confirm'}
                                                </button>
                                            </div>

                                            <p className="discount-file-note">
                                                Upload both the front and back images of your ID, then click Confirm to submit the request.
                                            </p>
                                        </div>
                                    );
                                })()}

                                <div className="password-section">
                                    <h4>Change Password</h4>
                                    <div className="password-row">
                                        <div className="password-input-wrap">
                                            <label className="field-label" htmlFor="client-old-password">Old Password</label>
                                            <input
                                                id="client-old-password"
                                                type={showOldPassword ? 'text' : 'password'}
                                                name="oldPassword"
                                                placeholder="Old Password"
                                                onChange={handlePasswordEditChange}
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowOldPassword((prev) => !prev)}>
                                                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <div className="password-input-wrap">
                                            <label className="field-label" htmlFor="client-new-password">New Password</label>
                                            <input
                                                id="client-new-password"
                                                type={showNewPassword ? 'text' : 'password'}
                                                name="newPassword"
                                                placeholder="New Password"
                                                onChange={handlePasswordEditChange}
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowNewPassword((prev) => !prev)}>
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <div className="password-input-wrap">
                                            <label className="field-label" htmlFor="client-confirm-password">Confirm Password</label>
                                            <input
                                                id="client-confirm-password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                placeholder="Confirm Password"
                                                onChange={handlePasswordEditChange}
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {passwordEdit.newPassword && (
                                            <div style={{ marginTop: '10px', padding: '0 10px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', fontSize: '0.75rem', color: 'white' }}>
                                                    <div style={{ opacity: passwordRequirements.length ? 1 : 0.5 }}>✓ 8+ Chars</div>
                                                    <div style={{ opacity: passwordRequirements.upper ? 1 : 0.5 }}>✓ Uppercase</div>
                                                    <div style={{ opacity: passwordRequirements.lower ? 1 : 0.5 }}>✓ Lowercase</div>
                                                    <div style={{ opacity: passwordRequirements.number ? 1 : 0.5 }}>✓ Number</div>
                                                    <div style={{ opacity: passwordRequirements.symbol ? 1 : 0.5 }}>✓ Symbol</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="modal-actions modal-actions-top">
                                    <button type="button" className="btn-logout" onClick={handleLogout}>
                                        <LogOut size={16} /> Logout
                                    </button>
                                    <button type="button" className="btn-secondary" onClick={() => setShowProfileModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={profileLoading || passwordLoading}>
                                        {profileLoading || passwordLoading ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCatalog;
