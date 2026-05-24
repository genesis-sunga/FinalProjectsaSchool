// --- ACCOUNT MANAGEMENT & LOW STOCK ROUTES MOVED BELOW APP INITIALIZATION ---
require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
// --- ROUTES MOVED BELOW APP INITIALIZATION ---
// JWT authentication middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-only-jwt-secret');

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production.');
}

const PORT = Number(process.env.PORT || 5000);
const APP_BASE_URL = (process.env.APP_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true
}));
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

function resolveFrontendDistPath() {
    const possibleDistPaths = [
        path.join(__dirname, 'public'),
        path.join(__dirname, '..', 'frontend', 'dist')
    ];

    return possibleDistPaths.find((distPath) => fs.existsSync(path.join(distPath, 'index.html')));
}

const invoiceUploadDir = path.join(uploadDir, 'invoices');
if (!fs.existsSync(invoiceUploadDir)) {
    fs.mkdirSync(invoiceUploadDir, { recursive: true });
}

// Serve uploaded files as static
app.use('/uploads', express.static(uploadDir));

function buildInvoicePdf(order, customer, items, invoiceNumber, filePath, meta = {}) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filePath);

        const issuedBy = (meta.issuedBy || order.issued_by_name || '').trim() || 'Not specified';
        const paidBy = (meta.paidBy || order.paid_by_name || '').trim() || 'Not yet paid';

        doc.pipe(stream);

        doc.fontSize(20).text('TongTong Ornamental Fish Store', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).text('Invoice / Store Payment Receipt', { align: 'center' });
        doc.moveDown(1.2);

        doc.fontSize(11).text(`Invoice Number: ${invoiceNumber}`);
        doc.text(`Order Number: ${getOrderDisplayNumber(order)}`);
        doc.text(`Internal Order ID: #${order.order_id}`);
        doc.text(`Customer: ${customer}`);
        doc.text(`Email: ${order.email || '-'}`);
        doc.text(`Contact Number: ${order.contact_number || meta.contactNumber || '-'}`);
        doc.text(`Order Date: ${new Date(order.created_at).toLocaleString()}`);
        doc.text(`Status: ${order.status || 'pending'}`);
        doc.text(`Invoice Prepared By: ${issuedBy}`);
        doc.text(`Payment Confirmed By: ${paidBy}`);
        doc.moveDown(1);

        doc.fontSize(12).text('Order Summary', { underline: true });
        doc.moveDown(0.5);

        let subtotal = 0;
        let totalDiscount = 0;

        items.forEach((item) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            const unitDiscount = Number(item.unit_discount || 0);
            const total = qty * price;
            const discountAmount = qty * unitDiscount;
            subtotal += total;
            totalDiscount += discountAmount;
            const rowY = doc.y;
            doc.fontSize(10).text(`${item.name || 'Item'} x ${qty}`, 50, rowY, { width: 330 });
            doc.text(`PHP ${(total - discountAmount).toFixed(2)}`, 390, rowY, { width: 150, align: 'right' });
            doc.moveDown(0.7);
        });

        doc.moveDown(0.8);
        const discountedTotal = subtotal - totalDiscount;
        doc.fontSize(11).text(`Subtotal: PHP ${subtotal.toFixed(2)}`, { align: 'right' });
        if (totalDiscount > 0) {
            doc.text(`Verified Discount: -PHP ${totalDiscount.toFixed(2)}`, { align: 'right' });
        }
        doc.fontSize(12).text(`Final Total Amount: PHP ${Number(order.total_amount || discountedTotal || 0).toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.8);
        doc.fontSize(10).fillColor('#555').text('Present this invoice as receipt proof when paying in store.', { align: 'left' });

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// --- 1. DATABASE CONNECTION ---
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "db_project",
    port: Number(process.env.DB_PORT || 3306),
    charset: 'utf8mb4' 
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected to MySQL Database.");

    // Legacy cleanup: processing is now treated as pending in order flows.
    db.query("UPDATE orders SET status = 'pending' WHERE status = 'processing'", (statusFixErr) => {
        if (statusFixErr) {
            console.error('Status normalization warning:', statusFixErr.message);
        }
    });

    const schemaUpdates = [
        "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_by_user_id INT NULL AFTER invoice_pdf_path",
        "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_by_name VARCHAR(120) NULL AFTER issued_by_user_id",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_by_user_id INT NULL AFTER payment_method",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_by_name VARCHAR(120) NULL AFTER paid_by_user_id",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number INT NULL AFTER order_id",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_date DATE NULL AFTER order_number",
        "ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500) NULL AFTER pwd_verified",
        "ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS id_front_image_url VARCHAR(500) NULL AFTER id_image_url",
        "ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS id_back_image_url VARCHAR(500) NULL AFTER id_front_image_url"
    ];

    schemaUpdates.forEach((sql) => {
        db.query(sql, (schemaErr) => {
            if (schemaErr) {
                console.error('Schema update warning:', schemaErr.message);
            }
        });
    });
});

// --- 2. ROLE CHECK MIDDLEWARE ---
const checkRole = (requiredRole) => {
    return (req, res, next) => {
        const userId =
            req.body?.userId ||
            req.body?.adminUserId ||
            req.query?.userId ||
            req.query?.adminUserId ||
            req.params?.userId ||
            req.headers['x-user-id'] ||
            req.headers['x-admin-user-id'];
        
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        db.query("SELECT r.role_name FROM user_accounts u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?", 
        [userId], (err, result) => {
            if (err) return res.status(500).json({ message: "Database error" });
            
            if (result.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const userRole = String(result[0].role_name || '');
            const normalizedUserRole = userRole.toLowerCase();
            const canonicalRole = (
                normalizedUserRole === 'worker' ||
                normalizedUserRole === 'staff' ||
                normalizedUserRole === 'employee' ||
                normalizedUserRole === 'moderator'
            )
                ? 'worker'
                : normalizedUserRole;
            
            if (requiredRole && requiredRole !== '*') {
                const allowedRoles = (Array.isArray(requiredRole) ? requiredRole : [requiredRole])
                    .map((role) => String(role).toLowerCase());
                if (!allowedRoles.includes(canonicalRole)) {
                    return res.status(403).json({ message: "Access denied. Insufficient role." });
                }
            }

            req.userRole = canonicalRole;
            next();
        });
    };
};

// --- 3. EMAIL CONFIG ---
const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// Change time kapag mag testing sa school, hihihihi
const LOW_STOCK_DIGEST_HOUR = Number(process.env.LOW_STOCK_DIGEST_HOUR ?? 19);
const LOW_STOCK_DIGEST_MINUTE = Number(process.env.LOW_STOCK_DIGEST_MINUTE ?? 0);
const LOW_STOCK_DIGEST_TIMEZONE = process.env.LOW_STOCK_DIGEST_TIMEZONE || 'Asia/Manila';
const LOW_STOCK_EMAIL_THRESHOLD = 20;
let lastLowStockDigestDate = '';

function getManilaNow() {
    const now = new Date();
    const zonedNow = new Date(now.toLocaleString('en-US', { timeZone: LOW_STOCK_DIGEST_TIMEZONE }));
    return zonedNow;
}

function getDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatOrderNumber(order) {
    const value = Number(order?.order_number || 0);
    return value > 0 ? String(value).padStart(3, '0') : String(order?.order_id || '').padStart(3, '0');
}

function getOrderDate(order) {
    return order?.order_date || order?.created_at || new Date();
}

function getOrderDisplayNumber(order) {
    return `#${formatOrderNumber(order)}`;
}

function buildInvoiceNumber(order) {
    const dateKey = getDateKey(new Date(getOrderDate(order))).replace(/-/g, '');
    return `INV-${dateKey}-${formatOrderNumber(order)}`;
}

function assignDailyOrderNumber(orderId, callback) {
    db.query('SELECT order_id, order_number, created_at FROM orders WHERE order_id = ? LIMIT 1', [orderId], (findErr, rows) => {
        if (findErr) return callback(findErr);
        if (!rows || rows.length === 0) return callback(new Error('Order not found'));

        const order = rows[0];
        if (Number(order.order_number || 0) > 0) return callback(null, order.order_number);

        db.query(
            'SELECT COUNT(*) AS daily_count FROM orders WHERE DATE(created_at) = DATE(?) AND order_id <= ?',
            [order.created_at, orderId],
            (countErr, countRows) => {
                if (countErr) return callback(countErr);

                const nextOrderNumber = Number(countRows?.[0]?.daily_count || 1);
                db.query(
                    'UPDATE orders SET order_number = ?, order_date = DATE(created_at) WHERE order_id = ?',
                    [nextOrderNumber, orderId],
                    (updateErr) => callback(updateErr, nextOrderNumber)
                );
            }
        );
    });
}

function parseAdminEmailsFromEnv() {
    const raw = process.env.ADMIN_EMAILS || '';
    if (!raw.trim()) return [];
    return raw
        .split(',')
        .map((email) => String(email || '').trim().toLowerCase())
        .filter(Boolean);
}

function getAdminEmailsFromDb(callback) {
    const sql = `
        SELECT DISTINCT LOWER(TRIM(u.email)) AS email
        FROM user_accounts u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'admin'
          AND u.is_deleted = 0
          AND u.email IS NOT NULL
          AND TRIM(u.email) <> ''
    `;

    db.query(sql, (err, rows) => {
        if (err) return callback(err);
        const emails = (rows || []).map((row) => row.email).filter(Boolean);
        callback(null, emails);
    });
}

