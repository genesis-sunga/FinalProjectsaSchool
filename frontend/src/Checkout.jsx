import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { User, ArrowLeft } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, subtotal, discountedSubtotal, discountAmount, discountRate, tax, total } = location.state || {};
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('/isda_bg.png');
    
    const user = JSON.parse(localStorage.getItem('user'));
    const [formData, setFormData] = useState({
        firstName: user?.first_name || '',
        middleName: user?.middle_name || '',
        lastName: user?.last_name || '',
        suffix: user?.suffix || '',
        email: user?.email || '',
        phone: user?.contact_number || '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBackground = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/background-settings');
                const setting = Array.isArray(res.data)
                    ? res.data.find((item) => item.setting_name === 'client_background')
                    : null;
                setBackgroundImageUrl(setting?.setting_value || '/isda_bg.png');
            } catch {
                setBackgroundImageUrl('/isda_bg.png');
            }
        };

        fetchBackground();
    }, []);

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="checkout-container">
                <div className="error-message">
                    <p>No items to checkout. <button onClick={() => navigate('/catalog')}>Go to catalog</button></p>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            Swal.fire({
                title: 'Error',
                text: 'Please fill in all required fields',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            Swal.fire({
                title: 'Error',
                text: 'Please enter a valid email',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/orders', {
                userId: user.user_id,
                items: cartItems,
                totalAmount: total,
                shippingAddress: user?.address || 'N/A',
                paymentMethod: 'cash_on_store'
            });

            if (response.data.orderId) {
                const placedOrderNumber = response.data.orderNumber || String(response.data.orderId).padStart(3, '0');
                Swal.fire({
                    title: 'Order Successful!',
                    text: `Order #${placedOrderNumber} has been placed. Please proceed to the store to pay and claim your products.`,
                    icon: 'success',
                    confirmButtonColor: '#2563eb'
                }).then(() => {
                    navigate('/order-info');
                });
            }
        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: err.response?.data?.message || 'Failed to place order',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="checkout-container"
            style={{ backgroundImage: `linear-gradient(rgba(11, 31, 42, 0.32), rgba(11, 31, 42, 0.32)), url('${backgroundImageUrl}')` }}
        >
            <div className="checkout-header glass-panel">
                <div className="checkout-header-left">
                    <button
                        className="back-button"
                        onClick={() => navigate('/cart')}
                        type="button"
                    >
                        <ArrowLeft size={20} />
                        Back to Cart
                    </button>
                </div>

                <h1>Checkout</h1>

                <div className="checkout-header-right" />
            </div>

            <div className="checkout-content">
                <form className="checkout-form" onSubmit={handleSubmit}>
                    <section className="form-section">
                        <h2><User size={20} /> User Information</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Middle Name (Optional)</label>
                                <input
                                    type="text"
                                    name="middleName"
                                    value={formData.middleName}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Last Name *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Suffix (Optional)</label>
                                <input
                                    type="text"
                                    name="suffix"
                                    value={formData.suffix}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <section className="order-summary order-summary-inline">
                        <h2>Order Summary</h2>

                        <div className="summary-items">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="summary-item">
                                    <div className="item-info">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-qty">Qty: {item.quantity}</span>
                                    </div>
                                    <span className="item-total">₱{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="summary-breakdown">
                            <div className="breakdown-row">
                                <span>Subtotal:</span>
                                <span>₱{subtotal.toFixed(2)}</span>
                            </div>
                            {discountRate > 0 && (
                                <div className="breakdown-row discount">
                                    <span>Discount ({(discountRate * 100).toFixed(0)}%):</span>
                                    <span>-₱{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="breakdown-row">
                                <span>Discounted Subtotal:</span>
                                <span>₱{discountedSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="breakdown-row total">
                                <span>Total:</span>
                                <span>₱{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    <section className="form-section payment-section">
                        <h2>Payment Method</h2>
                        <div className="payment-notice">
                            <p><strong>Store Payment Only:</strong> Payment is completed at the physical store.</p>
                            <p>Please proceed to the store to pay and claim your products after placing your order.</p>
                        </div>
                    </section>

                    <button
                        type="submit"
                        className="btn-place-order"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Place Order'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
