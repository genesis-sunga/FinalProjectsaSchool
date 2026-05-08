import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ArrowLeft, ChevronDown, Package, Printer, ShoppingCart, X } from 'lucide-react';
import './OrderHistory.css';

const ACTIVE_ORDER_STATUSES = new Set(['pending', 'processing']);

const formatCurrency = (value) => `PHP ${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return date.toLocaleString();
};

const formatOrderNumber = (order) => {
    const value = Number(order?.order_number || 0);
    return value > 0 ? String(value).padStart(3, '0') : String(order?.order_id || '').padStart(3, '0');
};

const getStatusLabel = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'pending') return 'Pending Store Payment';
    if (normalized === 'processing') return 'Ready for Pick-up';
    return normalized || 'Unknown';
};

const OrderHistory = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = user?.user_id;

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orderItemsById, setOrderItemsById] = useState({});
    const [itemsLoadingById, setItemsLoadingById] = useState({});
    const [clientTheme, setClientTheme] = useState({
        pageBg: '#e9f7f6',
        cardBg: '#ffffff',
        panelBg: '#f8fcfc',
        softBg: '#dff4f2'
    });

    useEffect(() => {
        if (!userId) {
            navigate('/');
            return;
        }

        fetchOrders();
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

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/${userId}`);
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch {
            Swal.fire('Error', 'Failed to load order information', 'error');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const activeOrders = useMemo(() => {
        return (orders || []).filter((order) => ACTIVE_ORDER_STATUSES.has(String(order.status || '').toLowerCase()));
    }, [orders]);

    const toggleOrder = async (orderId) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            return;
        }

        setExpandedOrderId(orderId);

        if (orderItemsById[orderId]) return;

        setItemsLoadingById((prev) => ({ ...prev, [orderId]: true }));
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/${orderId}/items`);
            setOrderItemsById((prev) => ({ ...prev, [orderId]: Array.isArray(res.data) ? res.data : [] }));
        } catch {
            Swal.fire('Error', 'Failed to load order details', 'error');
            setOrderItemsById((prev) => ({ ...prev, [orderId]: [] }));
        } finally {
            setItemsLoadingById((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    const handlePrintInvoice = (orderId) => {
        const url = `http://localhost:5000/api/orders/${orderId}/invoice-pdf?userId=${userId}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCancelOrder = async (orderId) => {
        const confirmResult = await Swal.fire({
            title: 'Request Order Cancellation?',
            text: 'Your cancellation request will be sent to the store for approval. You will be notified once it is reviewed.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, request cancellation',
            cancelButtonText: 'Keep order',
            confirmButtonColor: '#dc2626'
        });

        if (!confirmResult.isConfirmed) return;

        try {
            await axios.post(`http://localhost:5000/api/orders/${orderId}/cancel`, 
                { userId, reason: 'Customer requested cancellation' }
            );

            Swal.fire({
                title: 'Request Submitted',
                text: 'Your cancellation request has been sent to the store. The worker/admin will review and notify you of the decision.',
                icon: 'success',
                confirmButtonColor: '#2563eb'
            });

            fetchOrders();
        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: err.response?.data?.message || 'Failed to submit cancellation request',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    return (
        <div
            className="order-history-container"
            style={{
                '--client-page-bg': clientTheme.pageBg,
                '--client-card-bg': clientTheme.cardBg,
                '--client-panel-bg': clientTheme.panelBg,
                '--client-soft-bg': clientTheme.softBg
            }}
        >
            <div className="order-header glass-panel">
                <div className="order-header-left">
                    <button className="back-button" onClick={() => navigate('/catalog')} type="button" title="Back to Catalog">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <h1 className="order-header-title">Order Information</h1>

                <div className="order-header-right">
                    <button
                        className="order-header-cart-button"
                        onClick={() => navigate('/cart')}
                        type="button"
                        title="Go to Shopping Cart"
                    >
                        <ShoppingCart size={20} />
                    </button>
                </div>
            </div>

            <div className="orders-panel">
                {loading ? (
                    <div className="empty-state">Loading order information...</div>
                ) : activeOrders.length === 0 ? (
                    <div className="empty-state">
                        <Package size={54} />
                        <h2>No Active Store-Payment Orders</h2>
                        <p>Your paid, cancelled, or completed orders are excluded here.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {activeOrders.map((order) => {
                            const isExpanded = expandedOrderId === order.order_id;
                            const isItemsLoading = Boolean(itemsLoadingById[order.order_id]);
                            const items = orderItemsById[order.order_id] || [];

                            return (
                                <div key={order.order_id} className="order-card">
                                    <button
                                        className="order-summary-header"
                                        type="button"
                                        onClick={() => toggleOrder(order.order_id)}
                                    >
                                        <div className="summary-left">
                                            <div className="order-id">Order #{formatOrderNumber(order)}</div>
                                            <div className="order-date">Placed: {formatDate(order.created_at)}</div>
                                        </div>
                                        <div className="summary-center">
                                            <span className="status-pill">{getStatusLabel(order.status)}</span>
                                        </div>
                                        <div className="summary-right">
                                            <strong>{formatCurrency(order.total_amount)}</strong>
                                            <ChevronDown size={20} className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="order-details">
                                            <div className="details-header-row">
                                                <h3>Order Details</h3>
                                                <div className="details-actions-group">
                                                    <button
                                                        className="print-btn"
                                                        type="button"
                                                        onClick={() => handlePrintInvoice(order.order_id)}
                                                    >
                                                        <Printer size={16} />
                                                        Open Invoice PDF
                                                    </button>
                                                    <button
                                                        className="cancel-order-btn"
                                                        type="button"
                                                        onClick={() => handleCancelOrder(order.order_id)}
                                                        title="Request order cancellation"
                                                    >
                                                        <X size={16} />
                                                        Cancel Order
                                                    </button>
                                                </div>
                                            </div>

                                            {isItemsLoading ? (
                                                <p className="details-loading">Loading items...</p>
                                            ) : items.length === 0 ? (
                                                <p className="details-loading">No order items found.</p>
                                            ) : (
                                                <div className="items-list">
                                                    {items.map((item) => (
                                                        <div className="item-row" key={item.order_item_id}>
                                                            <img
                                                                src={item.image_url || 'https://via.placeholder.com/64'}
                                                                alt={item.name}
                                                            />
                                                            <div className="item-meta">
                                                                <div className="item-name">{item.name}</div>
                                                                <div>Qty: {item.quantity}</div>
                                                                <div>Unit: {formatCurrency(item.price)}</div>
                                                            </div>
                                                            <div className="item-total">
                                                                {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