function sendDailyLowStockDigest() {
    const lowStockSql = `
        SELECT product_id, name, category, stock
        FROM products
        WHERE is_deleted = 0
          AND stock <= ?
        ORDER BY stock ASC, name ASC
    `;

    db.query(lowStockSql, [LOW_STOCK_EMAIL_THRESHOLD], (stockErr, lowStockRows) => {
        if (stockErr) {
            console.error('Low-stock digest query error:', stockErr.message);
            return;
        }

        if (!lowStockRows || lowStockRows.length === 0) {
            console.log('Low-stock digest skipped: no low-stock products found.');
            return;
        }

        getAdminEmailsFromDb((adminErr, adminEmailsFromDb) => {
            if (adminErr) {
                console.error('Low-stock digest admin email lookup error:', adminErr.message);
                return;
            }

            const envAdminEmails = parseAdminEmailsFromEnv();
            const recipientSet = new Set([...envAdminEmails, ...adminEmailsFromDb]);
            const recipients = Array.from(recipientSet);

            if (recipients.length === 0) {
                console.warn('Low-stock digest skipped: no admin recipients configured.');
                return;
            }

            const now = getManilaNow();
            const dateLabel = getDateKey(now);
            const rowsHtml = lowStockRows
                .map((item) => `
                    <tr>
                        <td style="padding:8px;border:1px solid #ddd;">${item.product_id}</td>
                        <td style="padding:8px;border:1px solid #ddd;">${item.name || 'Unnamed Product'}</td>
                        <td style="padding:8px;border:1px solid #ddd;">${item.category || '-'}</td>
                        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(item.stock || 0)}</td>
                    </tr>
                `)
                .join('');

            const html = `
                <h2>Daily Low Stock Report</h2>
                <p>Date: <strong>${dateLabel}</strong></p>
                <p>The following products are at or below <strong>${LOW_STOCK_EMAIL_THRESHOLD}</strong> stock.</p>
                <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;">
                    <thead>
                        <tr>
                            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Product ID</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Product Name</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Category</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:right;">Stock</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;

            transporter.sendMail(
                {
                    from: 'tongtongornamental@gmail.com',
                    to: recipients.join(','),
                    subject: `Daily Low Stock Report - ${dateLabel}`,
                    html
                },
                (mailErr) => {
                    if (mailErr) {
                        console.error('Low-stock digest email error:', mailErr.message);
                        return;
                    }
                    console.log(`Low-stock digest sent to ${recipients.join(', ')}.`);
                }
            );
        });
    });
}

function runLowStockDigestIfDue() {
    const now = getManilaNow();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dateKey = getDateKey(now);

    if (hour === LOW_STOCK_DIGEST_HOUR && minute >= LOW_STOCK_DIGEST_MINUTE && lastLowStockDigestDate !== dateKey) {
        lastLowStockDigestDate = dateKey;
        sendDailyLowStockDigest();
    }
}

function startLowStockDigestScheduler() {
    setInterval(runLowStockDigestIfDue, 60 * 1000);
    runLowStockDigestIfDue();
    console.log(
        `Low-stock digest scheduler active at ${LOW_STOCK_DIGEST_HOUR}:${String(LOW_STOCK_DIGEST_MINUTE).padStart(2, '0')} (${LOW_STOCK_DIGEST_TIMEZONE}), threshold <= ${LOW_STOCK_EMAIL_THRESHOLD}`
    );
}

// --- 4. SIGNUP ROUTE (UPDATED with roles) ---
app.post('/api/signup', (req, res) => {
    const { firstName, middleName, lastName, suffix, gender, birthday, contact, address, email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const trimmedFirstName = String(firstName || '').trim();
    const trimmedLastName = String(lastName || '').trim();
    const trimmedAddress = String(address || '').trim();
    const normalizedContact = String(contact || '').replace(/\D/g, '');
    const normalizedGender = String(gender || '').trim();
    const rawSuffix = String(suffix || '').trim();
    const suffixAliases = {
        'JR': 'Jr.',
        'JR.': 'Jr.',
        'SR': 'Sr.',
        'SR.': 'Sr.',
        'II': 'II',
        'III': 'III',
        'IV': 'IV',
        'V': 'V'
    };
    const normalizedSuffix = rawSuffix ? (suffixAliases[rawSuffix.toUpperCase()] || rawSuffix) : '';

    if (!trimmedFirstName || !trimmedLastName || !normalizedGender || !birthday || !normalizedContact || !trimmedAddress || !normalizedEmail || !password) {
        return res.status(400).json({ message: 'Please fill out all required fields.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    const meetsPasswordRules =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[@#$%^&*\-_+=!?]/.test(password);
    if (!meetsPasswordRules) {
        return res.status(400).json({ message: 'Password must have 8+ chars, uppercase, lowercase, number, and symbol (@#$%^&*-_+=!?).' });
    }

    if (!/^09\d{9}$/.test(normalizedContact)) {
        return res.status(400).json({ message: 'Invalid contact number. Use 11 digits starting with 09.' });
    }

    const allowedGenders = ['Male', 'Female', 'Prefer not to say'];
    if (!allowedGenders.includes(normalizedGender)) {
        return res.status(400).json({ message: 'Invalid gender selection.' });
    }

    const allowedSuffixes = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];
    if (!allowedSuffixes.includes(normalizedSuffix)) {
        return res.status(400).json({ message: 'Invalid suffix selection.' });
    }

    const birthdayDate = new Date(birthday);
    if (Number.isNaN(birthdayDate.getTime())) {
        return res.status(400).json({ message: 'Invalid birthday.' });
    }

    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 18);
    if (birthdayDate < minDate || birthdayDate > maxDate) {
        return res.status(400).json({ message: 'You must be at least 18 years old to sign up.' });
    }

    const formattedDate = birthdayDate.toISOString().split('T')[0];

    db.query("SELECT * FROM user_accounts WHERE email = ? AND is_deleted = 0", [normalizedEmail], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length > 0) return res.status(400).json({ message: "Email already exists" });

        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes
        const roleId = 1; // Default role is 'customer' (role_id = 1)

        // Hash the password
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) return res.status(500).json({ message: "Password hashing failed" });

            const sql = `INSERT INTO user_accounts 
                (first_name, middle_name, last_name, suffix, gender, email, password, birthday, address, contact_number, is_verified, otp, otp_expires_at, role_id, is_deleted) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0)`;

            db.query(sql, [trimmedFirstName, middleName, trimmedLastName, normalizedSuffix, normalizedGender, normalizedEmail, hashedPassword, formattedDate, trimmedAddress, normalizedContact, otpCode, expiresAt, roleId], (insErr) => {
                if (insErr) return res.status(500).json({ message: "Registration failed" });

                transporter.sendMail({
                    from: '"TongTong Fish Culture"',
                    to: normalizedEmail,
                    subject: 'Verify Your Account',
                    text: `Your verification code is: ${otpCode}`
                });
                res.json({ message: "OTP sent!" });
            });
        });
    });
});

// --- 5. VERIFY ACCOUNT (New route for Verification.jsx) ---
app.post('/api/verify-account', (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    
    const sql = "SELECT * FROM user_accounts WHERE email = ? AND otp = ? AND otp_expires_at > NOW() AND is_deleted = 0";
    
    db.query(sql, [normalizedEmail, otp], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        
        if (result.length > 0) {
            // Mark as verified and clear OTP
            db.query("UPDATE user_accounts SET is_verified = 1, otp = NULL, otp_expires_at = NULL WHERE email = ?", [normalizedEmail], (updErr) => {
                if (updErr) return res.status(500).json({ message: "Update error" });
                res.json({ message: "Account verified successfully!" });
            });
        } else {
            res.status(400).json({ message: "Invalid or Expired OTP" });
        }
    });
});

// --- 5. RESEND OTP (New route for Verification.jsx) ---
app.post('/api/resend-otp', (req, res) => {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    db.query("UPDATE user_accounts SET otp = ?, otp_expires_at = ? WHERE email = ? AND is_deleted = 0", 
    [otpCode, expiresAt, normalizedEmail], (err, result) => {
        if (err || result.affectedRows === 0) return res.status(404).json({ message: "Account not found" });

        transporter.sendMail({
            from: '"TongTong Fish Culture"',
            to: normalizedEmail,
            subject: 'New Verification Code',
            text: `Your new code is: ${otpCode}`
        });
        res.json({ message: "New OTP sent" });
    });
});

// --- 7. LOGIN ROUTE (UPDATED with role info) ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const sql = "SELECT u.*, r.role_name FROM user_accounts u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.email = ? AND u.is_deleted = 0";
    
    db.query(sql, [normalizedEmail], (err, result) => {
        if (err) return res.status(500).json({ message: "Server error" });
        if (result.length === 0) return res.status(401).json({ message: "Invalid credentials" });
        
        const user = result[0];
        
        // Compare password with stored hash
        bcrypt.compare(password, user.password, (compareErr, isMatch) => {
            if (compareErr) return res.status(500).json({ message: "Password comparison failed" });
            if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
            
            if (user.is_verified === 0) return res.status(403).json({ message: "Unverified" });

            const sessionToken = crypto.randomBytes(24).toString('hex');
            const ipAddress = req.headers['x-forwarded-for']?.split(',')?.[0]?.trim() || req.socket?.remoteAddress || null;
            const userAgent = req.headers['user-agent'] || null;

            const logSql = `
                INSERT INTO user_session_logs (user_id, email, role_name, login_at, login_success, ip_address, user_agent, session_token)
                VALUES (?, ?, ?, NOW(), 1, ?, ?, ?)
            `;

            db.query(
                logSql,
                [user.user_id, normalizedEmail, user.role_name || null, ipAddress, userAgent, sessionToken],
                (logErr, logResult) => {
                    if (logErr) {
                        console.error('Login log insert error:', logErr);
                        return res.json({ message: "Success", user: user });
                    }

                    res.json({
                        message: "Success",
                        user: user,
                        sessionLogId: logResult.insertId,
                        sessionToken
                    });
                }
            );
        });
    });
});

// --- 7A. LOGOUT ROUTE WITH SESSION LOG UPDATE ---
app.post('/api/logout', (req, res) => {
    const { userId, sessionLogId, sessionToken } = req.body || {};

    if (sessionLogId) {
        const byIdSql = `
            UPDATE user_session_logs
            SET logout_at = NOW()
            WHERE log_id = ?
              AND logout_at IS NULL
        `;

        return db.query(byIdSql, [sessionLogId], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            return res.json({ message: 'Logout logged' });
        });
    }

    if (sessionToken) {
        const byTokenSql = `
            UPDATE user_session_logs
            SET logout_at = NOW()
            WHERE session_token = ?
              AND logout_at IS NULL
        `;

        return db.query(byTokenSql, [sessionToken], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            return res.json({ message: 'Logout logged' });
        });
    }

    if (userId) {
        const byUserSql = `
            UPDATE user_session_logs
            SET logout_at = NOW()
            WHERE user_id = ?
              AND logout_at IS NULL
            ORDER BY login_at DESC
            LIMIT 1
        `;

        return db.query(byUserSql, [userId], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            return res.json({ message: 'Logout logged' });
        });
    }

    return res.json({ message: 'No active session data provided' });
});

// --- 8. FORGOT PASSWORD: SEND OTP ---
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); 

    // Temporarily set is_verified to 0 during the reset process for security
    db.query("UPDATE user_accounts SET otp = ?, otp_expires_at = ?, is_verified = 0 WHERE email = ? AND is_deleted = 0", 
    [otpCode, expiresAt, normalizedEmail], (err, result) => {
        if (err || result.affectedRows === 0) return res.status(404).json({ message: "Email not found" });

        transporter.sendMail({
            from: '"TongTong Fish Culture"',
            to: normalizedEmail,
            subject: 'Password Reset Code',
            text: `Recovery code: ${otpCode}`
        });
        res.json({ message: "OTP sent" });
    });
});

// --- 8. FORGOT PASSWORD: VERIFY OTP (Step 1 of ForgotPassword.jsx) ---
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    
    const sql = "SELECT * FROM user_accounts WHERE email = ? AND otp = ? AND otp_expires_at > NOW() AND is_deleted = 0";
    
    db.query(sql, [normalizedEmail, otp], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length > 0) {
            // Set is_verified to 1 temporarily so the Reset route knows this session is valid
            db.query("UPDATE user_accounts SET is_verified = 1 WHERE email = ?", [normalizedEmail], () => {
                res.json({ message: "Verified!" });
            });
        } else {
            res.status(400).json({ message: "Invalid or Expired OTP" });
        }
    });
});

// --- 9. RESET PASSWORD ---
app.post('/api/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if they just verified their OTP (is_verified = 1)
    db.query("SELECT * FROM user_accounts WHERE email = ? AND is_verified = 1", [normalizedEmail], (err, result) => {
        if (result.length === 0) return res.status(400).json({ message: "Session expired" });

        // Hash the new password
        bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
            if (hashErr) return res.status(500).json({ message: "Password hashing failed" });

            const sql = "UPDATE user_accounts SET password = ?, otp = NULL, otp_expires_at = NULL, is_verified = 1 WHERE email = ?";
            db.query(sql, [hashedPassword, normalizedEmail], (updErr) => {
                if (updErr) return res.status(500).json({ message: "Update error" });
                res.json({ message: "Password updated!" });
            });
        });
    });
});

// ===========================
// --- ECOMMERCE ROUTES ---
// ===========================

// --- 10. GET ALL PRODUCTS (including deleted/out of stock) ---
app.get('/api/products', (req, res) => {
    const { search, category, priceMin, priceMax, includeDeleted } = req.query;
    const shouldIncludeDeleted = String(includeDeleted || '').toLowerCase() === 'true' || String(includeDeleted || '') === '1';
    let sql = "SELECT * FROM products WHERE 1 = 1";
    const params = [];

    if (!shouldIncludeDeleted) {
        sql += " AND is_deleted = 0";
    }

    if (search) {
        sql += " AND (name LIKE ? OR description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
        sql += " AND category = ?";
        params.push(category);
    }

    if (priceMin) {
        sql += " AND price >= ?";
        params.push(parseInt(priceMin));
    }

    if (priceMax) {
        sql += " AND price <= ?";
        params.push(parseInt(priceMax));
    }

    sql += " ORDER BY created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 11. GET SINGLE PRODUCT (including deleted) ---
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM products WHERE product_id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0) return res.status(404).json({ message: "Product not found" });
        res.json(result[0]);
    });
});

// --- 11.5. UPLOAD PRODUCT IMAGE ---
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const imageUrl = `${APP_BASE_URL}/uploads/${req.file.filename}`;
        res.json({ imageUrl, filename: req.file.filename });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 11.6. UPLOAD USER ID IMAGE AND UPDATE SENIOR/PWD STATUS ---
app.post('/api/upload-id', upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 }
]), (req, res) => {
    const { userId, isSenior, isPwd } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const wantsSenior = String(isSenior).toLowerCase() === 'true' || String(isSenior) === '1';
    const wantsPwd = String(isPwd).toLowerCase() === 'true' || String(isPwd) === '1';

    if (wantsSenior === wantsPwd) {
        return res.status(400).json({ message: 'Please select either Senior or PWD request.' });
    }

    db.query(
        "SELECT id_image_url, id_front_image_url, id_back_image_url, senior_verified, pwd_verified FROM user_accounts WHERE user_id = ? AND is_deleted = 0",
        [userId],
        (findErr, rows) => {
            if (findErr) return res.status(500).json({ message: 'Database error' });
            if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

            const userRow = rows[0];
            const isAlreadyApproved = Number(userRow.senior_verified) === 1 || Number(userRow.pwd_verified) === 1;

            // Lock request once admin approves eligibility.
            if (isAlreadyApproved) {
                return res.status(400).json({ message: 'Discount eligibility already approved and locked.' });
            }

            const idFrontFile = req.files?.idFront?.[0];
            const idBackFile = req.files?.idBack?.[0];
            const idFrontImageUrl = idFrontFile
                ? `${APP_BASE_URL}/uploads/${idFrontFile.filename}`
                : (userRow.id_front_image_url || null);
            const idBackImageUrl = idBackFile
                ? `${APP_BASE_URL}/uploads/${idBackFile.filename}`
                : (userRow.id_back_image_url || null);

            if (!idFrontImageUrl || !idBackImageUrl) {
                return res.status(400).json({ message: 'Please upload both front and back ID images for verification.' });
            }

            const nextIsSenior = wantsSenior ? 1 : 0;
            const nextIsPwd = wantsPwd ? 1 : 0;
            const nextSeniorVerified = wantsSenior ? null : 0;
            const nextPwdVerified = wantsPwd ? null : 0;

            const sql = `
                UPDATE user_accounts
                SET is_senior = ?,
                    is_pwd = ?,
                    senior_verified = ?,
                    pwd_verified = ?,
                    id_image_url = ?,
                    id_front_image_url = ?,
                    id_back_image_url = ?
                WHERE user_id = ?
            `;

            db.query(sql, [nextIsSenior, nextIsPwd, nextSeniorVerified, nextPwdVerified, idFrontImageUrl, idFrontImageUrl, idBackImageUrl, userId], (updateErr) => {
                if (updateErr) return res.status(500).json({ message: 'Database error' });
                res.json({
                    message: 'Discount request submitted. Awaiting admin verification.',
                    idFrontImageUrl,
                    idBackImageUrl,
                    requestType: wantsSenior ? 'senior' : 'pwd'
                });
            });
        }
    );
});

// --- 12. CREATE PRODUCT (Admin and Worker) ---
app.post('/api/products', checkRole('admin'), (req, res) => {
    const { name, description, category, price, stock, lowStockThreshold, imageUrl } = req.body;
    const normalizedImageUrl = imageUrl || null;

        const findExistingSql = `
                SELECT product_id, stock, is_deleted
                FROM products
                WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
                    AND LOWER(TRIM(category)) = LOWER(TRIM(?))
                    AND price = ?
                ORDER BY is_deleted ASC, product_id ASC
                LIMIT 1
        `;

    db.query(findExistingSql, [name, category, price], (findErr, existingRows) => {
        if (findErr) return res.status(500).json({ message: "Database error" });

        if (existingRows.length > 0) {
            const existing = existingRows[0];
            const updateExistingSql = `
                UPDATE products
                SET stock = ?,
                    description = ?,
                    low_stock_threshold = ?,
                    image_url = ?,
                    is_deleted = 0,
                    updated_at = NOW()
                WHERE product_id = ?
            `;

            const incomingStock = parseInt(stock, 10) || 0;
            const nextStock = existing.is_deleted ? incomingStock : (Number(existing.stock || 0) + incomingStock);

            db.query(
                updateExistingSql,
                [
                    nextStock,
                    description || '',
                    parseInt(lowStockThreshold, 10) || 5,
                    normalizedImageUrl,
                    existing.product_id
                ],
                (updateErr) => {
                    if (updateErr) return res.status(500).json({ message: "Database error" });
                    res.json({
                        message: existing.is_deleted
                            ? "Existing deleted product found. It was restored instead of creating a duplicate."
                            : "Product already exists. Stock was merged into the existing item.",
                        productId: existing.product_id,
                        merged: true
                    });
                }
            );
            return;
        }

        const insertSql = "INSERT INTO products (name, description, category, price, stock, low_stock_threshold, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)";

        db.query(
            insertSql,
            [
                name,
                description || '',
                category,
                price,
                parseInt(stock, 10) || 0,
                parseInt(lowStockThreshold, 10) || 5,
                normalizedImageUrl
            ],
            (insertErr, result) => {
                if (insertErr) return res.status(500).json({ message: "Database error" });
                res.json({ message: "Product created", productId: result.insertId, merged: false });
            }
        );
    });
});

// --- 13. UPDATE PRODUCT (Admin and Worker) ---
app.put('/api/products/:id', checkRole('admin'), (req, res) => {
    const { id } = req.params;
    const { name, description, category, price, stock, lowStockThreshold, imageUrl } = req.body;
    const checkDuplicateSql = `
        SELECT product_id, stock
        FROM products
        WHERE is_deleted = 0
          AND product_id <> ?
          AND LOWER(TRIM(name)) = LOWER(TRIM(?))
          AND LOWER(TRIM(category)) = LOWER(TRIM(?))
          AND price = ?
        LIMIT 1
    `;

    db.query(checkDuplicateSql, [id, name, category, price], (checkErr, duplicateRows) => {
        if (checkErr) return res.status(500).json({ message: "Database error" });

        if (duplicateRows.length > 0) {
            const duplicate = duplicateRows[0];
            const mergedStock = (Number(duplicate.stock || 0) + (parseInt(stock, 10) || 0));

            const mergeSql = `
                UPDATE products
                SET stock = ?,
                    description = ?,
                    low_stock_threshold = ?,
                    image_url = ?,
                    updated_at = NOW()
                WHERE product_id = ?
            `;

            db.query(
                mergeSql,
                [
                    mergedStock,
                    description || '',
                    parseInt(lowStockThreshold, 10) || 5,
                    imageUrl || null,
                    duplicate.product_id
                ],
                (mergeErr) => {
                    if (mergeErr) return res.status(500).json({ message: "Database error" });

                    db.query("UPDATE products SET is_deleted = 1 WHERE product_id = ?", [id], (softDeleteErr) => {
                        if (softDeleteErr) return res.status(500).json({ message: "Database error" });
                        res.json({
                            message: "Matching product already existed. Changes were merged into one product entry.",
                            merged: true,
                            productId: duplicate.product_id
                        });
                    });
                }
            );
            return;
        }

        const updateSql = "UPDATE products SET name = ?, description = ?, category = ?, price = ?, stock = ?, low_stock_threshold = ?, image_url = ? WHERE product_id = ?";
        db.query(updateSql, [name, description, category, price, stock, lowStockThreshold || 5, imageUrl || null, id], (err) => {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json({ message: "Product updated", merged: false });
        });
    });
});

function dbQueryAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function sendDiscontinuedProductInvoiceUpdateEmail(orderId, productName, actorUserId) {
    const orderRows = await dbQueryAsync(
    `SELECT o.order_id, o.order_number, o.order_date, o.user_id, o.total_amount, o.created_at, o.status, o.shipping_address,
                u.email, u.first_name, u.last_name, u.contact_number,
                i.invoice_id, i.invoice_number
         FROM orders o
         JOIN user_accounts u ON o.user_id = u.user_id
         LEFT JOIN invoices i ON i.order_id = o.order_id
         WHERE o.order_id = ?
         LIMIT 1`,
        [orderId]
    );

    if (!orderRows || orderRows.length === 0) {
        return { sent: false, reason: 'order-not-found' };
    }

    const order = orderRows[0];
    if (!order.email) {
        return { sent: false, reason: 'missing-email' };
    }

    const itemRows = await dbQueryAsync(
        `SELECT oi.quantity, oi.price, oi.unit_discount, p.name
         FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
         WHERE oi.order_id = ?
         ORDER BY oi.order_item_id ASC`,
        [orderId]
    );

    if (!itemRows || itemRows.length === 0) {
        return { sent: false, reason: 'no-items-left' };
    }

    const itemsHtml = itemRows.map((item) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const unitDiscount = Number(item.unit_discount || 0);
        const originalTotal = quantity * price;
        const discountTotal = quantity * unitDiscount;
        const discountedTotal = originalTotal - discountTotal;

        return `
            <tr>
                <td>${item.name || 'Item'}</td>
                <td>${quantity}</td>
                <td>₱${price.toFixed(2)}</td>
                <td>₱${unitDiscount.toFixed(2)}</td>
                <td>₱${discountedTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const totalDiscount = itemRows.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_discount || 0)), 0);

    let invoiceId = order.invoice_id;
    let invoiceNumber = order.invoice_number;
    if (!invoiceId) {
        invoiceNumber = buildInvoiceNumber(order);
        const insertInvoiceResult = await dbQueryAsync(
            `INSERT INTO invoices (order_id, invoice_number, customer_name, email, contact_number, total_amount, payment_method, invoice_pdf_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
            [
                orderId,
                invoiceNumber,
                `${order.first_name || ''} ${order.last_name || ''}`.trim() || null,
                order.email || null,
                order.contact_number || null,
                Number(order.total_amount || 0),
                'cash_on_store'
            ]
        );
        invoiceId = insertInvoiceResult.insertId;
    } else {
        await dbQueryAsync(
            `UPDATE invoices
             SET customer_name = ?, email = ?, contact_number = ?, total_amount = ?
             WHERE invoice_id = ?`,
            [
                `${order.first_name || ''} ${order.last_name || ''}`.trim() || null,
                order.email || null,
                order.contact_number || null,
                Number(order.total_amount || 0),
                invoiceId
            ]
        );
    }

    const invoiceUrl = `${APP_BASE_URL}/api/orders/${orderId}/invoice-pdf?userId=${order.user_id}`;
    const customerName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Customer';

    await new Promise((resolve, reject) => {
        transporter.sendMail(
            {
                from: 'tongtongornamental@gmail.com',
                to: order.email,
                subject: `Order Updated - Item Discontinued (Order ${getOrderDisplayNumber(order)})`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                            .receipt { border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .total { font-weight: bold; font-size: 18px; }
                            .footer { margin-top: 30px; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>TongTong Ornamental Fish Store</h1>
                            <h2>Updated Order Receipt</h2>
                        </div>

                        <div class="receipt">
                            <h3>Order Details</h3>
                            <p><strong>Order Number:</strong> ${getOrderDisplayNumber(order)}</p>
                            <p><strong>Internal Order ID:</strong> #${orderId}</p>
                            <p><strong>Customer:</strong> ${customerName}</p>
                            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                            <p><strong>Status:</strong> ${order.status}</p>
                            <p><strong>Shipping Address:</strong> ${order.shipping_address || 'N/A'}</p>

                            <p style="color: #b85c00; font-weight: bold;">An item in your pending order was discontinued by the store: ${productName || 'A product'}.</p>

                            <h3>Items Ordered</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Discount</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>

                            <p><strong>Total Discount:</strong> ₱${totalDiscount.toFixed(2)}</p>
                            <p class="total">Updated Total Amount: ₱${Number(order.total_amount || 0).toFixed(2)}</p>
                            <p style="color: red; font-weight: bold;">Your invoice has been updated automatically. Please use this updated invoice for reference.</p>
                            <p><a href="${invoiceUrl}" target="_blank" rel="noopener noreferrer">Download Updated Invoice PDF</a></p>
                        </div>

                        <div class="footer">
                            <p>Thank you for shopping with TongTong Ornamental Fish Store!</p>
                            <p>If you have any questions, please contact us at tongtongornamental@gmail.com</p>
                        </div>
                    </body>
                    </html>
                `
            },
            (mailErr) => {
                if (mailErr) return reject(mailErr);
                resolve();
            }
        );
    });

    await dbQueryAsync(
        'INSERT INTO invoice_requests (invoice_id, requested_by, email_sent) VALUES (?, ?, 1)',
        [invoiceId, Number(actorUserId || 0) || order.user_id]
    );

    return { sent: true };
}

