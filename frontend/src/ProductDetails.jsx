import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShoppingCart, ArrowLeft, Minus, Plus, X } from 'lucide-react';
import { toAssetUrl } from './apiConfig';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [clientTheme, setClientTheme] = useState({
        pageBg: '#e9f7f6',
        cardBg: '#ffffff',
        panelBg: '#f8fcfc',
        softBg: '#dff4f2'
    });
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    
    const userId = JSON.parse(localStorage.getItem('user'))?.user_id || null;

    const showLoginPrompt = (message = 'Please login or create an account to continue.') => {
        Swal.fire({
            title: 'Login Required',
            text: message,
            icon: 'info',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Login',
            denyButtonText: 'Sign Up',
            cancelButtonText: 'Not Now',
            confirmButtonColor: '#09609c',
            denyButtonColor: '#0ea5a8'
        }).then((result) => {
            if (result.isConfirmed) {
                navigate('/login');
            } else if (result.isDenied) {
                navigate('/signup');
            }
        });
    };

    useEffect(() => {
        fetchProduct();
        fetchClientTheme();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/products/${id}`);
            setProduct(res.data);
        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: 'Product not found',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
            navigate('/catalog');
        } finally {
            setLoading(false);
        }
    };

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
        } catch {
            setClientTheme({
                pageBg: '#e9f7f6',
                cardBg: '#ffffff',
                panelBg: '#f8fcfc',
                softBg: '#dff4f2'
            });
        }
    };

    const handleAddToCart = async () => {
        if (!userId) {
            showLoginPrompt('Please login or sign up before adding products to your cart.');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/cart', {
                userId,
                productId: product.product_id,
                quantity
            });

            Swal.fire({
                title: 'Success!',
                text: `${quantity} × ${product.name} added to cart`,
                icon: 'success',
                confirmButtonColor: '#2563eb',
                timer: 1500
            });

            setQuantity(1);
        } catch (err) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to add to cart',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        }
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    if (!product) {
        return <div className="loading-container">Product not found</div>;
    }

    const isDiscontinued = Boolean(product.is_deleted);
    const isOutOfStock = !isDiscontinued && Number(product.stock || 0) <= 0;
    const isUnavailable = isDiscontinued || isOutOfStock;
    const availabilityLabel = isDiscontinued ? 'Discontinued' : isOutOfStock ? 'Out of stock' : `${product.stock} in stock`;
    const productImageUrl = toAssetUrl(product.image_url);
    const descriptionSections = String(product.description || '')
        .split(/\n\s*\n/)
        .map((section) => section.trim())
        .filter(Boolean);

    return (
        <div
            className="product-details-container"
            style={{
                '--client-page-bg': clientTheme.pageBg,
                '--client-card-bg': clientTheme.cardBg,
                '--client-panel-bg': clientTheme.panelBg,
                '--client-soft-bg': clientTheme.softBg
            }}
        >
            <div className="product-details-header glass-panel">
                <div className="product-details-header-left">
                    <button 
                        className="back-button"
                        onClick={() => navigate('/catalog')}
                        title="Back to Catalog"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </div>

                <h1>TongTong Fish Culture</h1>

                <div className="product-details-header-right">
                    <button
                        className="cart-shortcut-button"
                        onClick={() => {
                            if (!userId) {
                                showLoginPrompt('Please login or sign up to view your cart.');
                                return;
                            }
                            navigate('/cart');
                        }}
                        title="Go to cart"
                        aria-label="Go to cart"
                    >
                        <ShoppingCart size={20} />
                    </button>
                </div>
            </div>

            <div className="product-details-panel">
                <div className="details-content">
                    <div className="media-column">
                        <div className="image-section">
                            <button
                                type="button"
                                className="image-view-trigger"
                                onClick={() => setIsImageViewerOpen(true)}
                                aria-label="Open product image preview"
                            >
                                <img 
                                    src={productImageUrl || 'https://via.placeholder.com/500'} 
                                    alt={product.name}
                                    className={`product-main-image ${isUnavailable ? 'is-unavailable' : ''}`}
                                />
                            </button>
                            {isUnavailable && (
                                <div className={`out-of-stock-overlay ${isDiscontinued ? 'discontinued' : ''}`}>
                                    {availabilityLabel.toUpperCase()}
                                </div>
                            )}
                        </div>

                        {!isUnavailable ? (
                            <div className="purchase-section">
                                <div className="quantity-selector">
                                    <label>Quantity:</label>
                                    <div className="quantity-controls">
                                        <button 
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1}
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <input 
                                            type="number" 
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            min="1"
                                            max={product.stock}
                                        />
                                        <button 
                                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                            disabled={quantity >= product.stock}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    className="add-to-cart-btn"
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCart size={20} />
                                    Add to Cart
                                </button>
                            </div>
                        ) : (
                            <div className="purchase-section">
                                <div className="out-of-stock" style={{ fontWeight: 700 }}>
                                    {isDiscontinued
                                        ? 'This product is discontinued and cannot be added to cart.'
                                        : 'This product is currently out of stock and cannot be added to cart.'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="info-section">
                        <div className="category-badge">{product.category}</div>
                        <h1>{product.name}</h1>
                        <div className="price-section">
                            <span className="price">₱{product.price}</span>
                            <span className="stock-info">
                                {!isUnavailable ? (
                                    <span className="in-stock">✓ {product.stock} in stock</span>
                                ) : (
                                    <span className={isDiscontinued ? 'discontinued' : 'out-of-stock'}>{availabilityLabel}</span>
                                )}
                            </span>
                        </div>
                        <div className="specifications">
                            <h3>Specifications</h3>
                            <ul>
                                <li><strong>Type:</strong> Pet Fish</li>
                                <li><strong>Category:</strong> {product.category}</li>
                                <li><strong>Availability:</strong> {availabilityLabel}</li>
                            </ul>
                        </div>

                        <div className="description-section">
                            <h3>Description</h3>
                            <div className="description-content">
                                {descriptionSections.length > 0 ? (
                                    descriptionSections.map((section, index) => (
                                        <p key={index}>{section}</p>
                                    ))
                                ) : (
                                    <p>{product.description}</p>
                                )}
                            </div>
                        </div>

                        {product.pet_care_content && !isDiscontinued && (
                            <div className="pet-care-section">
                                <h3>🐠 Pet Care Guide</h3>
                                <div className="pet-care-content">
                                    {product.pet_care_content.split('\n').map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isImageViewerOpen && (
                <div
                    className="image-view-overlay"
                    onClick={() => setIsImageViewerOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Product image preview"
                >
                    <button
                        type="button"
                        className="image-view-close"
                        onClick={() => setIsImageViewerOpen(false)}
                        aria-label="Close image preview"
                    >
                        <X size={20} />
                    </button>
                    <img
                        src={productImageUrl || 'https://via.placeholder.com/1200'}
                        alt={product.name}
                        className="image-view-preview"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
