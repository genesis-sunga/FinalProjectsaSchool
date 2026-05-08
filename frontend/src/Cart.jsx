import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Trash2, Plus, Minus, ShoppingCart, Package, ArrowLeft } from 'lucide-react';
import './Cart.css';

const formatOrderNumber = (order) => {
    const value = Number(order?.order_number || 0);
    return value > 0 ? String(value).padStart(3, '0') : String(order?.order_id || '').padStart(3, '0');
};

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [clientTheme, setClientTheme] = useState({
        pageBg: '#e9f7f6',
        cardBg: '#ffffff',
        panelBg: '#f8fcfc',
        softBg: '#dff4f2'
    });
    const [previousOrders, setPreviousOrders] = useState([]);
    const [previousOrderItemsById, setPreviousOrderItemsById] = useState({});
    const [selectedPreviousItemKeys, setSelectedPreviousItemKeys] = useState({});
    const [reorderLoading, setReorderLoading] = useState(false);
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.user_id;

    useEffect(() => {
        if (!userId) {
            navigate('/');
            return;
        }
        fetchCart();
        fetchUserProfile();
        fetchPreviousOrders();
        fetchClientTheme();
    }, [userId]);

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

    const fetchUserProfile = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/user-profile/${userId}`);
            setUserProfile(res.data);
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }
    };

    const fetchCart = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/cart/${userId}`);
            setCartItems(res.data);
        } catch (err) {
            console.error('Error fetching cart:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreviousOrders = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/${userId}`);
            const historicalOrders = (Array.isArray(res.data) ? res.data : [])
                .filter((order) => ['completed', 'delivered'].includes(String(order.status || '').toLowerCase()))
                .slice(0, 6);

            setPreviousOrders(historicalOrders);
            setSelectedPreviousItemKeys({});

            const itemPairs = await Promise.all(historicalOrders.map(async (order) => {
                try {
                    const itemsRes = await axios.get(`http://localhost:5000/api/orders/${order.order_id}/items`);
                    return [order.order_id, Array.isArray(itemsRes.data) ? itemsRes.data : []];
                } catch {
                    return [order.order_id, []];
                }
            }));

            setPreviousOrderItemsById(Object.fromEntries(itemPairs));
        } catch {
            setPreviousOrders([]);
            setPreviousOrderItemsById({});
            setSelectedPreviousItemKeys({});
        }
    };

    const handleUpdateQuantity = async (cartId, quantity) => {
        if (quantity < 1) return;
        
        try {
            await axios.put(`http://localhost:5000/api/cart/${cartId}`, { quantity });
            fetchCart();
        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to update quantity',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    const handleRemoveItem = async (cartId) => {
        try {
            await axios.delete(`http://localhost:5000/api/cart/${cartId}`);
            fetchCart();
            Swal.fire({
                title: 'Removed',
                text: 'Item removed from cart',
                icon: 'success',
                timer: 1500,
                confirmButtonColor: '#2563eb'
            });
        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to remove item',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const hasApprovedDiscount = userProfile && (
        (Number(userProfile.is_senior) === 1 && Number(userProfile.senior_verified) === 1) ||
        (Number(userProfile.is_pwd) === 1 && Number(userProfile.pwd_verified) === 1)
    );
    const discountRate = hasApprovedDiscount ? 0.05 : 0;
    const discountAmount = calculateSubtotal() * discountRate;
    const discountedSubtotal = calculateSubtotal() - discountAmount;

    const shippingFee = 0;
    const tax = 0;
    const total = discountedSubtotal + shippingFee;

    const handleCheckout = () => {
        navigate('/checkout', { 
            state: { cartItems, subtotal: calculateSubtotal(), discountedSubtotal, discountAmount, discountRate, shippingFee, tax, total } 
        });
    };

    const handleReorderItems = async (items) => {
        const availableItems = (items || []).filter((item) => Number(item.product_id) > 0 && Number(item.quantity || 0) > 0);

        if (availableItems.length === 0) {
            Swal.fire('No Products', 'This order has no products that can be reordered.', 'info');
            return;
        }

        setReorderLoading(true);
        try {
            await Promise.all(availableItems.map((item) => axios.post('http://localhost:5000/api/cart', {
                userId,
                productId: item.product_id,
                quantity: Number(item.quantity || 1)
            })));

            await fetchCart();
            setSelectedPreviousItemKeys({});
            Swal.fire('Added to Cart', 'Previous order products were added to your cart.', 'success');
        } catch {
            Swal.fire('Error', 'Some products could not be added to cart.', 'error');
        } finally {
            setReorderLoading(false);
        }
    };

    const getPreviousItemKey = (orderId, item) => `${orderId}:${item.order_item_id || item.product_id}`;

    const handlePreviousItemCheck = (orderId, item, checked) => {
        const key = getPreviousItemKey(orderId, item);
        setSelectedPreviousItemKeys((prev) => ({
            ...prev,
            [key]: checked
        }));
    };

    const getSelectedPreviousItems = () => {
        return previousOrders.flatMap((order) => {
            const items = previousOrderItemsById[order.order_id] || [];
            return items.filter((item) => selectedPreviousItemKeys[getPreviousItemKey(order.order_id, item)]);
        });
    };

    const handleReorderSelectedItems = () => {
        const selectedItems = getSelectedPreviousItems();
        if (selectedItems.length === 0) {
            Swal.fire('Select Products', 'Please check at least one previously ordered product to reorder.', 'info');
            return;
        }

        handleReorderItems(selectedItems);
    };

    if (loading) {
        return <div className="loading">Loading cart...</div>;
    }

    return (
        <div
            className="cart-container"
            style={{
                '--client-page-bg': clientTheme.pageBg,
                '--client-card-bg': clientTheme.cardBg,
                '--client-panel-bg': clientTheme.panelBg,
                '--client-soft-bg': clientTheme.softBg
            }}
        >
            <div className="cart-header glass-panel">
                <div className="cart-header-left">
                    <button
                        className="back-button"
                        onClick={() => navigate('/catalog')}
                        type="button"
                        title="Back to Catalog"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <h1>Shopping Cart</h1>

                <div className="cart-header-right">
                    <button
                        className="order-info-button"
                        onClick={() => navigate('/order-info')}
                        type="button"
                        title="Order Info"
                    >
                        <Package size={20} />
                    </button>
                </div>
            </div>

            {cartItems.length === 0 ? (
                <div className="empty-cart">
                    <ShoppingCart size={64} />
                    <h2>Your cart is empty</h2>
                    <p>Add some wonderful fish to get started!</p>
                    <button 
                        className="btn-continue-shopping"
                        onClick={() => navigate('/catalog')}
                    >
                        Browse Products
                    </button>
                </div>
            ) : (
                <div className="cart-checkout-panel modern-cart-panel">
                    <div className="cart-meta-row">
                        <span>You have {cartItems.length} product{cartItems.length > 1 ? 's' : ''} in your cart</span>
                        <span>In-store payment only</span>
                    </div>

                    <div className="cart-items modern-cart-items">
                        <div className="items-header modern-items-header">
                            <span>Product</span>
                            <span>Price</span>
                            <span>Quantity</span>
                            <span>Total</span>
                        </div>

                        {cartItems.map(item => (
                            <div key={item.cart_id} className="cart-item modern-cart-item">
                                <div className="item-product modern-item-product">
                                    <img src={item.image_url || 'https://via.placeholder.com/80'} alt={item.name} />
                                    <div className="product-info">
                                        <h4>{item.name}</h4>
                                        <p>Category: {item.category || 'General'}</p>
                                        <p>Price: ₱{Number(item.price).toFixed(2)}</p>
                                        <p className="stock-note">● In Stock ({item.stock} Pcs)</p>
                                    </div>
                                </div>

                                <div className="item-price modern-item-price">₱{Number(item.price).toFixed(2)}</div>

                                <div className="item-quantity-with-remove">
                                    <div className="item-quantity modern-item-quantity">
                                        <button
                                            onClick={() => handleUpdateQuantity(item.cart_id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateQuantity(item.cart_id, parseInt(e.target.value, 10) || 1)}
                                            min="1"
                                            max={item.stock}
                                        />
                                        <button
                                            onClick={() => handleUpdateQuantity(item.cart_id, item.quantity + 1)}
                                            disabled={item.quantity >= item.stock}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        className="btn-remove-beside-quantity"
                                        onClick={() => handleRemoveItem(item.cart_id)}
                                        title="Remove item"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="item-subtotal modern-item-total">₱{(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>

                    <div className="modern-cart-footer">
                        <div className="modern-cart-totals">
                            <div className="subtotal-main">Sub Total: ₱{discountedSubtotal.toFixed(2)}</div>
                            <div className="subtotal-note">Final subtotal</div>
                            {discountRate > 0 && (
                                <div className="footer-mini-note">Discount ({(discountRate * 100).toFixed(0)}%): -₱{discountAmount.toFixed(2)}</div>
                            )}
                            <div className="footer-total">Total: ₱{total.toFixed(2)}</div>
                        </div>

                        <div className="modern-cart-actions">
                            <button
                                className="btn-continue modern-btn-continue"
                                onClick={() => navigate('/catalog')}
                            >
                                Continue Shopping
                            </button>

                            <button
                                className="btn-checkout modern-btn-checkout"
                                onClick={handleCheckout}
                            >
                                Go to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="previous-orders-panel">
                <div className="previous-orders-header">
                    <div>
                        <h2>Previously Ordered Products</h2>
                        <p>Check only the products you want to add back to your cart.</p>
                    </div>
                    <button
                        type="button"
                        className="previous-order-add-btn"
                        onClick={handleReorderSelectedItems}
                        disabled={reorderLoading}
                    >
                        {reorderLoading ? 'Adding...' : 'Add Selected to Cart'}
                    </button>
                </div>

                {previousOrders.length === 0 ? (
                    <p className="previous-orders-empty">No completed previous orders found yet.</p>
                ) : (
                    <div className="previous-orders-list">
                        {previousOrders.map((order) => {
                            const items = previousOrderItemsById[order.order_id] || [];
                            return (
                                <div key={order.order_id} className="previous-order-card">
                                    <div className="previous-order-card-top">
                                        <div>
                                            <strong>Order #{formatOrderNumber(order)}</strong>
                                            <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="previous-order-products">
                                        {items.length === 0 ? (
                                            <span className="previous-order-no-items">No items found.</span>
                                        ) : items.map((item) => {
                                            const key = getPreviousItemKey(order.order_id, item);
                                            return (
                                                <label className="previous-order-product" key={key}>
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(selectedPreviousItemKeys[key])}
                                                        onChange={(e) => handlePreviousItemCheck(order.order_id, item, e.target.checked)}
                                                    />
                                                    <img src={item.image_url || 'https://via.placeholder.com/56'} alt={item.name} />
                                                    <div>
                                                        <strong>{item.name}</strong>
                                                        <span>Qty {item.quantity} | ₱{Number(item.price || 0).toFixed(2)}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