async function applyDiscontinuedProductEffects(productId, productName, actorUserId) {
    const removedFromCartResult = await dbQueryAsync('DELETE FROM cart WHERE product_id = ?', [productId]);

    const affectedOrderRows = await dbQueryAsync(
        `SELECT DISTINCT o.order_id
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.order_id
         WHERE oi.product_id = ?
           AND LOWER(o.status) IN ('pending', 'processing')`,
        [productId]
    );

    let updatedOrders = 0;
    let cancelledOrders = 0;
    let emailedOrders = 0;

    for (const row of affectedOrderRows) {
        const orderId = Number(row.order_id);

        await dbQueryAsync('DELETE FROM order_items WHERE order_id = ? AND product_id = ?', [orderId, productId]);

        const totals = await dbQueryAsync(
            `SELECT COUNT(*) AS item_count,
                    COALESCE(SUM((price - unit_discount) * quantity), 0) AS total_amount
             FROM order_items
             WHERE order_id = ?`,
            [orderId]
        );

        const itemCount = Number(totals?.[0]?.item_count || 0);
        const nextTotal = Number(totals?.[0]?.total_amount || 0);

        if (itemCount <= 0) {
            await dbQueryAsync(
                `UPDATE orders
                 SET total_amount = 0,
                     status = 'cancelled',
                     cancellation_status = 'approved'
                 WHERE order_id = ?
                   AND LOWER(status) IN ('pending', 'processing')`,
                [orderId]
            );
            await dbQueryAsync('UPDATE invoices SET total_amount = 0 WHERE order_id = ?', [orderId]);
            cancelledOrders += 1;
            continue;
        }

        await dbQueryAsync(
            `UPDATE orders
             SET total_amount = ?
             WHERE order_id = ?
               AND LOWER(status) IN ('pending', 'processing')`,
            [nextTotal, orderId]
        );

        await dbQueryAsync('UPDATE invoices SET total_amount = ? WHERE order_id = ?', [nextTotal, orderId]);
        updatedOrders += 1;

        try {
            const emailResult = await sendDiscontinuedProductInvoiceUpdateEmail(orderId, productName, actorUserId);
            if (emailResult.sent) {
                emailedOrders += 1;
            }
        } catch (mailErr) {
            console.error(`Failed sending updated invoice email for order #${orderId}:`, mailErr.message || mailErr);
        }
    }

    return {
        removedFromCartCount: Number(removedFromCartResult?.affectedRows || 0),
        affectedUnpaidOrderCount: affectedOrderRows.length,
        updatedOrderCount: updatedOrders,
        cancelledOrderCount: cancelledOrders,
        emailedOrderCount: emailedOrders
    };
}

// --- 14. DELETE PRODUCT (Admin and Worker) ---
app.delete('/api/products/:id', checkRole('admin'), (req, res) => {
    const { id } = req.params;
    const actorUserId = Number(req.body?.userId || req.query?.userId || req.headers['x-user-id'] || 0);
    const numericProductId = Number(id);
    const sql = "UPDATE products SET is_deleted = 1 WHERE product_id = ?";

    db.query('SELECT product_id, name FROM products WHERE product_id = ? LIMIT 1', [numericProductId], async (findErr, rows) => {
        if (findErr) return res.status(500).json({ message: 'Database error' });
        if (!rows || rows.length === 0) return res.status(404).json({ message: 'Product not found' });

        const productName = rows[0].name || 'Product';

        db.query(sql, [numericProductId], async (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            try {
                const impactSummary = await applyDiscontinuedProductEffects(numericProductId, productName, actorUserId);
                return res.json({
                    message: 'Product deleted',
                    impactSummary
                });
            } catch (impactErr) {
                console.error('Discontinued product impact processing error:', impactErr.message || impactErr);
                return res.json({
                    message: 'Product deleted',
                    warning: 'Product was deleted, but some cart/order cleanup or email notifications failed'
                });
            }
        });
    });
});

// --- 14.1. GET DELETED PRODUCTS (Admin Only) ---
app.get('/api/admin/deleted-products', checkRole('admin'), (req, res) => {
    const sql = `
        SELECT *
        FROM products
        WHERE is_deleted = 1
        ORDER BY updated_at DESC, product_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 14.2. RESTORE DELETED PRODUCT (Admin Only) ---
app.put('/api/products/:id/restore', checkRole('admin'), (req, res) => {
    const { id } = req.params;
    const {
        name,
        description,
        category,
        price,
        stock,
        lowStockThreshold,
        imageUrl
    } = req.body;

    db.query("SELECT * FROM products WHERE product_id = ?", [id], (err, productResult) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (productResult.length === 0) return res.status(404).json({ message: "Product not found" });

        const deletedProduct = productResult[0];
        if (deletedProduct.is_deleted !== 1) {
            return res.status(400).json({ message: "Product is already active" });
        }

        const nextName = name || deletedProduct.name;
        const nextDescription = description || deletedProduct.description || '';
        const nextCategory = category || deletedProduct.category || '';
        const nextPrice = price !== undefined ? price : deletedProduct.price;
        const nextStock = parseInt(stock, 10) >= 0 ? parseInt(stock, 10) : Number(deletedProduct.stock || 0);
        const nextThreshold = parseInt(lowStockThreshold, 10) || deletedProduct.low_stock_threshold || 5;
        const nextImageUrl = imageUrl || deletedProduct.image_url || null;

        db.query(
            `SELECT product_id, stock FROM products
             WHERE is_deleted = 0
               AND LOWER(TRIM(name)) = LOWER(TRIM(?))
               AND LOWER(TRIM(category)) = LOWER(TRIM(?))
               AND price = ?
             LIMIT 1`,
            [nextName, nextCategory, nextPrice],
            (dupErr, dupRows) => {
                if (dupErr) return res.status(500).json({ message: "Database error" });

                if (dupRows.length > 0) {
                    const activeProduct = dupRows[0];
                    const mergedStock = Number(activeProduct.stock || 0) + Number(nextStock || 0);

                    db.query(
                        "UPDATE products SET description = ?, low_stock_threshold = ?, image_url = ?, stock = ?, updated_at = NOW() WHERE product_id = ?",
                        [nextDescription, nextThreshold, nextImageUrl, mergedStock, activeProduct.product_id],
                        (mergeErr) => {
                            if (mergeErr) return res.status(500).json({ message: "Database error" });
                            res.json({ message: "Deleted product merged into existing active product", restored: false, merged: true });
                        }
                    );
                    return;
                }

                db.query(
                    "UPDATE products SET name = ?, description = ?, category = ?, price = ?, stock = ?, low_stock_threshold = ?, image_url = ?, is_deleted = 0, updated_at = NOW() WHERE product_id = ?",
                    [nextName, nextDescription, nextCategory, nextPrice, nextStock, nextThreshold, nextImageUrl, id],
                    (restoreErr) => {
                        if (restoreErr) return res.status(500).json({ message: "Database error" });
                        res.json({ message: "Product restored successfully", restored: true, merged: false });
                    }
                );
            }
        );
    });
});

// --- 14.1. CREATE PRODUCT REVIEW ---
app.post('/api/products/:productId/reviews', authenticateToken, (req, res) => {
    const { productId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.userId;

    // Check if user has purchased this product
    const checkPurchaseSql = `
        SELECT oi.order_id FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered'
    `;

    db.query(checkPurchaseSql, [productId, userId], (err, purchaseResult) => {
        if (err) return res.status(500).json({ message: "Database error" });

        const isVerifiedPurchase = purchaseResult.length > 0;

        const sql = "INSERT INTO product_reviews (product_id, user_id, rating, review_text, is_verified_purchase) VALUES (?, ?, ?, ?, ?)";
        db.query(sql, [productId, userId, rating, reviewText, isVerifiedPurchase], (err, result) => {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json({ message: "Review submitted", reviewId: result.insertId });
        });
    });
});

// --- 14.2. GET PRODUCT REVIEWS ---
app.get('/api/products/:productId/reviews', (req, res) => {
    const { productId } = req.params;
    const sql = `
        SELECT r.*, u.first_name, u.last_name
        FROM product_reviews r
        JOIN user_accounts u ON r.user_id = u.user_id
        WHERE r.product_id = ? AND r.is_deleted = 0
        ORDER BY r.created_at DESC
    `;

    db.query(sql, [productId], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 14.3. GET PRODUCT AVERAGE RATING ---
app.get('/api/products/:productId/rating', (req, res) => {
    const { productId } = req.params;
    const sql = `
        SELECT
            COUNT(*) as total_reviews,
            AVG(rating) as average_rating,
            COUNT(CASE WHEN is_verified_purchase = 1 THEN 1 END) as verified_reviews
        FROM product_reviews
        WHERE product_id = ? AND is_deleted = 0
    `;

    db.query(sql, [productId], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        const result = results[0];
        res.json({
            totalReviews: result.total_reviews,
            averageRating: parseFloat(result.average_rating || 0).toFixed(1),
            verifiedReviews: result.verified_reviews
        });
    });
});

// --- 14.4. DELETE PRODUCT REVIEW (User can delete their own reviews) ---
app.delete('/api/reviews/:reviewId', authenticateToken, (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    const sql = "UPDATE product_reviews SET is_deleted = 1 WHERE review_id = ? AND user_id = ?";
    db.query(sql, [reviewId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Review not found or not authorized" });
        }
        res.json({ message: "Review deleted" });
    });
});

// --- 15. GET USER CART ---
app.get('/api/cart/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = `SELECT c.cart_id, c.user_id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.stock
                 FROM cart c
                 JOIN products p ON c.product_id = p.product_id
                 WHERE c.user_id = ? AND p.is_deleted = 0`;
    
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 16. ADD TO CART ---
app.post('/api/cart', (req, res) => {
    const { userId, productId, quantity } = req.body;
    
    // Check if item already in cart
    db.query("SELECT * FROM cart WHERE user_id = ? AND product_id = ?", [userId, productId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        
        if (result.length > 0) {
            // Update quantity
            db.query("UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?", 
            [quantity, userId, productId], (updErr) => {
                if (updErr) return res.status(500).json({ message: "Update error" });
                res.json({ message: "Cart updated" });
            });
        } else {
            // Insert new item
            db.query("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)", 
            [userId, productId, quantity], (insErr) => {
                if (insErr) return res.status(500).json({ message: "Insert error" });
                res.json({ message: "Added to cart" });
            });
        }
    });
});

// --- 17. UPDATE CART ITEM QUANTITY ---
app.put('/api/cart/:cartId', (req, res) => {
    const { cartId } = req.params;
    const { quantity } = req.body;
    
    if (quantity <= 0) {
        db.query("DELETE FROM cart WHERE cart_id = ?", [cartId], (err) => {
            if (err) return res.status(500).json({ message: "Delete error" });
            res.json({ message: "Item removed from cart" });
        });
    } else {
        db.query("UPDATE cart SET quantity = ? WHERE cart_id = ?", [quantity, cartId], (err) => {
            if (err) return res.status(500).json({ message: "Update error" });
            res.json({ message: "Cart updated" });
        });
    }
});

// --- 18. REMOVE FROM CART ---
app.delete('/api/cart/:cartId', (req, res) => {
    const { cartId } = req.params;
    db.query("DELETE FROM cart WHERE cart_id = ?", [cartId], (err) => {
        if (err) return res.status(500).json({ message: "Delete error" });
        res.json({ message: "Removed from cart" });
    });
});

// --- 19. CREATE ORDER WITH RECEIPT EMAIL ---
app.post('/api/orders', (req, res) => {
    const { userId, items, totalAmount, shippingAddress } = req.body;
    const paymentMethod = 'cash_on_store';

    // Get user discount status
    db.query("SELECT is_senior, is_pwd, senior_verified, pwd_verified FROM user_accounts WHERE user_id = ?", [userId], (userErr, userResult) => {
        if (userErr) return res.status(500).json({ message: "User query error" });
        if (userResult.length === 0) return res.status(404).json({ message: "User not found" });

        const isSenior = userResult[0].is_senior && userResult[0].senior_verified;
        const isPwd = userResult[0].is_pwd && userResult[0].pwd_verified;
        const discountRate = (isSenior || isPwd) ? 0.05 : 0;

        db.query("INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status) VALUES (?, ?, ?, ?, 'pending')", 
        [userId, totalAmount, shippingAddress, paymentMethod], (err, result) => {
            if (err) return res.status(500).json({ message: "Database error" });

            const orderId = result.insertId;
            assignDailyOrderNumber(orderId, (orderNumberErr, dailyOrderNumber) => {
                if (orderNumberErr) return res.status(500).json({ message: "Order number error" });

            // Insert order items with discount
            let inserted = 0;
            let calculatedTotal = 0;
            items.forEach(item => {
                const unitDiscount = item.price * discountRate;
                const lineTotal = (item.price - unitDiscount) * item.quantity;
                calculatedTotal += lineTotal;

                db.query("INSERT INTO order_items (order_id, product_id, quantity, price, unit_discount) VALUES (?, ?, ?, ?, ?)", 
                [orderId, item.product_id, item.quantity, item.price, unitDiscount], (itemErr) => {
                    if (itemErr) return res.status(500).json({ message: "Order item error" });
                    inserted++;

                    // Update product stock and finish after all items
                    if (inserted === items.length) {
                        items.forEach(item => {
                            db.query("UPDATE products SET stock = stock - ? WHERE product_id = ?", [item.quantity, item.product_id]);
                        });

                        // Update order total with calculated amount
                        db.query("UPDATE orders SET total_amount = ? WHERE order_id = ?", [calculatedTotal, orderId]);

                        // Create invoice record
                        const invoiceNumber = buildInvoiceNumber({ order_id: orderId, order_number: dailyOrderNumber, created_at: new Date() });
                        const invoicePdfPath = null;
                        db.query("INSERT INTO invoices (order_id, invoice_number, payment_method, invoice_pdf_path) VALUES (?, ?, ?, ?)",
                            [orderId, invoiceNumber, paymentMethod, invoicePdfPath], (invoiceErr, invoiceResult) => {
                            if (invoiceErr) {
                                console.error("Invoice creation error:", invoiceErr);
                                return res.status(500).json({ message: "Invoice creation failed" });
                            }

                            const newInvoiceId = invoiceResult.insertId;

                            // Update order with invoice path (if available)
                            db.query("UPDATE orders SET invoice_pdf_path = ? WHERE order_id = ?", [invoicePdfPath, orderId]);

                            // Clear user cart
                            db.query("DELETE FROM cart WHERE user_id = ?", [userId]);

                            // Send receipt email
                            sendOrderReceipt(orderId, userId, newInvoiceId, res);
                        });
                    }
                });
            });
            });
        });
    });
});

// Function to send order receipt email
function sendOrderReceipt(orderId, userId, invoiceId, res) {
    // Get user email
    db.query("SELECT email, first_name, last_name FROM user_accounts WHERE user_id = ?", [userId], (err, userResult) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.json({ message: "Order created", orderId });
        }
        
        const userEmail = userResult[0].email;
        const userName = `${userResult[0].first_name} ${userResult[0].last_name}`;
        
        // Get order details
        db.query("SELECT * FROM orders WHERE order_id = ?", [orderId], (err, orderResult) => {
            if (err) {
                console.error("Error fetching order:", err);
                return res.json({ message: "Order created", orderId });
            }
            
            const order = orderResult[0];
            
            // Get order items
            db.query(`SELECT oi.*, p.name FROM order_items oi
                     JOIN products p ON oi.product_id = p.product_id
                     WHERE oi.order_id = ?`, [orderId], (err, itemsResult) => {
                if (err) {
                    console.error("Error fetching order items:", err);
                    return res.json({ message: "Order created", orderId });
                }
                
                // Generate receipt HTML
                const receiptHtml = generateReceiptHtml(order, itemsResult, userName);
                const orderDisplayNumber = getOrderDisplayNumber(order);
                
                // Send email
                const mailOptions = {
                    from: 'tongtongornamental@gmail.com',
                    to: userEmail,
                    subject: `Order Receipt ${orderDisplayNumber} - ${new Date(order.created_at).toLocaleDateString()} - TongTong Ornamental Fish Store`,
                    html: receiptHtml
                };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (!error && invoiceId) {
                        db.query(
                            "INSERT INTO invoice_requests (invoice_id, requested_by, email_sent) VALUES (?, ?, 1)",
                            [invoiceId, userId],
                            (logErr) => {
                                if (logErr) {
                                    console.error("Invoice request log error:", logErr);
                                }
                            }
                        );
                    }

                    if (error) {
                        console.error("Email error:", error);
                    } else {
                        console.log("Receipt email sent:", info.response);
                    }
                    res.json({ message: "Order created", orderId, orderNumber: formatOrderNumber(order) });
                });
            });
        });
    });
}

// --- 27W. WORKER/ADMIN ORDERS LIST ---
app.get('/api/worker/orders', checkRole(['admin', 'worker']), (req, res) => {
    const sql = `
        SELECT o.order_id,
               o.order_number,
               o.total_amount AS order_total,
               CASE WHEN LOWER(o.status) = 'processing' THEN 'pending' ELSE LOWER(o.status) END AS order_status,
               o.created_at AS order_date,
               o.updated_at,
               o.shipping_address,
               o.payment_method,
               u.user_id,
               CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
               u.email,
               u.contact_number,
               COALESCE(oi.items_count, 0) AS items_count
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        LEFT JOIN (
            SELECT order_id, SUM(quantity) AS items_count
            FROM order_items
            GROUP BY order_id
        ) oi ON oi.order_id = o.order_id
        ORDER BY o.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ orders: results });
    });
});

// --- 27X. WORKER/ADMIN ORDER STATUS UPDATE ---
app.put('/api/worker/orders/:orderId', checkRole(['admin', 'worker']), (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    const normalizedStatus = String(status || '').toLowerCase() === 'processing' ? 'pending' : status;

    db.query('UPDATE orders SET status = ? WHERE order_id = ?', [normalizedStatus, orderId], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Order updated successfully' });
    });
});

// --- 27Y. WORKER/ADMIN SALES HISTORY ---
app.get('/api/worker/sales-history', checkRole(['admin', 'worker']), (req, res) => {
    const period = String(req.query.period || 'all').toLowerCase();

    let dateClause = '';
    if (period === 'today') {
        dateClause = 'AND DATE(o.updated_at) = CURDATE()';
    } else if (period === 'week') {
        dateClause = 'AND YEARWEEK(o.updated_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (period === 'month') {
        dateClause = 'AND MONTH(o.updated_at) = MONTH(CURDATE()) AND YEAR(o.updated_at) = YEAR(CURDATE())';
    }

    const sql = `
        SELECT o.order_id,
               o.order_number,
               o.total_amount AS order_total,
               o.status AS order_status,
               o.updated_at AS order_date,
               o.payment_method,
               CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
               u.email,
               u.contact_number,
               i.invoice_id,
               i.invoice_number,
               i.invoice_pdf_path,
               i.issued_by_name,
               o.paid_by_name
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        LEFT JOIN invoices i ON i.order_id = o.order_id
        WHERE o.status = 'completed'
                    ${dateClause}
        ORDER BY o.updated_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ salesHistory: results });
    });
});

app.get('/api/worker/sales-history/:orderId/details', checkRole(['admin', 'worker']), (req, res) => {
    const { orderId } = req.params;

    const orderSql = `
        SELECT o.order_id, o.order_number, o.order_date, o.user_id, o.total_amount, o.status, o.payment_method,
               o.created_at, o.updated_at, o.paid_by_name,
               u.first_name, u.last_name, u.email, u.contact_number,
               i.invoice_id, i.invoice_number, i.invoice_pdf_path, i.issued_by_name, i.created_at AS invoice_created_at
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        LEFT JOIN invoices i ON i.order_id = o.order_id
        WHERE o.order_id = ?
        LIMIT 1
    `;

    const itemsSql = `
        SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.price, oi.unit_discount,
               p.name, p.image_url
        FROM order_items oi
        JOIN products p ON p.product_id = oi.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.order_item_id ASC
    `;

    const emailSql = `
        SELECT ir.request_id, ir.request_time, ir.email_sent,
               CONCAT(sender.first_name, ' ', sender.last_name) AS requested_by_name
        FROM invoice_requests ir
        LEFT JOIN user_accounts sender ON sender.user_id = ir.requested_by
        WHERE ir.invoice_id = ?
        ORDER BY ir.request_time DESC
    `;

    db.query(orderSql, [orderId], (orderErr, orderRows) => {
        if (orderErr) return res.status(500).json({ message: 'Database error' });
        if (orderRows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const order = orderRows[0];

        db.query(itemsSql, [orderId], (itemsErr, itemsRows) => {
            if (itemsErr) return res.status(500).json({ message: 'Database error' });

            db.query(emailSql, [order.invoice_id || 0], (emailErr, emailRows) => {
                if (emailErr) return res.status(500).json({ message: 'Database error' });

                const items = (itemsRows || []).map((item) => {
                    const quantity = Number(item.quantity || 0);
                    const price = Number(item.price || 0);
                    const unitDiscount = Number(item.unit_discount || 0);
                    const lineSubtotal = quantity * price;
                    const lineDiscount = quantity * unitDiscount;

                    return {
                        order_item_id: item.order_item_id,
                        product_id: item.product_id,
                        product_name: item.name,
                        image_url: item.image_url,
                        quantity,
                        price,
                        unit_discount: unitDiscount,
                        line_subtotal: lineSubtotal,
                        line_discount: lineDiscount,
                        line_total: lineSubtotal - lineDiscount
                    };
                });

                const subtotal = items.reduce((sum, item) => sum + item.line_subtotal, 0);
                const discount = items.reduce((sum, item) => sum + item.line_discount, 0);
                const total = items.reduce((sum, item) => sum + item.line_total, 0);

                res.json({
                    order: {
                        order_id: order.order_id,
                        order_number: order.order_number,
                        order_date: order.order_date,
                        user_id: order.user_id,
                        customer_name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
                        email: order.email,
                        contact_number: order.contact_number,
                        total_amount: Number(order.total_amount || total),
                        status: order.status,
                        payment_method: order.payment_method,
                        created_at: order.created_at,
                        updated_at: order.updated_at,
                        paid_by_name: order.paid_by_name || null
                    },
                    invoice: order.invoice_id ? {
                        invoice_id: order.invoice_id,
                        invoice_number: order.invoice_number,
                        invoice_pdf_path: order.invoice_pdf_path,
                        issued_by_name: order.issued_by_name,
                        created_at: order.invoice_created_at
                    } : null,
                    items,
                    email_history: (emailRows || []).map((row) => ({
                        request_id: row.request_id,
                        requested_by_name: row.requested_by_name || 'System',
                        request_time: row.request_time,
                        email_sent: Boolean(row.email_sent)
                    })),
                    summary: {
                        subtotal,
                        discount,
                        total: Number(order.total_amount || total)
                    }
                });
            });
        });
    });
});

// --- 27Z. WORKER/ADMIN REFUND REQUESTS ---
app.get('/api/worker/refunds', checkRole(['admin', 'worker']), (req, res) => {
    const sql = `
        SELECT cr.request_id,
               cr.order_id,
               o.order_number,
               o.order_date,
               cr.reason AS refund_reason,
               cr.status AS refund_status,
               cr.created_at AS request_date,
               o.total_amount AS refund_amount,
               o.status AS order_status,
               CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
               u.email
        FROM order_cancellation_requests cr
        JOIN orders o ON cr.order_id = o.order_id
        JOIN user_accounts u ON o.user_id = u.user_id
        ORDER BY cr.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ refunds: results });
    });
});

app.post('/api/worker/refund/:orderId', checkRole(['admin', 'worker']), (req, res) => {
    const { orderId } = req.params;
    const { reason, userId } = req.body;

    db.query('SELECT * FROM order_cancellation_requests WHERE order_id = ? ORDER BY created_at DESC LIMIT 1', [orderId], (findErr, rows) => {
        if (findErr) return res.status(500).json({ message: 'Database error' });

        const approveRefund = (requestId) => {
            db.query(
                "UPDATE order_cancellation_requests SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), reason = COALESCE(NULLIF(?, ''), reason) WHERE request_id = ?",
                [userId, reason || null, requestId],
                (updateReqErr) => {
                    if (updateReqErr) return res.status(500).json({ message: 'Database error' });

                    db.query("UPDATE orders SET status = 'cancelled', cancellation_status = 'approved' WHERE order_id = ?", [orderId], (updateOrderErr) => {
                        if (updateOrderErr) return res.status(500).json({ message: 'Database error' });

                        db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId], (itemsErr, items) => {
                            if (itemsErr) return res.status(500).json({ message: 'Database error' });

                            items.forEach((item) => {
                                db.query('UPDATE products SET stock = stock + ? WHERE product_id = ?', [item.quantity, item.product_id]);
                            });

                            res.json({ message: 'Refund approved successfully' });
                        });
                    });
                }
            );
        };

        if (rows.length > 0) {
            if (rows[0].status !== 'pending') {
                return res.status(400).json({ message: 'Refund request already processed' });
            }
            return approveRefund(rows[0].request_id);
        }

        db.query('SELECT user_id FROM orders WHERE order_id = ?', [orderId], (orderErr, orderRows) => {
            if (orderErr) return res.status(500).json({ message: 'Database error' });
            if (orderRows.length === 0) return res.status(404).json({ message: 'Order not found' });

            db.query(
                "INSERT INTO order_cancellation_requests (order_id, user_id, reason, status, reviewed_by, reviewed_at) VALUES (?, ?, ?, 'pending', NULL, NULL)",
                [orderId, orderRows[0].user_id, reason || null],
                (insertErr, insertRes) => {
                    if (insertErr) return res.status(500).json({ message: 'Database error' });
                    approveRefund(insertRes.insertId);
                }
            );
        });
    });
});

// --- 27AA. WORKER/ADMIN RECEIPT HISTORY ---
app.get('/api/worker/receipts', checkRole(['admin', 'worker']), (req, res) => {
    const sql = `
        SELECT o.order_id,
               o.total_amount AS total,
               o.created_at AS order_date,
               o.payment_method,
               o.shipping_address,
               CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
               COUNT(oi.order_item_id) AS items_count,
               SUM(oi.price * oi.quantity) AS subtotal,
               0 AS tax
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        GROUP BY o.order_id, o.total_amount, o.created_at, o.payment_method, o.shipping_address, u.first_name, u.last_name
        ORDER BY o.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ receipts: results });
    });
});

// --- 27AB. WORKER/ADMIN SALES REPORTS ---
app.get('/api/worker/reports', checkRole(['admin', 'worker']), (req, res) => {
    const period = req.query.period || 'today';

    let whereClause = '';
    if (period === 'today') whereClause = 'DATE(o.created_at) = CURDATE()';
    if (period === 'week') whereClause = 'YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    if (period === 'month') whereClause = 'MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())';
    if (period === 'year') whereClause = 'YEAR(o.created_at) = YEAR(CURDATE())';
    if (!whereClause) whereClause = '1=1';

    const summarySql = `
        SELECT
            COALESCE(SUM(o.total_amount), 0) AS totalSales,
            COUNT(*) AS totalOrders,
            COALESCE(AVG(o.total_amount), 0) AS avgOrderValue
        FROM orders o
        WHERE ${whereClause}
          AND o.status IN ('completed', 'processing', 'cancelled')
    `;

    const topProductsSql = `
        SELECT
            p.name AS product_name,
            SUM(oi.quantity) AS quantity_sold,
            SUM(oi.quantity * oi.price) AS revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE ${whereClause}
          AND o.status IN ('completed', 'processing', 'cancelled')
        GROUP BY p.product_id, p.name
        ORDER BY revenue DESC
        LIMIT 5
    `;

    db.query(summarySql, (summaryErr, summaryRows) => {
        if (summaryErr) return res.status(500).json({ message: 'Database error' });

        db.query(topProductsSql, (topErr, topRows) => {
            if (topErr) return res.status(500).json({ message: 'Database error' });

            const summary = summaryRows[0] || { totalSales: 0, totalOrders: 0, avgOrderValue: 0 };
            res.json({
                totalSales: Number(summary.totalSales || 0),
                totalOrders: Number(summary.totalOrders || 0),
                avgOrderValue: Number(summary.avgOrderValue || 0),
                topProducts: topRows || []
            });
        });
    });
});

// --- 27AC. WORKER/ADMIN MANUAL RECEIPT EMAIL SEND ---
app.post('/api/worker/send-receipt-email', checkRole(['admin', 'worker']), (req, res) => {
    const { order_id } = req.body;

    if (!order_id) {
        return res.status(400).json({ message: 'Order ID is required' });
    }

    db.query("SELECT o.*, u.user_id, u.email, u.first_name, u.last_name FROM orders o JOIN user_accounts u ON o.user_id = u.user_id WHERE o.order_id = ?", [order_id], (orderErr, orderRows) => {
        if (orderErr) return res.status(500).json({ message: 'Database error' });
        if (orderRows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const order = orderRows[0];
        const userName = `${order.first_name || ''} ${order.last_name || ''}`.trim();

        db.query(`SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?`, [order_id], (itemsErr, itemsRows) => {
            if (itemsErr) return res.status(500).json({ message: 'Database error' });

            const receiptHtml = generateReceiptHtml(order, itemsRows, userName);
            const mailOptions = {
                from: 'tongtongornamental@gmail.com',
                to: order.email,
                subject: `Order Receipt ${getOrderDisplayNumber(order)} - ${new Date(order.created_at).toLocaleDateString()} - TongTong Ornamental Fish Store`,
                html: receiptHtml
            };

            transporter.sendMail(mailOptions, (mailErr) => {
                if (mailErr) return res.status(500).json({ message: 'Failed to send receipt email' });

                db.query('SELECT invoice_id FROM invoices WHERE order_id = ? LIMIT 1', [order_id], (invoiceErr, invoiceRows) => {
                    if (!invoiceErr && invoiceRows.length > 0) {
                        db.query(
                            'INSERT INTO invoice_requests (invoice_id, requested_by, email_sent) VALUES (?, ?, 1)',
                            [invoiceRows[0].invoice_id, order.user_id],
                            () => res.json({ message: 'Receipt email sent successfully' })
                        );
                    } else {
                        res.json({ message: 'Receipt email sent successfully' });
                    }
                });
            });
        });
    });
});

// --- 27A. WORKER/ADMIN QUICK INVOICE DATA ---
app.get('/api/worker/invoice-orders', checkRole(['admin', 'worker']), (req, res) => {
    const sql = `SELECT o.order_id, o.order_number, o.user_id, o.total_amount, o.status, o.created_at AS order_date,
                        u.first_name, u.last_name, u.email,
                        i.invoice_id, i.invoice_number, i.invoice_pdf_path, i.issued_by_name,
                        o.paid_by_name
                 FROM orders o
                 JOIN user_accounts u ON o.user_id = u.user_id
                 LEFT JOIN invoices i ON o.order_id = i.order_id
                 ORDER BY o.created_at DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        const orders = results.map(row => ({
            order_id: row.order_id,
            order_number: row.order_number,
            user_id: row.user_id,
            customer_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            email: row.email,
            total_amount: row.total_amount,
            status: row.status,
            order_date: row.order_date,
            invoice_id: row.invoice_id,
            invoice_number: row.invoice_number,
            invoice_pdf_path: row.invoice_pdf_path,
            issued_by_name: row.issued_by_name,
            paid_by_name: row.paid_by_name,
            has_invoice: Boolean(row.invoice_id)
        }));

        res.json(orders);
    });
});

// --- 27B. WORKER/ADMIN QUICK INVOICE GENERATION ---
app.post('/api/worker/generate-invoice', checkRole(['admin', 'worker']), (req, res) => {
    const { order_id, notes, userId } = req.body;

    if (!order_id) {
        return res.status(400).json({ message: 'Order ID is required' });
    }

    db.query(
        `SELECT o.*, u.first_name, u.last_name, u.email, u.contact_number
         FROM orders o
         JOIN user_accounts u ON o.user_id = u.user_id
         WHERE o.order_id = ?`,
        [order_id],
        (orderErr, orderResults) => {
            if (orderErr) return res.status(500).json({ message: 'Database error' });
            if (orderResults.length === 0) return res.status(404).json({ message: 'Order not found' });

            const order = orderResults[0];

            db.query('SELECT first_name, last_name FROM user_accounts WHERE user_id = ? LIMIT 1', [userId || 0], (issuerErr, issuerRows) => {
                if (issuerErr) return res.status(500).json({ message: 'Database error' });

                const issuedByName = issuerRows.length > 0
                    ? `${issuerRows[0].first_name || ''} ${issuerRows[0].last_name || ''}`.trim()
                    : 'Unknown staff';

                db.query(
                    'SELECT * FROM invoices WHERE order_id = ?',
                    [order_id],
                    (invoiceErr, invoiceResults) => {
                        if (invoiceErr) return res.status(500).json({ message: 'Database error' });

                        const generatePdfAndRespond = async (invoiceRecord) => {
                        try {
                            db.query(
                                'SELECT oi.quantity, oi.price, oi.unit_discount, p.name FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?',
                                [order_id],
                                async (itemsErr, itemRows) => {
                                    if (itemsErr) return res.status(500).json({ message: 'Database error' });

                                    const safeInvoiceNumber = (invoiceRecord.invoice_number || buildInvoiceNumber(order)).replace(/[^A-Za-z0-9-_]/g, '_');
                                    const fileName = `${safeInvoiceNumber}.pdf`;
                                    const absPath = path.join(invoiceUploadDir, fileName);
                                    const publicPath = `/uploads/invoices/${fileName}`;

                                    await buildInvoicePdf(
                                        { ...order, status: order.status || 'pending', issued_by_name: issuedByName },
                                        `${order.first_name || ''} ${order.last_name || ''}`.trim(),
                                        itemRows || [],
                                        invoiceRecord.invoice_number || safeInvoiceNumber,
                                        absPath,
                                        {
                                            issuedBy: issuedByName,
                                            paidBy: order.paid_by_name || '',
                                            contactNumber: order.contact_number || ''
                                        }
                                    );

                                    db.query('UPDATE invoices SET invoice_pdf_path = ? WHERE invoice_id = ?', [publicPath, invoiceRecord.invoice_id]);
                                    db.query('UPDATE orders SET invoice_pdf_path = ? WHERE order_id = ?', [publicPath, order_id]);

                                    return res.json({
                                        message: invoiceResults.length > 0 ? 'Invoice already exists' : 'Invoice generated successfully',
                                        invoice: {
                                            ...invoiceRecord,
                                            invoice_pdf_path: publicPath,
                                            issued_by_name: issuedByName
                                        },
                                        order,
                                        notes: notes || ''
                                    });
                                }
                            );
                        } catch (pdfErr) {
                            return res.status(500).json({ message: 'Failed to generate invoice PDF' });
                        }
                        };

                        if (invoiceResults.length > 0) {
                            db.query(
                                'UPDATE invoices SET issued_by_user_id = ?, issued_by_name = ? WHERE invoice_id = ?',
                                [userId || null, issuedByName, invoiceResults[0].invoice_id]
                            );
                            return generatePdfAndRespond({ ...invoiceResults[0], issued_by_name: issuedByName });
                        }

                        const invoiceNumber = buildInvoiceNumber(order);
                        db.query(
                            'INSERT INTO invoices (order_id, invoice_number, payment_method, invoice_pdf_path, issued_by_user_id, issued_by_name) VALUES (?, ?, ?, ?, ?, ?)',
                            [order_id, invoiceNumber, order.payment_method || 'cash_on_store', null, userId || null, issuedByName],
                            (insertErr, insertResult) => {
                                if (insertErr) return res.status(500).json({ message: 'Invoice creation failed' });

                                return generatePdfAndRespond({
                                    invoice_id: insertResult.insertId,
                                    order_id,
                                    invoice_number: invoiceNumber,
                                    payment_method: order.payment_method || 'cash_on_store',
                                    invoice_pdf_path: null,
                                    issued_by_name: issuedByName,
                                    created_at: new Date()
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});

// --- 27BA. WORKER/ADMIN MANUAL INVOICE STATUS UPDATE (PAID OR CANCELLED) ---
function sendPaymentConfirmationInvoiceEmail(orderId, requestedByUserId, callback) {
    const sql = `
        SELECT o.order_id, o.order_number, o.order_date, o.total_amount, o.created_at, o.status, o.payment_method,
               o.paid_by_name, o.paid_by_user_id,
               u.user_id, u.email, u.first_name, u.last_name,
               i.invoice_id, i.invoice_number, i.invoice_pdf_path, i.issued_by_name
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        LEFT JOIN invoices i ON o.order_id = i.order_id
        WHERE o.order_id = ?
        LIMIT 1
    `;

    const fail = (message, status = 500) => {
        const error = new Error(message);
        error.status = status;
        callback(error);
    };

    db.query(sql, [orderId], (orderErr, orderRows) => {
        if (orderErr) return fail('Database error', 500);
        if (!orderRows || orderRows.length === 0) return fail('Order not found', 404);

        const row = orderRows[0];
        if (!row.email) return fail('Customer email is missing for this order', 400);

        const sendEmail = (payload) => {
            const invoiceUrl = payload.invoice_pdf_path
                ? `${APP_BASE_URL}${payload.invoice_pdf_path}`
                : `${APP_BASE_URL}/api/orders/${payload.order_id}/invoice-pdf?userId=${payload.user_id}`;

            const mailOptions = {
                from: 'tongtongornamental@gmail.com',
                to: payload.email,
                subject: `Payment Confirmed - Order ${getOrderDisplayNumber(payload)} - ${new Date(payload.created_at).toLocaleDateString()} (Invoice ${payload.invoice_number})`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2>TongTong Ornamental Fish Store</h2>
                        <p>Hello ${payload.first_name || ''} ${payload.last_name || ''},</p>
                        <p>Your in-store payment for <strong>Order ${getOrderDisplayNumber(payload)}</strong> has been confirmed.</p>
                        <p><strong>Internal Order ID:</strong> #${payload.order_id}</p>
                        <p><strong>Invoice Number:</strong> ${payload.invoice_number}</p>
                        <p><strong>Order Date:</strong> ${new Date(payload.created_at).toLocaleString()}</p>
                        <p><strong>Payment Confirmation Date:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Total Amount:</strong> PHP ${Number(payload.total_amount || 0).toFixed(2)}</p>
                        <p><strong>Prepared By:</strong> ${payload.issued_by_name || 'Store Staff'}</p>
                        <p><strong>Payment Confirmed By:</strong> ${payload.paid_by_name || 'Store Staff'}</p>
                        <p>Your updated invoice PDF is available here:</p>
                        <p><a href="${invoiceUrl}" target="_blank" rel="noopener noreferrer">Download Updated Invoice PDF</a></p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (mailErr) => {
                if (mailErr) return callback(mailErr);

                db.query(
                    'INSERT INTO invoice_requests (invoice_id, requested_by, email_sent) VALUES (?, ?, 1)',
                    [payload.invoice_id, requestedByUserId || payload.paid_by_user_id || payload.user_id],
                    () => callback(null)
                );
            });
        };

        if (row.invoice_id) {
            return sendEmail(row);
        }

        const generatedInvoiceNumber = buildInvoiceNumber(row);
        db.query(
            'INSERT INTO invoices (order_id, invoice_number, payment_method, invoice_pdf_path, issued_by_user_id, issued_by_name) VALUES (?, ?, ?, ?, ?, ?)',
            [
                row.order_id,
                generatedInvoiceNumber,
                row.payment_method || 'cash_on_store',
                null,
                requestedByUserId || row.paid_by_user_id || null,
                row.paid_by_name || null
            ],
            (insertErr, insertResult) => {
                if (insertErr) return fail('Failed to create invoice record for this order', 500);

                return sendEmail({
                    ...row,
                    invoice_id: insertResult.insertId,
                    invoice_number: generatedInvoiceNumber,
                    invoice_pdf_path: null
                });
            }
        );
    });
}

app.put('/api/worker/invoice/:orderId/status', checkRole(['admin', 'worker']), (req, res) => {
    const { orderId } = req.params;
    const status = String(req.body?.status || '').toLowerCase();
    const actorUserId = Number(req.body?.userId || 0);

    if (!['paid', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Status must be paid or cancelled' });
    }

    const mappedOrderStatus = status === 'paid' ? 'completed' : 'cancelled';
    const cancellationStatus = status === 'cancelled' ? 'approved' : 'none';

    db.query('SELECT invoice_id FROM invoices WHERE order_id = ? LIMIT 1', [orderId], (invoiceErr, invoiceRows) => {
        if (invoiceErr) return res.status(500).json({ message: 'Database error' });
        if (invoiceRows.length === 0) {
            return res.status(400).json({ message: 'Generate invoice first before setting Paid/Cancelled' });
        }

        db.query('SELECT first_name, last_name FROM user_accounts WHERE user_id = ? LIMIT 1', [actorUserId], (actorErr, actorRows) => {
            if (actorErr) return res.status(500).json({ message: 'Database error' });

            const actorName = actorRows.length > 0
                ? `${actorRows[0].first_name || ''} ${actorRows[0].last_name || ''}`.trim()
                : null;

            db.query(
                `UPDATE orders
                 SET status = ?,
                     cancellation_status = ?,
                     paid_by_user_id = ?,
                     paid_by_name = ?
                 WHERE order_id = ?`,
                [
                    mappedOrderStatus,
                    cancellationStatus,
                    status === 'paid' ? (actorUserId || null) : null,
                    status === 'paid' ? actorName : null,
                    orderId
                ],
                (err) => {
                    if (err) return res.status(500).json({ message: 'Database error' });
                    if (status !== 'paid') {
                        return res.json({ message: 'Invoice payment status updated successfully' });
                    }

                    return sendPaymentConfirmationInvoiceEmail(orderId, actorUserId, (mailErr) => {
                        if (mailErr) {
                            console.error(`Auto invoice email failed for order ${orderId}:`, mailErr.message || mailErr);
                            return res.json({
                                message: 'Invoice payment status updated successfully',
                                warning: 'Payment updated, but invoice email could not be sent automatically'
                            });
                        }

                        return res.json({ message: 'Invoice payment status updated and email sent successfully' });
                    });
                }
            );
        });
    });
});

// --- 27BB. WORKER/ADMIN SEND INVOICE EMAIL TO CLIENT ---
app.post('/api/worker/send-invoice-email', checkRole(['admin', 'worker']), (req, res) => {
    const { order_id, userId } = req.body;

    if (!order_id) {
        return res.status(400).json({ message: 'Order ID is required' });
    }

    sendPaymentConfirmationInvoiceEmail(order_id, Number(userId || 0), (mailErr) => {
        if (mailErr) {
            return res.status(mailErr.status || 500).json({ message: mailErr.message || 'Failed to send invoice email' });
        }
        return res.json({ message: 'Invoice email sent successfully' });
    });
});

// --- 27BC. CLIENT/STAFF INVOICE PDF DOWNLOAD ---
app.get('/api/orders/:orderId/invoice-pdf', (req, res) => {
    const { orderId } = req.params;
    const requesterUserId = Number(req.query.userId || 0);

    if (!requesterUserId) {
        return res.status(401).json({ message: 'User ID is required' });
    }

    const accessSql = `
        SELECT o.order_id, o.order_number, o.order_date, o.user_id, o.total_amount, o.created_at, o.status,
             o.paid_by_name,
               u.email, u.first_name, u.last_name,
               r.role_name,
             i.invoice_id, i.invoice_number, i.invoice_pdf_path, i.issued_by_name
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        JOIN user_accounts ru ON ru.user_id = ?
        JOIN roles r ON ru.role_id = r.role_id
        LEFT JOIN invoices i ON o.order_id = i.order_id
        WHERE o.order_id = ?
        LIMIT 1
    `;

    db.query(accessSql, [requesterUserId, orderId], (accessErr, rows) => {
        if (accessErr) return res.status(500).json({ message: 'Database error' });
        if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const row = rows[0];
        const requesterRole = String(row.role_name || '').toLowerCase();
        const isStaff = requesterRole === 'admin' || requesterRole === 'worker' || requesterRole === 'moderator';
        const isOwner = Number(row.user_id) === requesterUserId;

        if (!isStaff && !isOwner) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!row.invoice_id) {
            return res.status(404).json({ message: 'Invoice not found for this order' });
        }

        const sendPdf = (pdfPath) => {
            const absolute = path.join(__dirname, pdfPath.replace(/^\//, ''));
            if (!fs.existsSync(absolute)) {
                return res.status(404).json({ message: 'Invoice PDF file not found' });
            }
            return res.download(absolute, `${row.invoice_number || `invoice-${orderId}`}.pdf`);
        };

        if (row.invoice_pdf_path) {
            return sendPdf(row.invoice_pdf_path);
        }

        db.query(
            'SELECT oi.quantity, oi.price, p.name FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?',
            [orderId],
            async (itemsErr, itemRows) => {
                if (itemsErr) return res.status(500).json({ message: 'Database error' });

                const safeInvoiceNumber = (row.invoice_number || buildInvoiceNumber(row)).replace(/[^A-Za-z0-9-_]/g, '_');
                const fileName = `${safeInvoiceNumber}.pdf`;
                const absPath = path.join(invoiceUploadDir, fileName);
                const publicPath = `/uploads/invoices/${fileName}`;

                try {
                    await buildInvoicePdf(
                        {
                            ...row,
                            order_id: Number(orderId),
                            total_amount: row.total_amount,
                            created_at: row.created_at,
                            status: row.status,
                            issued_by_name: row.issued_by_name,
                            paid_by_name: row.paid_by_name
                        },
                        `${row.first_name || ''} ${row.last_name || ''}`.trim(),
                        itemRows || [],
                        row.invoice_number || safeInvoiceNumber,
                        absPath,
                        {
                            issuedBy: row.issued_by_name || '',
                            paidBy: row.paid_by_name || '',
                            contactNumber: row.contact_number || ''
                        }
                    );

                    db.query('UPDATE invoices SET invoice_pdf_path = ? WHERE invoice_id = ?', [publicPath, row.invoice_id]);
                    db.query('UPDATE orders SET invoice_pdf_path = ? WHERE order_id = ?', [publicPath, orderId]);

                    return sendPdf(publicPath);
                } catch (pdfErr) {
                    return res.status(500).json({ message: 'Failed to generate invoice PDF' });
                }
            }
        );
    });
});

// --- 27C. WORKER/ADMIN EMAIL RECEIPT HISTORY ---
app.get('/api/worker/email-receipts', checkRole(['admin', 'worker']), (req, res) => {
    const sql = `SELECT ir.request_id AS email_id,
                        ir.invoice_id,
                        ir.request_time AS sent_at,
                        ir.email_sent,
                        o.order_id,
                        o.created_at AS order_date,
                        u.user_id,
                        u.email AS email_address,
                        u.first_name,
                        u.last_name,
                        i.invoice_number
                 FROM invoice_requests ir
                 JOIN invoices i ON ir.invoice_id = i.invoice_id
                 JOIN orders o ON i.order_id = o.order_id
                 JOIN user_accounts u ON o.user_id = u.user_id
                 ORDER BY ir.request_time DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        res.json(results.map(row => ({
            email_id: row.email_id,
            invoice_id: row.invoice_id,
            order_id: row.order_id,
            order_date: row.order_date,
            customer_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            email_address: row.email_address,
            email_status: row.email_sent ? 'sent' : 'pending',
            sent_at: row.sent_at,
            invoice_number: row.invoice_number
        })));
    });
});

// --- 27D. WORKER/ADMIN CASH REGISTER ---
app.get('/api/worker/cash-register', checkRole(['admin', 'worker']), (req, res) => {
    const summarySql = `
        SELECT
            COALESCE((
                SELECT SUM(CASE WHEN payment_method LIKE 'cash%' THEN total_amount ELSE 0 END)
                FROM orders
                WHERE status = 'completed' AND DATE(updated_at) = CURDATE()
            ), 0) AS totalCash,
            COALESCE((
                SELECT SUM(CASE WHEN payment_method LIKE 'card%' OR payment_method LIKE 'gcash%' OR payment_method LIKE 'online%' THEN total_amount ELSE 0 END)
                FROM orders
                WHERE status = 'completed' AND DATE(updated_at) = CURDATE()
            ), 0) AS totalCard,
            COALESCE((
                SELECT SUM(CASE WHEN payment_method LIKE 'cash%' THEN total_amount ELSE 0 END)
                FROM orders
                WHERE status = 'completed' AND DATE(updated_at) = CURDATE()
            ), 0)
                + COALESCE((
                    SELECT SUM(CASE WHEN entry_type = 'cash-adjustment' THEN amount ELSE 0 END)
                    FROM cash_register_entries
                    WHERE DATE(created_at) = CURDATE()
                ), 0)
                - COALESCE((
                    SELECT SUM(CASE WHEN entry_type IN ('cash-return', 'cash-expense') THEN amount ELSE 0 END)
                    FROM cash_register_entries
                    WHERE DATE(created_at) = CURDATE()
                ), 0) AS expectedCash,
            COALESCE((
                SELECT actual_cash
                FROM cash_register_reconciliations
                ORDER BY created_at DESC
                LIMIT 1
            ), 0) AS actualCash,
            COALESCE((
                SELECT COUNT(*)
                FROM orders
                WHERE status = 'completed' AND DATE(updated_at) = CURDATE()
            ), 0) AS transactionCount`;

    const entriesSql = `
        SELECT
            e.entry_id,
            e.entry_type,
            e.amount,
            e.description,
            e.created_at,
            u.first_name,
            u.last_name
        FROM cash_register_entries e
        JOIN user_accounts u ON e.user_id = u.user_id
        WHERE DATE(e.created_at) = CURDATE()
        ORDER BY e.created_at DESC`;

    const pendingInvoicesSql = `
        SELECT
            o.order_id,
            o.order_number,
            o.total_amount,
            o.status,
            o.created_at,
            o.payment_method,
            u.email,
            u.contact_number,
            CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
            i.invoice_id,
            i.invoice_number
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        LEFT JOIN invoices i ON o.order_id = i.order_id
        WHERE o.status IN ('pending', 'processing')
        ORDER BY o.created_at DESC`;

    db.query(summarySql, (summaryErr, summaryResults) => {
        if (summaryErr) return res.status(500).json({ message: 'Database error' });

        db.query(entriesSql, (entriesErr, entriesResults) => {
            if (entriesErr) return res.status(500).json({ message: 'Database error' });

            db.query(pendingInvoicesSql, (pendingErr, pendingRows) => {
                if (pendingErr) return res.status(500).json({ message: 'Database error' });

                const summary = summaryResults[0] || {};
                const expectedCash = Number(summary.expectedCash || 0);
                const actualCash = Number(summary.actualCash || 0);

                res.json({
                    summary: {
                        totalCash: Number(summary.totalCash || 0),
                        totalCard: Number(summary.totalCard || 0),
                        expectedCash,
                        actualCash,
                        discrepancy: actualCash - expectedCash,
                        transactionCount: Number(summary.transactionCount || 0)
                    },
                    transactions: entriesResults.map(entry => ({
                        entry_id: entry.entry_id,
                        type: entry.entry_type,
                        amount: entry.amount,
                        description: entry.description,
                        timestamp: entry.created_at,
                        user_name: `${entry.first_name || ''} ${entry.last_name || ''}`.trim()
                    })),
                    pendingInvoices: (pendingRows || []).map(row => ({
                        order_id: row.order_id,
                        total_amount: row.total_amount,
                        status: row.status,
                        created_at: row.created_at,
                        payment_method: row.payment_method,
                        email: row.email,
                        contact_number: row.contact_number,
                        customer_name: row.customer_name,
                        invoice_id: row.invoice_id,
                        invoice_number: row.invoice_number,
                        has_invoice: Boolean(row.invoice_id)
                    }))
                });
            });
        });
    });
});

app.put('/api/worker/cash-register/order/:orderId/status', checkRole(['admin', 'worker']), (req, res) => {
    const { orderId } = req.params;
    const { status, userId, paymentMethod = 'cash_on_store', notes = '' } = req.body;

    const normalizedStatus = String(status || '').toLowerCase();
    if (!['paid', 'cancelled'].includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Status must be paid or cancelled' });
    }

    if (normalizedStatus === 'paid') {
        const allowedMethods = ['cash_on_store', 'cash', 'card', 'gcash', 'online'];
        if (!allowedMethods.includes(String(paymentMethod).toLowerCase())) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        const detailsSql = `
            SELECT o.order_id, o.total_amount, o.status,
                   CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                   i.invoice_id, i.invoice_number,
                   CONCAT(s.first_name, ' ', s.last_name) AS staff_name
            FROM orders o
            JOIN user_accounts c ON o.user_id = c.user_id
            LEFT JOIN invoices i ON o.order_id = i.order_id
            LEFT JOIN user_accounts s ON s.user_id = ?
            WHERE o.order_id = ?
            LIMIT 1
        `;

        return db.query(detailsSql, [userId, orderId], (detailsErr, rows) => {
            if (detailsErr) return res.status(500).json({ message: 'Database error' });
            if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });

            const row = rows[0];
            const current = String(row.status || '').toLowerCase();
            if (!row.invoice_id) return res.status(400).json({ message: 'Invoice is required before accepting payment' });
            if (current === 'completed') return res.status(400).json({ message: 'Order is already paid/completed' });
            if (current === 'cancelled') return res.status(400).json({ message: 'Cannot accept payment for a cancelled order' });

            const normalizedMethod = String(paymentMethod).toLowerCase();

            db.query(
                'UPDATE orders SET status = ?, cancellation_status = ?, payment_method = ?, paid_by_user_id = ?, paid_by_name = ? WHERE order_id = ?',
                ['completed', 'none', normalizedMethod, userId, row.staff_name || null, orderId],
                (updateErr) => {
                    if (updateErr) return res.status(500).json({ message: 'Failed to update order status' });

                    if (!normalizedMethod.startsWith('cash')) {
                        return sendPaymentConfirmationInvoiceEmail(orderId, userId, (mailErr) => {
                            if (mailErr) {
                                console.error(`Auto invoice email failed for order ${orderId}:`, mailErr.message || mailErr);
                                return res.json({
                                    message: 'Order marked as paid',
                                    warning: 'Payment updated, but invoice email could not be sent automatically'
                                });
                            }

                            return res.json({ message: 'Order marked as paid and invoice email sent' });
                        });
                    }

                    const detailParts = [
                        `Cash payment accepted for Order #${row.order_id}`,
                        row.invoice_number ? `(Invoice ${row.invoice_number})` : '',
                        `Customer: ${row.customer_name || '-'}`,
                        `By: ${row.staff_name || 'Staff'}`,
                        notes ? `Notes: ${String(notes).trim()}` : ''
                    ].filter(Boolean);

                    const description = detailParts.join(' | ').slice(0, 500);

                    db.query(
                        'INSERT INTO cash_register_entries (user_id, entry_type, amount, description) VALUES (?, ?, ?, ?)',
                        [userId, 'cash', row.total_amount, description],
                        (entryErr) => {
                            if (entryErr) return res.status(500).json({ message: 'Order marked paid, but failed to log cash entry' });
                            return sendPaymentConfirmationInvoiceEmail(orderId, userId, (mailErr) => {
                                if (mailErr) {
                                    console.error(`Auto invoice email failed for order ${orderId}:`, mailErr.message || mailErr);
                                    return res.json({
                                        message: 'Order marked as paid',
                                        warning: 'Payment updated, but invoice email could not be sent automatically'
                                    });
                                }

                                return res.json({ message: 'Order marked as paid and invoice email sent' });
                            });
                        }
                    );
                }
            );
        });
    }

    db.query('SELECT status FROM orders WHERE order_id = ? LIMIT 1', [orderId], (findErr, findRows) => {
        if (findErr) return res.status(500).json({ message: 'Database error' });
        if (findRows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const current = String(findRows[0].status || '').toLowerCase();
        if (current === 'cancelled') return res.status(400).json({ message: 'Order is already cancelled' });
        if (current === 'completed') return res.status(400).json({ message: 'Order is already paid/completed' });

        db.query(
            'UPDATE orders SET status = ?, cancellation_status = ?, paid_by_user_id = NULL, paid_by_name = NULL WHERE order_id = ?',
            ['cancelled', 'approved', orderId],
            (updateErr) => {
                if (updateErr) return res.status(500).json({ message: 'Failed to update order status' });
                return res.json({ message: 'Order marked as cancelled' });
            }
        );
    });
});

app.post('/api/worker/cash-register/accept-payment', checkRole(['admin', 'worker']), (req, res) => {
    const { orderId, paymentMethod, userId, notes } = req.body;

    if (!orderId || !paymentMethod || !userId) {
        return res.status(400).json({ message: 'orderId, paymentMethod, and userId are required' });
    }

    const allowedMethods = ['cash_on_store', 'cash', 'card', 'gcash', 'online'];
    if (!allowedMethods.includes(String(paymentMethod).toLowerCase())) {
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    const detailsSql = `
        SELECT o.order_id, o.total_amount, o.status,
               CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
               i.invoice_id, i.invoice_number,
               CONCAT(s.first_name, ' ', s.last_name) AS staff_name
        FROM orders o
        JOIN user_accounts c ON o.user_id = c.user_id
        LEFT JOIN invoices i ON o.order_id = i.order_id
        LEFT JOIN user_accounts s ON s.user_id = ?
        WHERE o.order_id = ?
        LIMIT 1
    `;

    db.query(detailsSql, [userId, orderId], (detailsErr, rows) => {
        if (detailsErr) return res.status(500).json({ message: 'Database error' });
        if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const row = rows[0];
        if (!row.invoice_id) {
            return res.status(400).json({ message: 'Invoice is required before accepting payment' });
        }
        if (row.status === 'completed') {
            return res.status(400).json({ message: 'Payment already accepted for this order' });
        }
        if (row.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot accept payment for a cancelled order' });
        }

        const normalizedMethod = String(paymentMethod).toLowerCase();
        db.query(
            'UPDATE orders SET status = ?, cancellation_status = ?, payment_method = ?, paid_by_user_id = ?, paid_by_name = ? WHERE order_id = ?',
            ['completed', 'none', normalizedMethod, userId, row.staff_name || null, orderId],
            (updateErr) => {
                if (updateErr) return res.status(500).json({ message: 'Failed to update order payment status' });

                if (!normalizedMethod.startsWith('cash')) {
                    return sendPaymentConfirmationInvoiceEmail(orderId, userId, (mailErr) => {
                        if (mailErr) {
                            console.error(`Auto invoice email failed for order ${orderId}:`, mailErr.message || mailErr);
                            return res.json({
                                message: 'Payment accepted successfully',
                                warning: 'Payment accepted, but invoice email could not be sent automatically'
                            });
                        }

                        return res.json({ message: 'Payment accepted successfully and invoice email sent' });
                    });
                }

                const detailParts = [
                    `Cash payment accepted for Order #${row.order_id}`,
                    row.invoice_number ? `(Invoice ${row.invoice_number})` : '',
                    `Customer: ${row.customer_name || '-'}`,
                    `By: ${row.staff_name || 'Staff'}`,
                    notes ? `Notes: ${String(notes).trim()}` : ''
                ].filter(Boolean);

                const description = detailParts.join(' | ').slice(0, 500);

                db.query(
                    'INSERT INTO cash_register_entries (user_id, entry_type, amount, description) VALUES (?, ?, ?, ?)',
                    [userId, 'cash', row.total_amount, description],
                    (entryErr) => {
                        if (entryErr) return res.status(500).json({ message: 'Payment accepted but failed to log cash entry' });
                        return sendPaymentConfirmationInvoiceEmail(orderId, userId, (mailErr) => {
                            if (mailErr) {
                                console.error(`Auto invoice email failed for order ${orderId}:`, mailErr.message || mailErr);
                                return res.json({
                                    message: 'Payment accepted successfully',
                                    warning: 'Payment accepted, but invoice email could not be sent automatically'
                                });
                            }

                            return res.json({ message: 'Payment accepted successfully and invoice email sent' });
                        });
                    }
                );
            }
        );
    });
});

app.post('/api/worker/cash-register/entry', checkRole(['admin', 'worker']), (req, res) => {
    const { amount, type, description, userId } = req.body;

    if (!amount || !type || !userId) {
        return res.status(400).json({ message: 'Amount, type, and userId are required' });
    }

    const sql = 'INSERT INTO cash_register_entries (user_id, entry_type, amount, description) VALUES (?, ?, ?, ?)';
    db.query(sql, [userId, type, amount, description || null], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to record cash entry' });
        res.json({ message: 'Cash entry recorded successfully' });
    });
});

app.post('/api/worker/cash-register/manual-order', checkRole(['admin', 'worker']), (req, res) => {
    const {
        customer_name,
        email,
        contact_number,
        total_amount,
        subtotal,
        discount_amount,
        discount_type,
        items,
        userId
    } = req.body;

    const normalizedCustomer = String(customer_name || '').trim();
    const normalizedDiscountType = String(discount_type || 'regular').toLowerCase();
    const allowedDiscountTypes = ['regular', 'senior', 'pwd'];

    if (!normalizedCustomer || !total_amount || !userId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Customer name, items, total amount, and userId are required' });
    }

    if (!allowedDiscountTypes.includes(normalizedDiscountType)) {
        return res.status(400).json({ message: 'Invalid discount type' });
    }

    const cleanedItems = items
        .map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
            price: Number(item.price || 0),
            product_name: String(item.product_name || '').trim()
        }))
        .filter((item) => item.product_id > 0 && item.quantity > 0 && item.price >= 0);

    if (cleanedItems.length === 0) {
        return res.status(400).json({ message: 'At least one valid product item is required' });
    }

    const discountRate = normalizedDiscountType === 'regular' ? 0 : 0.05;
    const computedSubtotal = cleanedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const computedDiscount = computedSubtotal * discountRate;
    const computedTotal = Math.max(computedSubtotal - computedDiscount, 0);

    const productIds = [...new Set(cleanedItems.map((item) => item.product_id))];
    const stockPlaceholders = productIds.map(() => '?').join(',');

    db.query(`SELECT product_id, stock FROM products WHERE product_id IN (${stockPlaceholders})`, productIds, (stockErr, stockRows) => {
        if (stockErr) return res.status(500).json({ message: 'Database error' });

        const stockMap = new Map((stockRows || []).map((row) => [Number(row.product_id), Number(row.stock || 0)]));
        for (const item of cleanedItems) {
            const availableStock = stockMap.get(item.product_id);
            if (availableStock === undefined) {
                return res.status(400).json({ message: `Product #${item.product_id} not found` });
            }
            if (item.quantity > availableStock) {
                return res.status(400).json({ message: `Insufficient stock for product #${item.product_id}` });
            }
        }

        // Get worker name
        const workerSql = 'SELECT first_name, last_name FROM user_accounts WHERE user_id = ?';
        db.query(workerSql, [userId], (workerErr, workerRows) => {
            if (workerErr) return res.status(500).json({ message: 'Database error' });

            const workerName = workerRows.length > 0 ? `${workerRows[0].first_name} ${workerRows[0].last_name}` : 'Staff';

            // Create order without user_id (manual order)
            const orderSql = `
                INSERT INTO orders (customer_name, email, contact_number, total_amount, status, payment_method, paid_by_user_id, paid_by_name, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'completed', 'cash', ?, ?, NOW(), NOW())
            `;

            db.query(orderSql, [normalizedCustomer, email || null, contact_number || null, computedTotal, userId, workerName], (orderErr, orderResult) => {
                if (orderErr) return res.status(500).json({ message: 'Failed to create manual order' });

                const orderId = orderResult.insertId;
                assignDailyOrderNumber(orderId, (orderNumberErr, dailyOrderNumber) => {
                    if (orderNumberErr) return res.status(500).json({ message: 'Order created but failed to assign daily order number' });
                const unitDiscount = discountRate;

                let processedItems = 0;
                for (const item of cleanedItems) {
                    const perUnitDiscountValue = Number((item.price * unitDiscount).toFixed(2));

                    db.query(
                        'INSERT INTO order_items (order_id, product_id, quantity, price, unit_discount) VALUES (?, ?, ?, ?, ?)',
                        [orderId, item.product_id, item.quantity, item.price, perUnitDiscountValue],
                        (itemErr) => {
                            if (itemErr) return res.status(500).json({ message: 'Failed to save manual order items' });

                            db.query('UPDATE products SET stock = stock - ? WHERE product_id = ?', [item.quantity, item.product_id], (stockUpdateErr) => {
                                if (stockUpdateErr) return res.status(500).json({ message: 'Failed to update product stock' });

                                processedItems += 1;
                                if (processedItems !== cleanedItems.length) return;

                                // Generate invoice
                                const invoiceSql = `
                                    INSERT INTO invoices (order_id, invoice_number, customer_name, email, contact_number, total_amount, issued_by_user_id, issued_by_name, status, created_at)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', NOW())
                                `;

                                const invoiceNumber = buildInvoiceNumber({ order_id: orderId, order_number: dailyOrderNumber, created_at: new Date() });
                                db.query(invoiceSql, [orderId, invoiceNumber, normalizedCustomer, email || null, contact_number || null, computedTotal, userId, workerName], (invoiceErr) => {
                                    if (invoiceErr) return res.status(500).json({ message: 'Order created but failed to generate invoice' });

                                    // Log transaction
                                    const logSql = `
                                        INSERT INTO transaction_logs (order_id, transaction_type, customer_name, amount, description, processed_by_user_id, processed_by_name, created_at)
                                        VALUES (?, 'payment', ?, ?, ?, ?, ?, NOW())
                                    `;

                                    const itemSummary = cleanedItems
                                        .map((item) => `${item.product_name || `#${item.product_id}`} x${item.quantity}`)
                                        .join(', ')
                                        .slice(0, 220);

                                    const description = `Manual walk-in order | Items: ${itemSummary} | Subtotal: ₱${computedSubtotal.toFixed(2)} | Discount: ${normalizedDiscountType.toUpperCase()} -₱${computedDiscount.toFixed(2)} | Total: ₱${computedTotal.toFixed(2)}`.slice(0, 500);

                                    db.query(logSql, [orderId, normalizedCustomer, computedTotal, description, userId, workerName], (logErr) => {
                                        if (logErr) return res.status(500).json({ message: 'Order and invoice created but failed to log transaction' });

                                        // Record cash entry
                                        const entrySql = `
                                            INSERT INTO cash_register_entries (user_id, entry_type, amount, description)
                                            VALUES (?, 'cash', ?, ?)
                                        `;

                                        const entryDesc = `Walk-in customer: ${normalizedCustomer} | Total: ₱${computedTotal.toFixed(2)} | Discount: ${normalizedDiscountType.toUpperCase()}`.slice(0, 500);
                                        db.query(entrySql, [userId, computedTotal, entryDesc], (entryErr) => {
                                            if (entryErr) return res.status(500).json({ message: 'Order created but failed to record cash entry' });
                                            res.json({
                                                message: 'Walk-in order created and marked as paid successfully',
                                                orderId,
                                                orderNumber: String(dailyOrderNumber).padStart(3, '0'),
                                                invoiceNumber,
                                                totals: {
                                                    subtotal: Number(subtotal || computedSubtotal),
                                                    discount: Number(discount_amount || computedDiscount),
                                                    total: Number(total_amount || computedTotal)
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    );
                }
                });
            });
        });
    });
});

app.get('/api/worker/cash-register/order/:orderId/details', checkRole(['admin', 'worker']), (req, res) => {
    const { orderId } = req.params;

    const orderSql = `
        SELECT o.order_id, o.order_number, o.order_date, o.user_id, o.status, o.created_at, o.payment_method, o.total_amount,
               u.first_name, u.last_name, u.email, u.contact_number,
               u.is_senior, u.is_pwd, u.senior_verified, u.pwd_verified,
                         i.invoice_id, i.invoice_number, i.issued_by_name, i.created_at AS invoice_created_at
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        LEFT JOIN invoices i ON i.order_id = o.order_id
        WHERE o.order_id = ?
        LIMIT 1
    `;

    const itemsSql = `
        SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.price, oi.unit_discount, p.name
        FROM order_items oi
        JOIN products p ON p.product_id = oi.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.order_item_id ASC
    `;

    db.query(orderSql, [orderId], (orderErr, orderRows) => {
        if (orderErr) return res.status(500).json({ message: 'Database error' });
        if (orderRows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const order = orderRows[0];

        db.query(itemsSql, [orderId], (itemsErr, itemsRows) => {
            if (itemsErr) return res.status(500).json({ message: 'Database error' });

            const items = (itemsRows || []).map((item) => {
                const quantity = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                const unitDiscount = Number(item.unit_discount || 0);
                const lineSubtotal = quantity * price;
                const lineDiscount = quantity * unitDiscount;
                const lineTotal = lineSubtotal - lineDiscount;

                return {
                    order_item_id: item.order_item_id,
                    product_id: item.product_id,
                    product_name: item.name,
                    quantity,
                    price,
                    unit_discount: unitDiscount,
                    line_subtotal: lineSubtotal,
                    line_discount: lineDiscount,
                    line_total: lineTotal
                };
            });

            const subtotal = items.reduce((sum, item) => sum + item.line_subtotal, 0);
            const discount = items.reduce((sum, item) => sum + item.line_discount, 0);
            const total = items.reduce((sum, item) => sum + item.line_total, 0);
            const hasVerifiedDiscount = (order.is_senior && order.senior_verified) || (order.is_pwd && order.pwd_verified);

            res.json({
                order: {
                    order_id: order.order_id,
                    status: order.status,
                    created_at: order.created_at,
                    payment_method: order.payment_method,
                    total_amount: Number(order.total_amount || total),
                    invoice_id: order.invoice_id || null,
                    invoice_number: order.invoice_number || null,
                    has_invoice: Boolean(order.invoice_id),
                    customer_name: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
                    email: order.email,
                    contact_number: order.contact_number
                },
                items,
                summary: {
                    subtotal,
                    discount,
                    total: Number(order.total_amount || total),
                    has_verified_discount: Boolean(hasVerifiedDiscount)
                }
            });
        });
    });
});

app.put('/api/worker/cash-register/reconcile', checkRole(['admin', 'worker']), (req, res) => {
    const { actualCash, userId } = req.body;

    if (actualCash === undefined || !userId) {
        return res.status(400).json({ message: 'Actual cash and userId are required' });
    }

    const sql = 'INSERT INTO cash_register_reconciliations (user_id, actual_cash) VALUES (?, ?)';
    db.query(sql, [userId, actualCash], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to update reconciliation' });
        res.json({ message: 'Cash reconciliation updated successfully' });
    });
});

// --- 27D. WORKER/ADMIN TRANSACTION LOG ---
app.get('/api/worker/transaction-log', checkRole(['admin', 'worker']), (req, res) => {
    const isAdmin = req.userRole === 'admin';
    const roleFilter = '';

    const sql = `
        SELECT * FROM (
            SELECT
                CONCAT('order-', o.order_id) AS transaction_id,
                'order' AS transaction_type,
                o.order_id,
                o.total_amount AS amount,
                o.created_at AS timestamp,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                CONCAT('Order placed for ₱', FORMAT(o.total_amount, 2)) AS description
            FROM orders o
            JOIN user_accounts u ON o.user_id = u.user_id
            JOIN roles r ON u.role_id = r.role_id
            ${roleFilter}

            UNION ALL

            SELECT
                CONCAT('invoice-', i.invoice_id) AS transaction_id,
                'invoice' AS transaction_type,
                o.order_id,
                o.total_amount AS amount,
                i.created_at AS timestamp,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                CONCAT(
                    'Invoice generated: ',
                    i.invoice_number,
                    ' | Prepared by: ',
                    COALESCE(i.issued_by_name, 'Not recorded')
                ) AS description
            FROM invoices i
            JOIN orders o ON i.order_id = o.order_id
            JOIN user_accounts u ON o.user_id = u.user_id
            JOIN roles r ON u.role_id = r.role_id
            ${roleFilter}

            UNION ALL

            SELECT
                CONCAT('payment-', o.order_id, '-', UNIX_TIMESTAMP(o.updated_at)) AS transaction_id,
                'payment' AS transaction_type,
                o.order_id,
                o.total_amount AS amount,
                o.updated_at AS timestamp,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                CONCAT(
                    'Payment confirmed',
                    IF(i.invoice_number IS NOT NULL, CONCAT(' for ', i.invoice_number), ''),
                    ' via ',
                    COALESCE(o.payment_method, 'unknown'),
                    ' | Confirmed by: ',
                    COALESCE(o.paid_by_name, 'Not recorded')
                ) AS description
            FROM orders o
            JOIN user_accounts u ON o.user_id = u.user_id
            LEFT JOIN invoices i ON i.order_id = o.order_id
            JOIN roles r ON u.role_id = r.role_id
            WHERE o.status = 'completed'


            UNION ALL

            SELECT
                CONCAT('email-', ir.request_id) AS transaction_id,
                'email' AS transaction_type,
                o.order_id,
                o.total_amount AS amount,
                ir.request_time AS timestamp,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                CONCAT(
                    'Invoice email sent',
                    ' | Sent by: ',
                    COALESCE(CONCAT(sender.first_name, ' ', sender.last_name), 'System')
                ) AS description
            FROM invoice_requests ir
            JOIN invoices i ON ir.invoice_id = i.invoice_id
            JOIN orders o ON i.order_id = o.order_id
            JOIN user_accounts u ON o.user_id = u.user_id
            LEFT JOIN user_accounts sender ON sender.user_id = ir.requested_by
            JOIN roles r ON u.role_id = r.role_id
            ${roleFilter}

            UNION ALL

            SELECT
                CONCAT('review-', pr.review_id) AS transaction_id,
                'review' AS transaction_type,
                NULL AS order_id,
                0 AS amount,
                pr.created_at AS timestamp,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                CONCAT('Review submitted for product #', pr.product_id) AS description
            FROM product_reviews pr
            JOIN user_accounts u ON pr.user_id = u.user_id
            JOIN roles r ON u.role_id = r.role_id
            ${roleFilter}
        ) AS logs
        ORDER BY timestamp DESC
        LIMIT 500`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        res.json(results.map(row => ({
            transaction_id: row.transaction_id,
            transaction_type: row.transaction_type,
            order_id: row.order_id,
            amount: row.amount,
            timestamp: row.timestamp,
            customer_name: row.customer_name,
            description: row.description
        })));
    });
});

// --- 27E. WORKER/ADMIN REVIEW LIST ---
app.get('/api/worker/reviews', checkRole(['admin', 'worker']), (req, res) => {
    const sql = `SELECT pr.review_id, pr.product_id, pr.user_id, pr.rating, pr.review_text, pr.created_at,
                        p.name AS product_name,
                        u.first_name, u.last_name, u.email
                 FROM product_reviews pr
                 JOIN products p ON pr.product_id = p.product_id
                 JOIN user_accounts u ON pr.user_id = u.user_id
                 ORDER BY pr.created_at DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        const reviews = results.map(row => ({
            review_id: row.review_id,
            product_id: row.product_id,
            product_name: row.product_name,
            user_id: row.user_id,
            customer_name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            email: row.email,
            rating: row.rating,
            review_text: row.review_text,
            created_at: row.created_at,
            review_date: row.created_at
        }));

        res.json({ reviews });
    });
});

// Function to generate receipt HTML
function generateReceiptHtml(order, items, userName) {
    const itemsHtml = items.map(item => {
        const originalTotal = item.quantity * item.price;
        const discountTotal = item.quantity * item.unit_discount;
        const discountedTotal = originalTotal - discountTotal;
        return `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>₱${item.unit_discount.toFixed(2)}</td>
            <td>₱${discountedTotal.toFixed(2)}</td>
        </tr>
    `}).join('');
    
    const totalDiscount = items.reduce((sum, item) => sum + (item.quantity * item.unit_discount), 0);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .receipt { border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; font-size: 18px; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>TongTong Ornamental Fish Store</h1>
                <h2>Order Receipt</h2>
            </div>
            
            <div class="receipt">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${getOrderDisplayNumber(order)}</p>
                <p><strong>Internal Order ID:</strong> #${order.order_id}</p>
                <p><strong>Customer:</strong> ${userName}</p>
                <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Shipping Address:</strong> ${order.shipping_address}</p>
                
                <h3>Items Ordered</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Discount</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <p><strong>Total Discount:</strong> ₱${totalDiscount.toFixed(2)}</p>
                <p class="total">Total Amount: ₱${order.total_amount.toFixed(2)}</p>
                <p style="color: red; font-weight: bold;">Please show this receipt at the store to pay and get your order.</p>
            </div>
            
            <div class="footer">
                <p>Thank you for shopping with TongTong Ornamental Fish Store!</p>
                <p>If you have any questions, please contact us at tongtongornamental@gmail.com</p>
            </div>
        </body>
        </html>
    `;
}

// Function to generate cancellation confirmation email
function generateCancellationInvoice(userData, orderItems, cancellationRequest, approvalName) {
    const formattedDate = new Date(userData.created_at).toLocaleDateString();
    const approvalDate = new Date().toLocaleDateString();
    
    const itemsHtml = orderItems.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td>₱${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                .header h1 { margin: 0; }
                .content { background: #f9f9f9; padding: 20px; }
                .section { margin: 20px 0; }
                .status-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .status-box.approved { background: #d4edda; border-left-color: #28a745; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                table th { background: #667eea; color: white; padding: 10px; text-align: left; }
                table td { padding: 10px; border-bottom: 1px solid #ddd; }
                .total { font-weight: bold; font-size: 18px; color: #764ba2; }
                .footer { color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Order Cancellation Confirmed</h1>
                    <p>Your order has been successfully cancelled</p>
                </div>
                
                <div class="content">
                    <p>Dear ${userData.first_name} ${userData.last_name},</p>
                    
                    <p>This is to confirm that your order cancellation request has been <strong>APPROVED</strong>.</p>
                    
                    <div class="status-box approved">
                        <h3 style="margin-top: 0; color: #28a745;">✓ Cancellation Status: APPROVED</h3>
                        <p><strong>Order Number:</strong> ${getOrderDisplayNumber(userData)}</p>
                        <p><strong>Internal Order ID:</strong> #${userData.order_id}</p>
                        <p><strong>Original Order Date:</strong> ${formattedDate}</p>
                        <p><strong>Cancellation Approved Date:</strong> ${approvalDate}</p>
                        <p><strong>Approved By:</strong> ${approvalName || 'Store Staff'}</p>
                        <p><strong>Cancellation Reason:</strong> ${cancellationRequest.reason || 'Not specified'}</p>
                    </div>
                    
                    <div class="section">
                        <h3>Cancelled Items:</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Thank you for understanding. We appreciate your business!</p>
                    <p>For questions or concerns about this cancellation, please contact us at <strong>tongtongornamental@gmail.com</strong></p>
                    <p style="margin-top: 20px; color: #999;">TongTong Ornamental Fish Store | All Rights Reserved</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// --- 20. GET USER ORDERS ---
app.get('/api/orders/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC";
    
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 21. GET ORDER DETAILS ---
app.get('/api/orders/:orderId/items', (req, res) => {
    const { orderId } = req.params;
    const sql = `SELECT oi.*, p.name, p.image_url FROM order_items oi
                 JOIN products p ON oi.product_id = p.product_id
                 WHERE oi.order_id = ?`;
    
    db.query(sql, [orderId], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 22. GET ORDER RECEIPT ---
app.get('/api/orders/:orderId/receipt', (req, res) => {
    const { orderId } = req.params;
    
    // Get order details
    db.query("SELECT o.*, u.first_name, u.last_name FROM orders o JOIN user_accounts u ON o.user_id = u.user_id WHERE o.order_id = ?", [orderId], (err, orderResult) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (orderResult.length === 0) return res.status(404).json({ message: "Order not found" });
        
        const order = orderResult[0];
        const userName = `${order.first_name} ${order.last_name}`;
        
        // Get order items
        db.query(`SELECT oi.*, p.name FROM order_items oi
                 JOIN products p ON oi.product_id = p.product_id
                 WHERE oi.order_id = ?`, [orderId], (err, itemsResult) => {
            if (err) return res.status(500).json({ message: "Database error" });
            
            const receiptHtml = generateReceiptHtml(order, itemsResult, userName);
            res.send(receiptHtml);
        });
    });
});

// --- 26. GET ORDER INVOICE ---
app.get('/api/orders/:orderId/invoice', (req, res) => {
    const { orderId } = req.params;
    const sql = `SELECT i.*, o.user_id, o.total_amount, o.shipping_address FROM invoices i
                 JOIN orders o ON i.order_id = o.order_id
                 WHERE i.order_id = ?`;

    db.query(sql, [orderId], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length === 0) return res.status(404).json({ message: "Invoice not found" });
        res.json(results[0]);
    });
});

// --- 27. GET ALL INVOICES (Admin Only) ---
app.get('/api/admin/invoices', checkRole('admin'), (req, res) => {
    const sql = `SELECT i.*, u.email, u.first_name, u.last_name FROM invoices i
                 JOIN orders o ON i.order_id = o.order_id
                 JOIN user_accounts u ON o.user_id = u.user_id
                 ORDER BY i.created_at DESC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 24. GET BACKGROUND SETTINGS ---
app.get('/api/background-settings', (req, res) => {
    const sql = "SELECT * FROM background_settings";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 25. UPDATE BACKGROUND SETTINGS (Admin Only) ---
app.put('/api/background-settings/:settingName', checkRole('admin'), (req, res) => {
    const { settingName } = req.params;
    const { settingValue } = req.body;

    const sql = "UPDATE background_settings SET setting_value = ? WHERE setting_name = ?";
    db.query(sql, [settingValue, settingName], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.affectedRows > 0) {
            return res.json({ message: "Background setting updated" });
        }

        db.query(
            "INSERT INTO background_settings (setting_id, setting_name, setting_value, description) SELECT COALESCE(MAX(setting_id), 0) + 1, ?, ?, ? FROM background_settings",
            [settingName, settingValue, `Website setting: ${settingName}`],
            (insertErr) => {
                if (insertErr) return res.status(500).json({ message: "Database error" });
                res.json({ message: "Background setting updated" });
            }
        );
    });
});

// --- 23. UPDATE ORDER STATUS (Admin Only) ---
app.put('/api/orders/:orderId', checkRole('admin'), (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const actorUserId = Number(req.body?.userId || req.query?.userId || req.headers['x-user-id'] || 0);
    const rawStatus = String(status || '').toLowerCase();
    const normalizedStatus = rawStatus === 'processing' ? 'pending' : rawStatus;
    const allowedStatuses = new Set(['pending', 'completed', 'cancelled']);

    if (!allowedStatuses.has(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid order status' });
    }

    db.query('SELECT status FROM orders WHERE order_id = ?', [orderId], (findErr, rows) => {
        if (findErr) return res.status(500).json({ message: 'Database error' });
        if (!rows || rows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const currentStatus = String(rows[0].status || '').toLowerCase() === 'processing'
            ? 'pending'
            : String(rows[0].status || '').toLowerCase();

        // Lock order status once it leaves pending to avoid accidental reprocessing.
        if (currentStatus !== 'pending') {
            return res.status(400).json({ message: 'This order status is already final and cannot be changed' });
        }

        if (normalizedStatus === 'pending') {
            return res.json({ message: 'Order is still pending' });
        }

        db.query('UPDATE orders SET status = ? WHERE order_id = ?', [normalizedStatus, orderId], (err) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            if (normalizedStatus !== 'completed') {
                return res.json({ message: 'Order updated' });
            }

            return sendPaymentConfirmationInvoiceEmail(orderId, actorUserId, (mailErr) => {
                if (mailErr) {
                    console.error(`Auto invoice email failed for order ${orderId}:`, mailErr.message || mailErr);
                    return res.json({
                        message: 'Order updated',
                        warning: 'Payment updated, but invoice email could not be sent automatically'
                    });
                }

                return res.json({ message: 'Order updated and invoice email sent' });
            });
        });
    });
});

// --- 24. GET ALL ORDERS (Admin Only) ---
app.get('/api/admin/orders', checkRole('admin'), (req, res) => {
    const sql = `
        SELECT o.*, u.email, u.first_name, u.last_name 
        FROM orders o 
        JOIN user_accounts u ON o.user_id = u.user_id 
        ORDER BY o.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        const normalized = (results || []).map((row) => ({
            ...row,
            status: String(row.status || '').trim().toLowerCase() === 'processing' ? 'pending' : String(row.status || '').trim().toLowerCase()
        }));
        res.json(normalized);
    });
});

// --- 24A. GET USER LOGS (Admin Only) ---
app.get('/api/admin/user-logs', checkRole('admin'), (req, res) => {
    const sql = `
        SELECT
            u.user_id,
            CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS full_name,
            u.email,
            r.role_name,
            l.login_at,
            l.logout_at,
            l.login_success,
            l.ip_address,
            l.user_agent,
            l.session_token
        FROM user_session_logs l
        JOIN user_accounts u ON l.user_id = u.user_id
        JOIN roles r ON u.role_id = r.role_id
        WHERE COALESCE(u.is_deleted, 0) = 0
        ORDER BY l.login_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ logs: results });
    });
});

// --- 24B. GET ORDER LOGS (Admin Only) ---
app.get('/api/admin/order-logs', checkRole('admin'), (req, res) => {
    const sql = `
        SELECT
            o.order_id,
            o.user_id,
            CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS customer_name,
            u.email AS customer_email,
            r.role_name,
            o.total_amount,
            CASE
                WHEN o.status = 'cancelled' OR o.cancellation_status = 'approved' THEN 'Cancelled'
                ELSE 'Paid'
            END AS final_status,
            o.created_at AS order_created_at,
            o.updated_at AS order_updated_at,
            COUNT(oi.order_item_id) AS items_count
        FROM orders o
        JOIN user_accounts u ON o.user_id = u.user_id
        JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN order_items oi ON oi.order_id = o.order_id
        WHERE (
            o.status IN ('completed', 'delivered', 'cancelled')
            OR o.cancellation_status = 'approved'
        )
        GROUP BY
            o.order_id,
            o.user_id,
            u.first_name,
            u.last_name,
            u.email,
            r.role_name,
            o.total_amount,
            final_status,
            o.created_at,
            o.updated_at
        ORDER BY o.updated_at DESC, o.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ logs: results });
    });
});

// --- 32. REQUEST ORDER CANCELLATION ---
app.post('/api/orders/:orderId/cancel', (req, res) => {
    const { orderId } = req.params;
    const { userId, reason } = req.body;

    // Check if order exists and belongs to user
    db.query("SELECT * FROM orders WHERE order_id = ? AND user_id = ?", [orderId, userId], (err, orderResult) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (orderResult.length === 0) return res.status(404).json({ message: "Order not found" });
        
        const order = orderResult[0];
        if (order.status !== 'pending') {
            return res.status(400).json({ message: "Only pending orders can be cancelled" });
        }

        // Check if cancellation already requested
        db.query("SELECT * FROM order_cancellation_requests WHERE order_id = ?", [orderId], (err, cancelResult) => {
            if (err) return res.status(500).json({ message: "Database error" });
            if (cancelResult.length > 0) {
                return res.status(400).json({ message: "Cancellation already requested" });
            }

            // Create cancellation request
            const sql = "INSERT INTO order_cancellation_requests (order_id, user_id, reason) VALUES (?, ?, ?)";
            db.query(sql, [orderId, userId, reason], (err) => {
                if (err) return res.status(500).json({ message: "Database error" });
                
                // Update order cancellation status
                db.query("UPDATE orders SET cancellation_status = 'requested' WHERE order_id = ?", [orderId], (err) => {
                    if (err) return res.status(500).json({ message: "Database error" });
                    res.json({ message: "Cancellation request submitted successfully" });
                });
            });
        });
    });
});

// --- 33. GET CANCELLATION REQUESTS (Admin/Worker) ---
app.get('/api/admin/cancellation-requests', checkRole(['admin', 'worker']), (req, res) => {
    const sql = `
        SELECT cr.*, o.order_number, o.order_date, o.total_amount, o.status as order_status, 
               u.first_name, u.last_name, u.email,
               reviewer.first_name AS reviewed_by_first_name,
               reviewer.last_name AS reviewed_by_last_name
        FROM order_cancellation_requests cr
        JOIN orders o ON cr.order_id = o.order_id
        JOIN user_accounts u ON cr.user_id = u.user_id
        LEFT JOIN user_accounts reviewer ON cr.reviewed_by = reviewer.user_id
        ORDER BY cr.created_at DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 34. APPROVE/REJECT CANCELLATION REQUEST (Admin/Worker) ---
app.put('/api/admin/cancellation-requests/:requestId', checkRole(['admin', 'worker']), (req, res) => {
    const { requestId } = req.params;
    const { action, adminUserId } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
    }

    // Get cancellation request
    db.query("SELECT * FROM order_cancellation_requests WHERE request_id = ?", [requestId], (err, requestResult) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (requestResult.length === 0) return res.status(404).json({ message: "Request not found" });

        const request = requestResult[0];
        if (request.status !== 'pending') {
            return res.status(400).json({ message: "Request already processed" });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        
        // Update cancellation request
        db.query(
            "UPDATE order_cancellation_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE request_id = ?",
            [newStatus, adminUserId, requestId],
            (err) => {
                if (err) return res.status(500).json({ message: "Database error" });

                // Update order status
                const orderStatus = action === 'approve' ? 'cancelled' : 'pending';
                const cancellationStatus = action === 'approve' ? 'approved' : 'rejected';
                
                db.query(
                    "UPDATE orders SET status = ?, cancellation_status = ? WHERE order_id = ?",
                    [orderStatus, cancellationStatus, request.order_id],
                    (err) => {
                        if (err) return res.status(500).json({ message: "Database error" });
                        
                        // If approved, restore stock and send cancellation email
                        if (action === 'approve') {
                            db.query(
                                "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
                                [request.order_id],
                                (err, items) => {
                                    if (err) return res.status(500).json({ message: "Database error" });
                                    
                                    // Restore stock for each item
                                    items.forEach(item => {
                                        db.query(
                                            "UPDATE products SET stock = stock + ? WHERE product_id = ?",
                                            [item.quantity, item.product_id]
                                        );
                                    });
                                    
                                    // Get user email and order details for email
                                    db.query(
                                        "SELECT u.email, u.first_name, u.last_name, o.order_id, o.order_number, o.order_date, o.total_amount, o.created_at FROM user_accounts u JOIN orders o ON u.user_id = o.user_id WHERE o.order_id = ?",
                                        [request.order_id],
                                        (err, userOrderData) => {
                                            if (err) {
                                                console.error('Error fetching user email:', err);
                                            } else if (userOrderData.length > 0) {
                                                const userData = userOrderData[0];
                                                
                                                // Get all items in order
                                                db.query(
                                                    "SELECT p.name, oi.quantity, oi.price FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?",
                                                    [request.order_id],
                                                    (err, orderItems) => {
                                                        if (!err) {
                                                            // Generate cancellation confirmation email
                                                            const cancellationHtml = generateCancellationInvoice(userData, orderItems, request);
                                                            
                                                            const mailOptions = {
                                                                from: 'tongtongornamental@gmail.com',
                                                                to: userData.email,
                                                                subject: `Order Cancellation Confirmed - Order ${getOrderDisplayNumber(userData)} - ${new Date(userData.created_at).toLocaleDateString()}`,
                                                                html: cancellationHtml
                                                            };
                                                            
                                                            transporter.sendMail(mailOptions, (emailError) => {
                                                                if (emailError) {
                                                                    console.error("Cancellation email error:", emailError);
                                                                } else {
                                                                    console.log("Cancellation confirmation email sent to:", userData.email);
                                                                }
                                                                res.json({ message: "Cancellation approved successfully. Confirmation email sent to client." });
                                                            });
                                                        } else {
                                                            res.json({ message: "Cancellation approved successfully" });
                                                        }
                                                    }
                                                );
                                            } else {
                                                res.json({ message: "Cancellation approved successfully" });
                                            }
                                        }
                                    );
                                }
                            );
                        } else {
                            res.json({ message: `Cancellation ${action}d successfully` });
                        }
                    }
                );
            }
        );
    });
});

// --- 35. GET LOW STOCK PRODUCTS (Admin/Worker) ---
app.get('/api/admin/low-stock', checkRole(['admin', 'worker']), (req, res) => {
    const sql = "SELECT * FROM products WHERE stock <= low_stock_threshold AND is_deleted = 0 ORDER BY stock ASC";
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 36. UPDATE PRODUCT STOCK ---
app.put('/api/products/:id/stock', checkRole(['admin', 'worker']), (req, res) => {
    const { id } = req.params;
    const { stock, lowStockThreshold } = req.body;

    const sql = "UPDATE products SET stock = ?, low_stock_threshold = ? WHERE product_id = ?";
    db.query(sql, [stock, lowStockThreshold, id], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: "Stock updated successfully" });
    });
});

// --- 37. ADVANCED PRODUCT SEARCH ---
app.get('/api/products/search', (req, res) => {
    const { 
        search, 
        category, 
        minPrice, 
        maxPrice, 
        sortBy = 'name', 
        sortOrder = 'ASC',
        inStock = false 
    } = req.query;

    const whereClauses = [];
    const params = [];

    if (inStock === 'true') {
        whereClauses.push('stock > 0');
        whereClauses.push('is_deleted = 0');
    }

    if (search) {
        whereClauses.push('(name LIKE ? OR description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
        whereClauses.push('category = ?');
        params.push(category);
    }

    if (minPrice) {
        whereClauses.push('price >= ?');
        params.push(minPrice);
    }

    if (maxPrice) {
        whereClauses.push('price <= ?');
        params.push(maxPrice);
    }

    let sql = 'SELECT * FROM products';
    if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Sorting
    const allowedSortFields = ['name', 'price', 'created_at', 'stock'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    if (allowedSortFields.includes(sortBy) && allowedSortOrders.includes(sortOrder.toUpperCase())) {
        sql += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 38. GET BEST SELLERS ---
app.get('/api/analytics/best-sellers', (req, res) => {
    const { period = 'monthly' } = req.query; // 'weekly' or 'monthly'
    
    let dateCondition;
    if (period === 'weekly') {
        dateCondition = "DATE(o.updated_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)";
    } else {
        dateCondition = "DATE(o.updated_at) BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())";
    }

    const sql = `
        SELECT p.product_id, p.name, p.image_url, p.price, 
               SUM(oi.quantity) as total_sold, 
               SUM(oi.line_total) as total_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.status = 'completed' AND ${dateCondition}
        GROUP BY p.product_id, p.name, p.image_url, p.price
        ORDER BY total_sold DESC
        LIMIT 10
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ period, bestSellers: results });
    });
});

// --- 39. GET SALES ANALYTICS (Admin/Worker) ---
app.get('/api/admin/analytics/sales', checkRole(['admin', 'worker']), (req, res) => {
    const { period = 'monthly' } = req.query;
    
    let dateCondition;
    if (period === 'weekly') {
        dateCondition = "DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)";
    } else {
        dateCondition = "DATE(created_at) BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())";
    }

    const sql = `
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders_count,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_order_value
        FROM orders 
        WHERE LOWER(status) <> 'cancelled' AND ${dateCondition}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ period, sales: results });
    });
});

// --- 24. GET USER ROLE ---
app.post('/api/user-role', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    db.query("SELECT r.role_name FROM user_accounts u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?", 
    [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        
        if (result.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ role: result[0].role_name });
    });
});

// --- 28. GET USER PROFILE ---
app.get('/api/user-profile/:userId', (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT user_id, first_name, middle_name, last_name, suffix, gender, birthday, email, contact_number, address, is_senior, is_pwd, senior_verified, pwd_verified, profile_image_url, id_image_url, id_front_image_url, id_back_image_url FROM user_accounts WHERE user_id = ? AND is_deleted = 0";
    
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0) return res.status(404).json({ message: "User not found" });
        res.json(result[0]);
    });
});

// --- 28.1 UPDATE ACCOUNT PROFILE ---
app.put('/api/account/:userId', (req, res) => {
    const { userId } = req.params;
    const { first_name, last_name, email, suffix, profile_image_url, id_image_url, contact_number, address } = req.body;
    const hasSuffix = Object.prototype.hasOwnProperty.call(req.body || {}, 'suffix');
    const hasContactNumber = Object.prototype.hasOwnProperty.call(req.body || {}, 'contact_number');
    const hasAddress = Object.prototype.hasOwnProperty.call(req.body || {}, 'address');
    const rawSuffix = hasSuffix ? String(suffix || '').trim() : null;
    const nextContactNumber = hasContactNumber ? String(contact_number || '').trim() : null;
    const nextAddress = hasAddress ? String(address || '').trim() : null;
    const suffixAliases = {
        'JR': 'Jr.',
        'JR.': 'Jr.',
        'SR': 'Sr.',
        'SR.': 'Sr.',
        'II': 'II',
        'III': 'III',
        'IV': 'IV',
        'V': 'V'
    };
    const normalizedSuffix = hasSuffix
        ? (rawSuffix ? (suffixAliases[rawSuffix.toUpperCase()] || rawSuffix) : '')
        : null;
    const allowedSuffixes = ['', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

    if (hasSuffix && !allowedSuffixes.includes(normalizedSuffix)) {
        return res.status(400).json({ message: 'Invalid suffix selection.' });
    }

    const nextProfileImageUrl = profile_image_url ?? id_image_url ?? null;

    const sql = `
        UPDATE user_accounts
        SET first_name = ?,
            last_name = ?,
            email = ?,
            profile_image_url = ?,
            suffix = COALESCE(?, suffix),
            contact_number = COALESCE(?, contact_number),
            address = COALESCE(?, address)
        WHERE user_id = ? AND is_deleted = 0
    `;

    db.query(sql, [first_name, last_name, email, nextProfileImageUrl, normalizedSuffix, nextContactNumber, nextAddress, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Account updated successfully' });
    });
});

// --- 28.2 UPDATE ACCOUNT PASSWORD ---
app.put('/api/account/:userId/password', (req, res) => {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new password are required' });
    }

    const meetsPasswordRules =
        newPassword.length >= 8 &&
        /[A-Z]/.test(newPassword) &&
        /[a-z]/.test(newPassword) &&
        /[0-9]/.test(newPassword) &&
        /[@#$%^&*\-_+=!?]/.test(newPassword);
    if (!meetsPasswordRules) {
        return res.status(400).json({ message: 'Password must have 8+ chars, uppercase, lowercase, number, and symbol (@#$%^&*-_+=!?).' });
    }

    const getSql = 'SELECT password FROM user_accounts WHERE user_id = ? AND is_deleted = 0';
    db.query(getSql, [userId], (err, users) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const currentHash = users[0].password;
        bcrypt.compare(oldPassword, currentHash, (compareErr, isMatch) => {
            if (compareErr) return res.status(500).json({ message: 'Password comparison failed' });
            if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });

            bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
                if (hashErr) return res.status(500).json({ message: 'Password hashing failed' });

                const updateSql = 'UPDATE user_accounts SET password = ? WHERE user_id = ?';
                db.query(updateSql, [hashedPassword, userId], (updateErr) => {
                    if (updateErr) return res.status(500).json({ message: 'Database error' });
                    res.json({ message: 'Password updated successfully' });
                });
            });
        });
    });
});

// --- 29. ADMIN APPROVE/REJECT SENIOR STATUS ---
app.put('/api/admin/verify-senior/:userId', checkRole('admin'), (req, res) => {
    const { userId } = req.params;
    const { approve } = req.body; // true or false
    
    const sql = "UPDATE user_accounts SET senior_verified = ? WHERE user_id = ?";
    db.query(sql, [approve ? 1 : 0, userId], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: `Senior status ${approve ? 'approved' : 'rejected'}` });
    });
});

// --- 30. ADMIN APPROVE/REJECT PWD STATUS ---
app.put('/api/admin/verify-pwd/:userId', checkRole('admin'), (req, res) => {
    const { userId } = req.params;
    const { approve } = req.body; // true or false
    
    const sql = "UPDATE user_accounts SET pwd_verified = ? WHERE user_id = ?";
    db.query(sql, [approve ? 1 : 0, userId], (err) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json({ message: `PWD status ${approve ? 'approved' : 'rejected'}` });
    });
});

// --- 30.1 ADMIN REVOKE DISCOUNT REQUEST ---
app.put('/api/admin/revoke-discount/:userId', checkRole('admin'), (req, res) => {
    const { userId } = req.params;
    const { requestType } = req.body;

    if (!['senior', 'pwd'].includes(requestType)) {
        return res.status(400).json({ message: 'Invalid request type' });
    }

    const sql = requestType === 'senior'
        ? `UPDATE user_accounts
           SET is_senior = 0,
               senior_verified = 0,
               id_image_url = NULL,
               id_front_image_url = NULL,
               id_back_image_url = NULL
           WHERE user_id = ?`
        : `UPDATE user_accounts
           SET is_pwd = 0,
               pwd_verified = 0,
               id_image_url = NULL,
               id_front_image_url = NULL,
               id_back_image_url = NULL
           WHERE user_id = ?`;

    db.query(sql, [userId], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: `${requestType === 'senior' ? 'Senior Citizen' : 'PWD'} discount request removed successfully` });
    });
});

// --- 31. GET PENDING VERIFICATION REQUESTS (Admin only) ---
app.get('/api/admin/verification-requests', checkRole('admin'), (req, res) => {
    const { search } = req.query;
    
    let sql = `SELECT u.user_id, u.first_name, u.last_name, u.email, u.contact_number, 
                      u.created_at,
                      CASE 
                          WHEN u.is_senior = 1 AND u.senior_verified IS NULL THEN 'senior'
                          WHEN u.is_pwd = 1 AND u.pwd_verified IS NULL THEN 'pwd'
                      END as request_type
               FROM user_accounts u 
               WHERE u.is_deleted = 0 
               AND ((u.is_senior = 1 AND u.senior_verified IS NULL) 
                    OR (u.is_pwd = 1 AND u.pwd_verified IS NULL))`;
    
    const params = [];

    if (search) {
        sql += " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY u.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 24. GET ALL USERS (Admin only) ---
app.get('/api/users', (req, res) => {
    const { search } = req.query;
    let sql = `SELECT u.user_id, u.first_name, u.last_name, u.email, u.contact_number, 
                      r.role_name, u.created_at, u.is_verified,
                      u.is_senior, u.is_pwd, u.senior_verified, u.pwd_verified 
               FROM user_accounts u 
               LEFT JOIN roles r ON u.role_id = r.role_id 
               WHERE u.is_deleted = 0`;
    const params = [];

    if (search) {
        sql += " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY u.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 25. UPDATE USER ROLE (Admin only) ---
app.put('/api/users/:userId/role', (req, res) => {
    const { userId } = req.params;
    const { newRoleId, adminUserId } = req.body;

    // Verify that the person making the request is an admin
    db.query("SELECT r.role_name FROM user_accounts u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?", 
    [adminUserId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (result.length === 0 || result[0].role_name !== 'admin') {
            return res.status(403).json({ message: "Only admins can change user roles" });
        }

        // Update the user role
        const sql = "UPDATE user_accounts SET role_id = ? WHERE user_id = ?";
        db.query(sql, [newRoleId, userId], (err) => {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json({ message: "User role updated successfully" });
        });
    });
});

// --- 26. GET ALL ROLES ---
app.get('/api/roles', (req, res) => {
    const sql = "SELECT * FROM roles";
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(results);
    });
});

// --- 27. GET PRODUCT CATEGORIES ---
app.get('/api/categories', (req, res) => {
    const sql = "SELECT DISTINCT category FROM products WHERE is_deleted = 0";
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        const categories = results.map(r => r.category);
        res.json(categories);
    });
});

const frontendDistPath = resolveFrontendDistPath();
if (frontendDistPath) {
    app.use(express.static(frontendDistPath));
    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }

        return res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    console.warn('Frontend build not found. Run "npm run build" in the frontend folder before deploying the full app.');
}

startLowStockDigestScheduler();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
