-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 19, 2026 at 02:53 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_project`
--

-- --------------------------------------------------------

--
-- Table structure for table `background_settings`
--

CREATE TABLE `background_settings` (
  `setting_id` int(11) NOT NULL,
  `setting_name` varchar(50) NOT NULL,
  `setting_value` varchar(500) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `background_settings`
--

INSERT INTO `background_settings` (`setting_id`, `setting_name`, `setting_value`, `description`, `created_at`, `updated_at`) VALUES
(0, 'client_background', 'http://localhost:5000/uploads/1777526326279-698665726.png', 'Background image for client/worker pages', '2026-03-27 13:03:34', '2026-04-30 05:18:46'),
(1, 'auth_background', '', 'Website setting: auth_background', '2026-05-08 00:52:32', '2026-05-08 00:52:32'),
(2, 'client_theme_page_bg', '#dff7f5', 'Website setting: client_theme_page_bg', '2026-05-08 00:52:32', '2026-05-15 14:20:12'),
(3, 'client_theme_soft_bg', '#ccfbf1', 'Website setting: client_theme_soft_bg', '2026-05-08 00:52:32', '2026-05-15 14:20:12'),
(4, 'client_theme_card_bg', '#ffffff', 'Website setting: client_theme_card_bg', '2026-05-08 00:52:32', '2026-05-15 14:20:12'),
(5, 'client_theme_panel_bg', '#f2fbfa', 'Website setting: client_theme_panel_bg', '2026-05-08 00:52:32', '2026-05-15 14:20:12');

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `cart_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cash_register_entries`
--

CREATE TABLE `cash_register_entries` (
  `entry_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `entry_type` enum('cash','cash-return','cash-expense','cash-adjustment') NOT NULL DEFAULT 'cash',
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cash_register_entries`
--

INSERT INTO `cash_register_entries` (`entry_id`, `user_id`, `entry_type`, `amount`, `description`, `created_at`) VALUES
(1, 2, 'cash', 295.00, 'Cash payment accepted for Order #2 | (Invoice INV-2-1775831871302) | Customer: Megurine Luka | By: TongTong Fish | Notes: Auto-email check', '2026-04-10 14:56:58'),
(2, 2, 'cash', 178.00, 'Cash payment accepted for Order #1 | (Invoice INV-1-1775790103495) | Customer: Megurine Luka | By: TongTong Fish | Notes: Auto-email check', '2026-04-10 14:57:18'),
(3, 2, 'cash', 178.00, 'Cash payment accepted for Order #1 | (Invoice INV-1-1775790103495) | Customer: Megurine Luka | By: TongTong Fish | Notes: worker payment confirm email test', '2026-04-10 14:59:46'),
(4, 2, 'cash', 300.00, 'Cash payment accepted for Order #3 | (Invoice INV-3-1775835231563) | Customer: Megurine Luka | By: TongTong Fish', '2026-04-10 15:38:41'),
(5, 3, 'cash', 152.00, 'Cash payment accepted for Order #7 | (Invoice INV-7-1776336892947) | Customer: Megurine Luka | By: Harijie Mabilin', '2026-04-16 10:57:53'),
(6, 2, 'cash', 84.55, 'Cash payment accepted for Order #9 | (Invoice INV-9-1776336988724) | Customer: Megurine Luka | By: TongTong Fish', '2026-04-16 11:02:27'),
(7, 2, 'cash', 20150.00, 'Cash payment accepted for Order #12 | (Invoice INV-12-1776475820595) | Customer: Megurine Luka | By: TongTong Fish', '2026-04-21 03:21:21'),
(8, 2, 'cash', 310.00, 'Cash payment accepted for Order #11 | (Invoice INV-11-1776398836096) | Customer: Megurine Luka | By: TongTong Fish', '2026-04-21 03:21:33'),
(9, 2, 'cash', 280.25, 'Cash payment accepted for Order #15 | (Invoice INV-15-1777599818985) | Customer: Megurine Luka | By: TongTong Fish | Notes: Done', '2026-05-08 00:52:56');

-- --------------------------------------------------------

--
-- Table structure for table `cash_register_reconciliations`
--

CREATE TABLE `cash_register_reconciliations` (
  `reconcile_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `actual_cash` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cash_register_reconciliations`
--

INSERT INTO `cash_register_reconciliations` (`reconcile_id`, `user_id`, `actual_cash`, `created_at`) VALUES
(1, 2, 300.00, '2026-04-04 14:57:06'),
(2, 2, -300.00, '2026-04-04 16:58:45'),
(3, 2, 300.00, '2026-04-04 16:58:51'),
(4, 2, 0.00, '2026-04-04 16:58:56');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `invoice_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `customer_name` varchar(120) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `contact_number` varchar(30) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `invoice_pdf_path` varchar(500) DEFAULT NULL,
  `issued_by_user_id` int(11) DEFAULT NULL,
  `issued_by_name` varchar(120) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'issued',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`invoice_id`, `order_id`, `invoice_number`, `customer_name`, `email`, `contact_number`, `total_amount`, `payment_method`, `invoice_pdf_path`, `issued_by_user_id`, `issued_by_name`, `status`, `created_at`) VALUES
(1, 1, 'INV-1-1775790103495', NULL, NULL, NULL, NULL, 'cash_on_store', '/uploads/invoices/INV-1-1775790103495.pdf', NULL, NULL, 'issued', '2026-04-10 03:01:43'),
(2, 2, 'INV-2-1775831871302', NULL, NULL, NULL, NULL, 'cash_on_store', '/uploads/invoices/INV-2-1775831871302.pdf', NULL, NULL, 'issued', '2026-04-10 14:37:51'),
(3, 3, 'INV-3-1775835231563', NULL, NULL, NULL, NULL, 'cash_on_store', '/uploads/invoices/INV-3-1775835231563.pdf', NULL, NULL, 'issued', '2026-04-10 15:33:51'),
(4, 4, 'INV-4-1776332974477', NULL, NULL, NULL, NULL, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-04-16 09:49:34'),
(5, 5, 'INV-5-1776334803735', NULL, NULL, NULL, NULL, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-04-16 10:20:03'),
(6, 6, 'INV-6-1776335314964', NULL, NULL, NULL, NULL, 'cash_on_store', '/uploads/invoices/INV-6-1776335314964.pdf', NULL, NULL, 'issued', '2026-04-16 10:28:34'),
(7, 7, 'INV-7-1776336892947', NULL, NULL, NULL, NULL, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-04-16 10:54:52'),
(8, 8, 'INV-8-1776336932599', NULL, NULL, NULL, NULL, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-04-16 10:55:32'),
(9, 9, 'INV-9-1776336988724', NULL, NULL, NULL, NULL, 'cash_on_store', '/uploads/invoices/INV-9-1776336988724.pdf', NULL, NULL, 'issued', '2026-04-16 10:56:28'),
(10, 10, 'INV-10-1776338039350', NULL, NULL, NULL, NULL, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-04-16 11:13:59'),
(11, 11, 'INV-11-1776398836096', NULL, NULL, NULL, NULL, 'cash_on_store', '/uploads/invoices/INV-11-1776398836096.pdf', NULL, NULL, 'issued', '2026-04-17 04:07:16'),
(12, 12, 'INV-12-1776475820595', NULL, NULL, NULL, NULL, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-04-18 01:30:20'),
(13, 13, 'INV-13-1776741922377', NULL, NULL, NULL, NULL, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-04-21 03:25:22'),
(14, 14, 'INV-14-1777273893172', 'Megurine Luka', 'mharijie@gmail.com', '12321423423', 190.00, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-04-27 07:11:33'),
(15, 15, 'INV-15-1777599818985', NULL, NULL, NULL, NULL, 'cash_on_store', NULL, NULL, NULL, 'issued', '2026-05-01 01:43:38'),
(16, 16, 'INV-20260509-001', NULL, NULL, NULL, NULL, 'cash_on_store', '/uploads/invoices/INV-20260509-001.pdf', NULL, NULL, 'issued', '2026-05-09 09:44:28');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_requests`
--

CREATE TABLE `invoice_requests` (
  `request_id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `request_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `requested_by` int(11) NOT NULL,
  `email_sent` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoice_requests`
--

INSERT INTO `invoice_requests` (`request_id`, `invoice_id`, `request_time`, `requested_by`, `email_sent`) VALUES
(1, 1, '2026-04-10 03:01:47', 4, 1),
(2, 2, '2026-04-10 14:37:54', 4, 1),
(3, 1, '2026-04-10 14:57:58', 2, 1),
(4, 1, '2026-04-10 14:59:25', 2, 1),
(5, 1, '2026-04-10 14:59:37', 2, 1),
(6, 1, '2026-04-10 14:59:49', 2, 1),
(7, 3, '2026-04-10 15:33:55', 4, 1),
(8, 3, '2026-04-10 15:38:44', 2, 1),
(9, 4, '2026-04-16 09:49:37', 4, 1),
(10, 5, '2026-04-16 10:20:06', 4, 1),
(11, 6, '2026-04-16 10:28:38', 4, 1),
(12, 7, '2026-04-16 10:54:56', 4, 1),
(13, 8, '2026-04-16 10:55:57', 4, 1),
(14, 9, '2026-04-16 10:56:31', 4, 1),
(15, 7, '2026-04-16 10:57:57', 3, 1),
(16, 9, '2026-04-16 11:02:30', 2, 1),
(17, 10, '2026-04-16 11:14:02', 4, 1),
(18, 11, '2026-04-17 04:07:24', 4, 1),
(19, 12, '2026-04-18 01:30:25', 4, 1),
(20, 12, '2026-04-21 03:21:24', 2, 1),
(21, 11, '2026-04-21 03:21:36', 2, 1),
(22, 13, '2026-04-21 03:25:25', 4, 1),
(23, 13, '2026-04-27 06:58:16', 2, 1),
(24, 14, '2026-04-27 07:11:36', 4, 1),
(25, 14, '2026-04-27 07:12:33', 2, 1),
(26, 15, '2026-05-01 01:43:41', 4, 1),
(27, 15, '2026-05-08 00:52:59', 2, 1),
(28, 16, '2026-05-09 09:44:32', 4, 1);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `order_number` int(11) DEFAULT NULL,
  `order_date` date DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `customer_name` varchar(120) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `contact_number` varchar(30) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_address` varchar(500) DEFAULT NULL,
  `payment_method` varchar(100) DEFAULT 'cash_on_store',
  `paid_by_user_id` int(11) DEFAULT NULL,
  `paid_by_name` varchar(120) DEFAULT NULL,
  `invoice_pdf_path` varchar(500) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `cancellation_status` enum('none','requested','approved','rejected') DEFAULT 'none',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `order_number`, `order_date`, `user_id`, `customer_name`, `email`, `contact_number`, `total_amount`, `shipping_address`, `payment_method`, `paid_by_user_id`, `paid_by_name`, `invoice_pdf_path`, `status`, `cancellation_status`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 4, NULL, NULL, NULL, 178.00, 'Japan', 'cash_on_store', 2, 'TongTong Fish', '/uploads/invoices/INV-1-1775790103495.pdf', 'completed', 'none', '2026-04-10 03:01:43', '2026-04-10 14:59:46'),
(2, NULL, NULL, 4, NULL, NULL, NULL, 295.00, 'Japan', 'cash_on_store', 2, 'TongTong Fish', '/uploads/invoices/INV-2-1775831871302.pdf', 'completed', 'none', '2026-04-10 14:37:51', '2026-04-10 14:56:58'),
(3, NULL, NULL, 4, NULL, NULL, NULL, 300.00, 'Japan', 'cash_on_store', 2, 'TongTong Fish', '/uploads/invoices/INV-3-1775835231563.pdf', 'completed', 'none', '2026-04-10 15:33:51', '2026-04-10 15:38:41'),
(4, NULL, NULL, 4, NULL, NULL, NULL, 703.00, 'Japan', 'cash_on_store', NULL, NULL, NULL, 'cancelled', 'approved', '2026-04-16 09:49:34', '2026-04-16 10:12:45'),
(5, NULL, NULL, 4, NULL, NULL, NULL, 456.00, 'Japan', 'cash_on_store', NULL, NULL, NULL, 'cancelled', 'approved', '2026-04-16 10:20:03', '2026-04-16 10:22:00'),
(6, NULL, NULL, 4, NULL, NULL, NULL, 456.00, 'Japan', 'cash_on_store', NULL, NULL, '/uploads/invoices/INV-6-1776335314964.pdf', 'cancelled', 'approved', '2026-04-16 10:28:34', '2026-04-16 10:29:34'),
(7, NULL, NULL, 4, NULL, NULL, NULL, 152.00, 'Japan', 'cash_on_store', 3, 'Harijie Mabilin', NULL, 'completed', 'none', '2026-04-16 10:54:52', '2026-04-16 10:57:53'),
(8, NULL, NULL, 4, NULL, NULL, NULL, 84.55, 'Japan', 'cash_on_store', NULL, NULL, NULL, 'cancelled', 'approved', '2026-04-16 10:55:32', '2026-04-16 11:00:01'),
(9, NULL, NULL, 4, NULL, NULL, NULL, 84.55, 'Japan', 'cash_on_store', 2, 'TongTong Fish', '/uploads/invoices/INV-9-1776336988724.pdf', 'completed', 'none', '2026-04-16 10:56:28', '2026-04-17 04:23:15'),
(10, NULL, NULL, 4, NULL, NULL, NULL, 152.00, 'Japan', 'cash_on_store', NULL, NULL, NULL, 'cancelled', 'approved', '2026-04-16 11:13:59', '2026-04-16 11:14:41'),
(11, NULL, NULL, 4, NULL, NULL, NULL, 310.00, 'Japan', 'cash_on_store', 2, 'TongTong Fish', '/uploads/invoices/INV-11-1776398836096.pdf', 'completed', 'none', '2026-04-17 04:07:16', '2026-04-21 03:21:33'),
(12, NULL, NULL, 4, NULL, NULL, NULL, 20150.00, 'Japan', 'cash_on_store', 2, 'TongTong Fish', NULL, 'completed', 'none', '2026-04-18 01:30:20', '2026-04-21 03:21:21'),
(13, NULL, NULL, 4, NULL, NULL, NULL, 142.50, 'Japan', 'cash_on_store', NULL, NULL, NULL, 'completed', 'none', '2026-04-21 03:25:22', '2026-04-27 06:58:12'),
(14, NULL, NULL, 4, NULL, NULL, NULL, 190.00, 'Japan', 'cash_on_store', NULL, NULL, NULL, 'cancelled', 'none', '2026-04-27 07:11:33', '2026-05-01 01:21:37'),
(15, NULL, NULL, 4, NULL, NULL, NULL, 280.25, 'Japan', 'cash_on_store', 2, 'TongTong Fish', NULL, 'completed', 'none', '2026-05-01 01:43:38', '2026-05-08 00:52:56'),
(16, 1, '2026-05-09', 4, NULL, NULL, NULL, 674.50, 'Japan', 'cash_on_store', NULL, NULL, '/uploads/invoices/INV-20260509-001.pdf', 'cancelled', 'approved', '2026-05-09 09:44:28', '2026-05-09 09:46:32');

-- --------------------------------------------------------

--
-- Table structure for table `order_cancellation_requests`
--

CREATE TABLE `order_cancellation_requests` (
  `request_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_cancellation_requests`
--

INSERT INTO `order_cancellation_requests` (`request_id`, `order_id`, `user_id`, `reason`, `status`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(1, 4, 4, 'Customer requested cancellation', 'approved', 2, '2026-04-16 10:12:45', '2026-04-16 10:05:09'),
(2, 5, 4, 'Customer requested cancellation', 'approved', 3, '2026-04-16 10:22:00', '2026-04-16 10:20:19'),
(3, 6, 4, 'Customer requested cancellation', 'approved', 3, '2026-04-16 10:29:34', '2026-04-16 10:29:16'),
(4, 8, 4, 'Customer requested cancellation', 'approved', 2, '2026-04-16 11:00:01', '2026-04-16 10:56:41'),
(5, 10, 4, 'Customer requested cancellation', 'approved', 2, '2026-04-16 11:14:41', '2026-04-16 11:14:07'),
(6, 16, 4, 'Customer requested cancellation', 'approved', 2, '2026-05-09 09:46:32', '2026-05-09 09:45:39');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `unit_discount` decimal(10,2) DEFAULT 0.00,
  `line_total` decimal(10,2) GENERATED ALWAYS AS ((`price` - `unit_discount`) * `quantity`) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`order_item_id`, `order_id`, `product_id`, `quantity`, `price`, `unit_discount`, `created_at`) VALUES
(1, 1, 5, 2, 89.00, 0.00, '2026-04-10 03:01:43'),
(2, 2, 2, 1, 95.00, 0.00, '2026-04-10 14:37:51'),
(3, 2, 6, 1, 200.00, 0.00, '2026-04-10 14:37:51'),
(4, 3, 1, 2, 150.00, 0.00, '2026-04-10 15:33:51'),
(5, 4, 1, 1, 150.00, 7.50, '2026-04-16 09:49:34'),
(6, 4, 8, 3, 160.00, 8.00, '2026-04-16 09:49:34'),
(7, 4, 3, 1, 110.00, 5.50, '2026-04-16 09:49:34'),
(8, 5, 8, 3, 160.00, 8.00, '2026-04-16 10:20:03'),
(9, 6, 8, 3, 160.00, 8.00, '2026-04-16 10:28:34'),
(10, 7, 8, 1, 160.00, 8.00, '2026-04-16 10:54:52'),
(11, 8, 5, 1, 89.00, 4.45, '2026-04-16 10:55:32'),
(12, 9, 5, 1, 89.00, 4.45, '2026-04-16 10:56:28'),
(13, 10, 8, 1, 160.00, 8.00, '2026-04-16 11:13:59'),
(14, 11, 1, 1, 150.00, 0.00, '2026-04-17 04:07:16'),
(15, 11, 8, 1, 160.00, 0.00, '2026-04-17 04:07:16'),
(16, 12, 1, 1, 150.00, 0.00, '2026-04-18 01:30:20'),
(17, 12, 9, 1, 20000.00, 0.00, '2026-04-18 01:30:20'),
(18, 13, 1, 1, 150.00, 7.50, '2026-04-21 03:25:22'),
(20, 14, 6, 1, 200.00, 10.00, '2026-04-27 07:11:33'),
(21, 15, 2, 1, 95.00, 4.75, '2026-05-01 01:43:38'),
(22, 15, 6, 1, 200.00, 10.00, '2026-05-01 01:43:38'),
(23, 16, 2, 2, 95.00, 4.75, '2026-05-09 09:44:28'),
(24, 16, 6, 1, 200.00, 10.00, '2026-05-09 09:44:28'),
(25, 16, 8, 2, 160.00, 8.00, '2026-05-09 09:44:28');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `low_stock_threshold` int(11) DEFAULT 5,
  `image_url` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `name`, `description`, `category`, `price`, `stock`, `low_stock_threshold`, `image_url`, `is_deleted`, `created_at`, `updated_at`) VALUES
(1, 'Clown Fish', 'Clownfish (Amphiprioninae) are small, brightly colored saltwater fish best known for their orange bodies with white stripes (like in Finding Nemo). They naturally live in warm ocean reefs and often form a symbiotic relationship with sea anemones, which provide them protection.\n\nHow to Take Care of Clownfish:\n1. Tank Setup\nMinimum tank size: 20 gallons (for a pair)\nUse a saltwater aquarium (not freshwater)\nMaintain temperature: 24–27°C\npH level: 8.0–8.4\nAdd hiding spots like rocks or coral decorations\nOptional: sea anemone (only for experienced setups)\n\n2. Water Quality\nUse a marine filter and protein skimmer if possible\nRegular water changes (10–20% every 2 weeks)\nKeep ammonia and nitrites at 0 ppm\n\n3. Feeding\nFeed 1–2 times daily\nDiet includes:\nMarine flakes or pellets\nFrozen foods (brine shrimp, mysis shrimp)\n\n4. Behavior & Compatibility\nGenerally peaceful but can be territorial\nBest kept in pairs or alone\nCompatible with other calm saltwater fish\n\n5. Lighting\nModerate lighting is enough\nStrong lighting needed only if keeping corals/anemones\n\n6. Maintenance Tips\nMonitor salinity (1.020–1.025 specific gravity)\nAvoid sudden changes in water conditions\nObserve for signs of stress or disease (loss of color, erratic swimming)', 'Salt Water Fish', 150.00, 22, NULL, 'http://localhost:5000/uploads/1775273211559-410317425.jpg', 0, '2026-04-04 03:26:53', '2026-05-09 09:34:21'),
(2, 'Gold Fish', 'Goldfish (Carassius auratus) are popular freshwater fish known for their bright orange color (though they can also be white, black, or mixed). They’re hardy and great for beginners, but they need more space and care than most people expect.\n\nHow to Take Care of Goldfish:\n1. Tank Setup\nMinimum tank size: 20 gallons for one goldfish (they grow big!)\nAdd 10 gallons for each additional fish\nUse a filter (goldfish produce a lot of waste)\nInclude gravel, plants, or decorations for enrichment\nAvoid small bowls ❌ (they cause poor health)\n\n2. Water Conditions\nTemperature: 18–24°C (they prefer cooler water)\npH level: 6.5–7.5\nNo heater usually needed (room temp is fine)\nKeep ammonia and nitrites at 0 ppm\n\n3. Feeding\nFeed 1–2 times daily (small amounts)\nDiet includes:\nGoldfish flakes or pellets\nVegetables (peas, lettuce, spinach)\nOccasional treats (bloodworms, brine shrimp)\n\n4. Behavior & Compatibility\nPeaceful and social\nBest kept with other goldfish\nAvoid aggressive or tropical fish (different needs)\n\n5. Cleaning & Maintenance\nWeekly water change (20–30%)\nClean filter regularly (but don’t remove all good bacteria)\nRemove uneaten food to prevent dirty water\n\n6. Important Tips\nGoldfish grow large (up to 6–12 inches depending on type)\nThey can live 10–15 years with proper care\nOverfeeding is a common mistake—feed lightly', 'Fresh Water Fish', 95.00, 22, NULL, 'http://localhost:5000/uploads/1775279841085-917402665.jpg', 0, '2026-04-04 05:17:26', '2026-05-09 09:46:32'),
(3, 'Janitor Fish', 'Janitor Fish (Pleco / Hypostomus plecostomus) are freshwater fish known for their sucker mouths and ability to cling to surfaces. They’re often called “cleaner fish” because they eat algae, but they don’t fully clean a tank on their own.\n\nHow to Take Care of Janitor Fish:\n1. Tank Setup\nMinimum tank size: 75–100 gallons (they grow BIG)\nProvide driftwood, rocks, and hiding spots\nUse a strong filter (they produce a lot of waste)\n\n2. Water Conditions\nTemperature: 23–30°C\npH level: 6.5–7.5\nKeep water clean with regular changes (20–30% weekly)\n\n3. Feeding\nNot just algae eaters ❗\nDiet includes:\nAlgae wafers\nVegetables (zucchini, cucumber, spinach)\nOccasional protein (sinking pellets, shrimp)\n\n4. Behavior & Compatibility\nMostly peaceful but can be territorial as they grow\nBest with medium to large fish\nAvoid very small fish (may get stressed or harmed)\n\n5. Important Tips\nCan grow up to 12–24 inches depending on species 😮\nNocturnal (more active at night)\nNeed driftwood (helps digestion)\nProduce a lot of waste → don’t rely on them for cleaning', 'Fresh Water Fish', 110.00, 23, 5, 'http://localhost:5000/uploads/1775279914040-28216811.jpg', 0, '2026-04-04 05:18:39', '2026-04-16 10:12:45'),
(4, 'TetraMin Tropical Flakes 62g', 'Flake food suitable for most fish. Easy to eat and digest, making it ideal for daily feeding.', 'Supplies', 70.00, 30, 5, 'http://localhost:5000/uploads/1775280970457-584768232.webp', 0, '2026-04-04 05:36:31', '2026-04-04 05:36:31'),
(5, 'Ocean Nutrition Formula One Flakes 34g', 'Balanced flakes for both freshwater and saltwater fish. Provides essential nutrients for everyday feeding.', 'Supplies', 89.00, 41, 5, 'http://localhost:5000/uploads/1775281144673-136227332.png', 0, '2026-04-04 05:39:16', '2026-04-16 11:00:01'),
(6, 'Aqueon Tropical Pellets 198g', 'Daily-use pellets for community fish. Provides balanced nutrition and supports fish health.', 'Supplies', 200.00, 26, 20, 'http://localhost:5000/uploads/1775281349151-882044713.jpg', 0, '2026-04-04 05:42:31', '2026-05-09 09:46:32'),
(7, 'Tetra PlecoWafers 86g', 'Algae-based wafers for fish that eat at the bottom. Supports digestion and steady nutrition.', 'Supplies', 80.00, 27, NULL, 'http://localhost:5000/uploads/1775281436948-492311804.png', 0, '2026-04-04 05:44:00', '2026-04-07 16:46:42'),
(8, 'Angel Fish', 'Angelfish (Pterophyllum) are elegant, disc-shaped freshwater fish native to the Amazon River basin. Known for their graceful, wing-like fins and distinctive triangular bodies, they are a staple in the aquarium hobby. While they belong to the cichlid family, they are much more poised than their aggressive cousins, though they still retain a dignified, \"regal\" personality.\n\nHow to Take Care of Angelfish:\n1. Tank Setup\nMinimum tank size: 30 gallons (tall tanks are better to accommodate their long fins)\nUse a freshwater aquarium\nMaintain temperature: 24–29°C\npH level: 6.5–7.5\nDecor: Include tall plants (like Amazon Swords) and driftwood to mimic their natural habitat\n\n2. Water Quality\nUse a high-quality canister or power filter with a gentle flow (strong currents can stress them)\nRegular water changes: 20–25% every week\nKeep ammonia and nitrites at 0 ppm; keep nitrates low\n\n3. Feeding\nFeed 1–2 times daily\nDiet includes:\nHigh-quality tropical flakes or pellets\nFrozen or live foods (bloodworms, brine shrimp, tubifex)\nOccasional vegetable-based flakes\n\n4. Behavior & Compatibility\nSemi-aggressive: Generally peaceful but can become territorial during spawning\nCompatibility: Best kept with other medium-sized tropical fish (Corydoras, larger Tetras, Gouramis)\nCaution: Avoid very small fish (like Neon Tetras) as Angelfish may eat them when they grow large enough\n\n5. Lighting\nModerate, natural-cycle lighting (8–10 hours a day)\nIf using live plants, ensure the light spectrum supports plant growth\n\n6. Maintenance Tips\nHeight matters: Ensure the tank is tall enough so their fins don\'t drag or get cramped\nStability: Angelfish are sensitive to shifts in water chemistry; drip-acclimate when introducing them\nHealth Watch: Check for \"hole-in-the-head\" disease or fin rot, often caused by poor water quality', 'Fresh Water Fish', 160.00, 40, 5, 'http://localhost:5000/uploads/1775281718650-363831253.jpg', 0, '2026-04-04 05:49:54', '2026-05-09 09:46:32'),
(9, 'patingtang', 'burikat', 'Salt Water Fish', 20000.00, 49, 5, 'http://localhost:5000/uploads/1776475725690-42081923.jpg', 0, '2026-04-18 01:28:51', '2026-05-09 09:33:42');

-- --------------------------------------------------------

--
-- Table structure for table `product_reviews`
--

CREATE TABLE `product_reviews` (
  `review_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `review_text` text DEFAULT NULL,
  `is_verified_purchase` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `description`, `created_at`) VALUES
(1, 'customer', 'Regular customer - can browse and purchase', '2026-03-26 22:01:16'),
(2, 'admin', 'Administrator - can manage products and orders', '2026-03-26 22:01:16'),
(3, 'moderator', 'Moderator - can manage orders and reports', '2026-03-26 22:01:16'),
(4, 'worker', 'Worker role for cashier and operations', '2026-04-05 16:05:49');

-- --------------------------------------------------------

--
-- Table structure for table `transaction_logs`
--

CREATE TABLE `transaction_logs` (
  `log_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `customer_name` varchar(120) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` varchar(500) DEFAULT NULL,
  `processed_by_user_id` int(11) DEFAULT NULL,
  `processed_by_name` varchar(120) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_accounts`
--

CREATE TABLE `user_accounts` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `suffix` varchar(20) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `address` text NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_id` int(11) DEFAULT 1,
  `legacy_role` enum('admin','client','worker') DEFAULT 'client',
  `is_verified` tinyint(1) DEFAULT 0,
  `otp` varchar(10) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `is_senior` tinyint(1) DEFAULT 0,
  `is_pwd` tinyint(1) DEFAULT 0,
  `senior_verified` tinyint(1) DEFAULT 0,
  `pwd_verified` tinyint(1) DEFAULT 0,
  `profile_image_url` varchar(500) DEFAULT NULL,
  `id_image_url` varchar(500) DEFAULT NULL,
  `id_front_image_url` varchar(500) DEFAULT NULL,
  `id_back_image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_accounts`
--

INSERT INTO `user_accounts` (`user_id`, `first_name`, `middle_name`, `last_name`, `suffix`, `birthday`, `gender`, `contact_number`, `address`, `email`, `password`, `role_id`, `legacy_role`, `is_verified`, `otp`, `otp_expires_at`, `is_senior`, `is_pwd`, `senior_verified`, `pwd_verified`, `profile_image_url`, `id_image_url`, `id_front_image_url`, `id_back_image_url`, `created_at`, `is_deleted`) VALUES
(1, 'Hatsune', '', 'Miku', '', '2007-08-31', 'Female', '09123456789', 'Japan', 'harijie.mabilin@cvsu.edu.ph', '$2b$10$5vdmFsuWbTXhvScM2.Ow7u85RySVsFR.IcVPnA4K6XfK4lHbcsFBm', 1, 'client', 1, NULL, NULL, 0, 0, 0, 0, NULL, NULL, NULL, NULL, '2026-03-18 12:33:18', 0),
(2, 'TongTong', '', 'Fish', '', '1111-11-11', 'Fish', '09123456789', 'Imus', 'tongtongornamental@gmail.com', '$2b$10$HoDGtrCo7BRHTIqO2SfGYeLw8WO.arpG9gA2a8OX.4pPwkOnF8hqy', 2, 'admin', 1, NULL, NULL, 0, 0, 0, 0, NULL, 'http://localhost:5000/uploads/1775315472749-541703962.jpg', NULL, NULL, '2026-03-18 12:34:27', 0),
(3, 'Harijie', '', 'Mabilin', '', '2004-07-15', 'Male', '09987654321', 'bacoor', 'harijiem@gmail.com', '$2b$10$WEzjRPjozS2MORthRAKWUO89fN0C5qcieM8ehtgk3IMDvyPveWPD6', 3, 'worker', 1, NULL, NULL, 0, 0, 0, 0, NULL, 'http://localhost:5000/uploads/1775406378600-744408257.jpeg', NULL, NULL, '2026-03-18 12:35:18', 0),
(4, 'Megurine', '', 'Luka', '', '0000-00-00', 'Female', '12321423423', 'Japan', 'mharijie@gmail.com', '$2b$10$Evj/gCB2HZZcNb50yEbXIuk0ji68dYbsJJUCHvOiyhxIq2NuFykfm', 1, 'client', 1, NULL, NULL, 1, 0, 1, 0, 'http://localhost:5000/uploads/1775834385763-332087256.jpg', 'http://localhost:5000/uploads/1776476377407-724978524.jpg', 'http://localhost:5000/uploads/1776476377407-724978524.jpg', 'http://localhost:5000/uploads/1776476377408-344021430.jpg', '2026-04-03 04:22:18', 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_session_logs`
--

CREATE TABLE `user_session_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role_name` varchar(50) DEFAULT NULL,
  `login_at` datetime NOT NULL DEFAULT current_timestamp(),
  `logout_at` datetime DEFAULT NULL,
  `login_success` tinyint(1) NOT NULL DEFAULT 1,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `session_token` varchar(128) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_session_logs`
--

INSERT INTO `user_session_logs` (`log_id`, `user_id`, `email`, `role_name`, `login_at`, `logout_at`, `login_success`, `ip_address`, `user_agent`, `session_token`) VALUES
(1, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-04 22:21:01', '2026-04-04 22:22:58', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '103def41d22f4d5a67cbcf9ba831f22ccef8187e94737478'),
(2, 3, 'harijiem@gmail.com', 'moderator', '2026-04-04 22:23:25', '2026-04-04 22:23:34', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5e235091edbb8f5c74d86e605743fd1097535f48a93df2a7'),
(3, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-04 22:42:48', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f74c9d1d3fc706ac33479e4c1b369ad77b34e43b6ebd1481'),
(4, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-04 22:50:05', '2026-04-04 23:03:35', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '1b785e5e31d9446c7c2e62a76ab8b3d2c3ee15ed268247d8'),
(5, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-04 23:04:38', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '347087a4321f9d03dcfb3aea68d84279974e44c0ca534b56'),
(6, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-04 23:14:02', '2026-04-04 23:17:02', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bbe0d18812f348393ed1f563836a84d87e8668fdd8138b88'),
(7, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-04 23:19:21', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f08548788186f455b49444067a44035e28b08a139c073873'),
(8, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 00:14:37', '2026-04-05 00:42:09', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'c3a7d47c44dfd7ad3f53a19543c067c093a6f2b60dce3e3e'),
(9, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 00:57:59', '2026-04-05 01:14:21', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd55daac7dc424e191ec08e011f11704a19bd2f39ae21777f'),
(10, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 21:03:29', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'ffe2d803e317f521019667fedcdb92cde3496744198e9553'),
(11, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 21:34:30', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd2fa54a4f55ca28cc178481eb747b9203ce3811f16ca478f'),
(12, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 21:45:47', '2026-04-05 21:53:56', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '3879ccf11641845a86295f3de90a1569648cf5a4bbcf08db'),
(13, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 22:00:32', '2026-04-05 22:04:04', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5a42f0faafe3613593e5d9ea273210cde1790c6248cdb06e'),
(14, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 22:07:38', '2026-04-05 22:09:20', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '8a4256771354f6deea8ffaa309244dcd0d76eaa9b504ce28'),
(15, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 22:11:43', '2026-04-05 22:34:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '277e8bc4b7e6ce2a52a79966e4392ffdbc1c2a02343ed9db'),
(16, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 22:50:23', '2026-04-05 22:54:45', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'de365245be568db6759305699afaa27948f1356cd4b25256'),
(17, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 22:56:41', '2026-04-05 22:57:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'ccaad9b84a5007ac579d3adf54d0163fdf62819f487eb620'),
(18, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 22:59:55', '2026-04-05 23:02:00', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'ee05f65e2b8f68f01656b3857855099d48a3c9861d2762b3'),
(19, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 23:19:12', '2026-04-05 23:19:34', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b2c5de7be1252f00682dd7b091d424d43a850654e401dba1'),
(20, 3, 'harijiem@gmail.com', 'moderator', '2026-04-05 23:19:58', '2026-04-05 23:20:57', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f669efedd70146bd8354d239939f1988a2c8de038fd97667'),
(21, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 23:21:12', '2026-04-05 23:28:35', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '3300a566b3e831caea09deff413ed4032d32239249c9b45c'),
(22, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-05 23:35:57', '2026-04-05 23:45:26', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd17b4b5148a87a92a5a0926d7b9da461e3dd7b233b94c95c'),
(23, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 00:07:01', '2026-04-06 00:10:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '15e2b7638670987edf5aa7b659437707df3e2035ae6bc5d8'),
(24, 3, 'harijiem@gmail.com', 'moderator', '2026-04-06 00:11:09', '2026-04-06 00:14:17', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '03080aee247e5acb5aa64eeb622eb5f718f9ea074057dffe'),
(25, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 00:24:54', '2026-04-06 00:25:12', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f91e6af760fd570d4b5c9ad03fc480c1a53e88d9d371162d'),
(26, 3, 'harijiem@gmail.com', 'moderator', '2026-04-06 00:25:33', '2026-04-06 00:26:24', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '026c67f6fc899810da4d7352c797352fa3fc0739a3e4acf3'),
(27, 3, 'harijiem@gmail.com', 'moderator', '2026-04-06 00:26:44', '2026-04-06 00:26:46', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '1cc74d8d50adc2ad888cea2fe6adc303392ea03cd87d9aa7'),
(28, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 00:27:09', '2026-04-06 00:27:12', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '83dcbe1dfd38da9d3c6731905f9c9afded30879cb29758bd'),
(29, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 05:25:09', '2026-04-06 05:27:38', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '8990797c577d0d5a50bda4d09742c3eab21201c886f93281'),
(30, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 05:27:51', '2026-04-06 05:27:58', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'aeb249b8d3159543c293ac310ab4b5f85c729e0285a25915'),
(31, 3, 'harijiem@gmail.com', 'moderator', '2026-04-06 05:28:37', '2026-04-06 05:34:15', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '574fd42689e73102507a57eebb8856d3777a686c86faa44a'),
(32, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 05:41:10', '2026-04-06 05:49:41', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f54902aab0fbb491c8304a1eb8c1721635460813886c5a16'),
(33, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 05:52:46', '2026-04-06 05:55:19', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '7fce84f03de82f93d3aa3ceb8ac8e44af0364a47038de793'),
(34, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 05:57:42', '2026-04-06 05:58:25', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f0b7ec907a5191f519d25fe6bdf974a0fcc31b8559480977'),
(35, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 05:58:41', '2026-04-06 06:01:11', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bd4ed3d20e366d5b6e6c11f528d2ad380c3f771c6cf2b7db'),
(36, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:03:11', '2026-04-06 06:05:16', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '65ad9f60e4a827a948984772652e81852e16c68a8d0915fd'),
(37, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:07:06', '2026-04-06 06:08:00', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a8373d5e320679b1ce2f3a50ce663e3ae18359fa2e8b562b'),
(38, 3, 'harijiem@gmail.com', 'moderator', '2026-04-06 06:08:12', '2026-04-06 06:13:34', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5f6c0e88bd4ccd2acfa135c7626acfd934288b12a16c792a'),
(39, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:18:11', '2026-04-06 06:18:21', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '817ce9779023299ab09a0e160c707167b3d464fc508c6988'),
(40, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:19:00', '2026-04-06 06:19:46', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '79669667b1ea46d5181b374e4b784902b03c47adef707613'),
(41, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 06:19:59', '2026-04-06 06:20:58', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2a283bcf210884b7f32c35231ec48f8c149724e0b3b17265'),
(42, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:24:21', '2026-04-06 06:26:22', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '07c3ef309bc94053849e650b0dafe079b5b0c48fa66e2b52'),
(43, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 06:26:38', '2026-04-06 06:28:23', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b1f7a28aa0d606c40f795f3a937f0ccea197abe33d16fbf0'),
(44, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:37:17', '2026-04-06 06:37:54', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '9a7ee7f4b1029722c3d9c4d79a5e5a016ed876ff396519b6'),
(45, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 06:42:05', '2026-04-06 06:42:15', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '01f93f2b543462d0c59f4deb71c8b6fbd1ed0ceae1035f1e'),
(46, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:42:29', '2026-04-06 06:43:32', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a9e2343a8454ffd3c9515c47c228811f1c0a4cfcb27322f5'),
(47, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 06:45:01', '2026-04-06 06:45:36', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '921dcdc13664a4e7865f4d6c4b0bdb429a368303aae63f75'),
(48, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:45:46', '2026-04-06 06:49:21', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '9d248503feaab08d4cf8bc774c15ef2974fd8fc8c825b685'),
(49, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 06:59:24', '2026-04-06 07:02:12', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '7a0ec5a755bc4d43810959787b89bf22262ccca974b2a3ca'),
(50, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 07:03:36', '2026-04-06 07:09:29', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '4186fe66cdb9586fb700115c1f2365290764619514e5915e'),
(51, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 09:32:26', '2026-04-06 09:38:21', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a1d4deb79c6444e41144fac114dc422be4845b491b389f26'),
(52, 3, 'harijiem@gmail.com', 'moderator', '2026-04-06 09:38:50', '2026-04-06 09:39:23', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '162e34de4440332729b44b9a055c72192e3c472a01a0c9e8'),
(53, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 09:39:37', '2026-04-06 09:40:12', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f929d335585d0814247ccf2cd9a0aa3a7a77eb0be4d12e6b'),
(54, 4, 'mharijie@gmail.com', 'customer', '2026-04-06 10:55:13', NULL, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '0c501b04fecae6dd90378afcc8ac60b21488b20121eb1549'),
(55, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-06 10:56:10', '2026-04-06 11:02:57', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd3061bb1dd655d83ff91fa65486a035eac15403bf9dd710f'),
(56, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-08 00:14:16', '2026-04-08 00:15:17', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b19dfc7fa01b023ca7f86a1c2285b9b20f16e453ad7b7c94'),
(57, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-08 00:23:21', '2026-04-08 00:24:17', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '6572a0c0d751f08302db7f3f4b4d1113ab46c08edf815314'),
(58, 4, 'mharijie@gmail.com', 'customer', '2026-04-08 00:24:36', '2026-04-08 00:25:17', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e1ae4d65405d18b80c189b669091aa88556c11122d7c420c'),
(59, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-08 00:25:37', '2026-04-08 00:29:22', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '41f633f3069a94e84577fb5ff4c5de11101d8b6859a49d6a'),
(60, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-08 00:46:17', '2026-04-08 00:48:53', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'dde21296df95e74e2fc9b00f3a22ee5f0cd9f3329118b9d1'),
(61, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-08 00:54:57', '2026-04-08 00:57:24', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '8b2454f88c4edc7fde809d893ed10207cbc1251cca72213b'),
(62, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-08 01:05:48', '2026-04-08 01:07:31', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'fa591ef870cc036c67e91f66cb6cb69e83724848557c2f9e'),
(63, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-08 01:13:24', '2026-04-08 01:14:13', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'ad07253519b7c83b101f1affdc274852e903c96f64b40287'),
(64, 4, 'mharijie@gmail.com', 'customer', '2026-04-08 01:14:25', '2026-04-08 01:18:12', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '77f05e10c98d1978d280bb73a5d826df482c74845c2247b4'),
(65, 4, 'mharijie@gmail.com', 'customer', '2026-04-08 01:34:43', '2026-04-08 01:37:42', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '143b4ade5865f1eedd93b19cfb75b4b6f063bdca378f8120'),
(66, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-08 23:25:08', '2026-04-08 23:29:42', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2515c4fc89adee38b8b4d6f9ec499247b327e63f00954987'),
(67, 4, 'mharijie@gmail.com', 'customer', '2026-04-08 23:29:54', '2026-04-08 23:32:57', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '7099fa6ff3e1fabf91cfdbc9988f21f946e1d537b1ae5a07'),
(68, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-09 22:26:36', '2026-04-09 22:27:04', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '78bbfafe9028a1111202ba24eb7613769ecc68ed235356d1'),
(69, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 22:27:19', '2026-04-09 22:31:21', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd189fad9be355452030239189ee4a448397227801c2f650a'),
(70, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-09 22:57:39', '2026-04-09 22:57:54', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5614b659f3ac2495f25f3f1a9214e98477f4f6a277ee5a6a'),
(71, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 22:58:06', '2026-04-09 23:04:56', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '12b6c57f451939c215c70859e7ccd6c828d1bef7f1c44a55'),
(72, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 23:07:26', '2026-04-09 23:11:53', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd7a0149f7fa7d87d19ddf003e5d45062640f909117964137'),
(73, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-09 23:12:12', '2026-04-09 23:13:38', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bbcbe3257ebd63b9d678541aff61b75bed57126dbc2abcaf'),
(74, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 23:18:25', '2026-04-09 23:23:08', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '9293b1bec23c2b9bdcddc58b81a4cd2b5bcbf243e5624c16'),
(75, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-09 23:26:00', '2026-04-09 23:26:24', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '194770baa6c0e7e61b312578b2b585fa7ae52bc4aa0e3221'),
(76, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 23:26:35', '2026-04-09 23:28:26', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f5f75d14e486e5954f20b0d2b333429b897bafc28a9bea5d'),
(77, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 23:30:38', '2026-04-09 23:35:15', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bf89a62cb14524015a2af67c24b006e7b838ed90410e0a8a'),
(78, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 23:39:17', '2026-04-09 23:42:06', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e7dd85892ec3b8442dfb8972f89211a4a99948d9cdf415a7'),
(79, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 23:46:19', '2026-04-09 23:48:39', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '8058106b192311a1ee9b35415c4729a554407c606dfae49a'),
(80, 4, 'mharijie@gmail.com', 'customer', '2026-04-09 23:55:31', '2026-04-09 23:56:34', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '4ebe47301a3f9e93f2e0c02046f7527774623e3dc67f7a07'),
(81, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 00:00:20', '2026-04-10 00:00:27', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a5678d1b6dc98fa26c47b8852cb55778e578bd22efbb57dd'),
(82, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 00:00:42', '2026-04-10 00:00:54', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e0d5782c97c6971628cc659764c05c884e20ef4acdeef546'),
(83, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 00:05:49', '2026-04-10 00:09:30', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bea59bb6335084e02c230efac42924359addfa6039ce0b2e'),
(84, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 00:12:14', '2026-04-10 00:13:10', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a9a0964db47d2b5905703d0188b1cc0638f0d69cafae9d43'),
(85, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 00:15:24', '2026-04-10 00:17:02', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '90e0ae8dcc3b6121e16ada462471c623002a30998ec1a84b'),
(86, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 00:21:17', '2026-04-10 00:21:44', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '493cc1636a13cfba18bc880189f583067ff89660b62ed2f0'),
(87, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 08:32:15', '2026-04-10 08:33:42', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '02237432bf9f106bd3ec32b9d98f11008c0b0d566c220595'),
(88, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 08:36:14', '2026-04-10 08:38:42', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '3c8095cb617b7443f5d95697c0a84891c11082e19960cf64'),
(89, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 08:48:06', '2026-04-10 08:52:58', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '7430d7598e9330ad90b904c7d0224092919b8dacc64cc08a'),
(90, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 08:57:24', '2026-04-10 08:58:29', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '7dd2f06adb5418afa68ad0e5b579e00ede595cb8d188c027'),
(91, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 09:01:37', '2026-04-10 09:02:28', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b1a0b5545966ccfb2c70143b218eae96ca8f3c2838e1f0ef'),
(92, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 09:06:44', '2026-04-10 09:07:18', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd7285d10a7bde11abd22bcf93acb18ab72ce78162f0619ce'),
(93, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 09:07:44', '2026-04-10 09:10:01', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '45f74b69400296ff9e69a25d898db7948441a242e005d8d7'),
(94, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 09:16:50', '2026-04-10 09:17:41', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '4cb2159fbed93bb06d94cb20998149fbd24cb791308c0015'),
(95, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 09:21:25', '2026-04-10 09:24:17', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', 'f92dd286ca2e681004ddad33d21610944d64d8e53c0995ee'),
(96, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 09:27:19', '2026-04-10 09:30:35', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b1ea917bbe498a5bdf1c894870c7ba941b4ff400306d9fc5'),
(97, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 09:33:32', '2026-04-10 09:36:58', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '367d11dee90785aad16210aad941342b6ef9c4ac8c24e685'),
(98, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 09:55:32', '2026-04-10 09:56:10', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '02d080a463f411300aa639df2a3c3210d0865ae199cedf92'),
(99, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 09:56:25', '2026-04-10 09:58:48', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '4dd76650f8cc72deacdff85eeb1ff4a19f0141f1b3b64541'),
(100, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 09:59:01', '2026-04-10 09:59:51', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd1dc03dc68c4e9e6d21d6b236d52516a7454403ed526ee88'),
(101, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 10:14:05', '2026-04-10 10:14:55', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'abb7fd2ebd5875ea75d959d7dc6adf864b0e2cdb3b852391'),
(102, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 10:15:09', '2026-04-10 10:17:00', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f26510c3c6ee41faf0b6d5eeca601fcc847728c5a56474c3'),
(103, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 10:21:40', '2026-04-10 10:22:39', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a15352986ddf1ba2b0059f9699e4da8bb2ac71e0804e4c83'),
(104, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 10:23:45', '2026-04-10 10:24:21', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a869d69469f7383a1b15ed88dc38080da9da4be988cfa739'),
(105, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 10:27:45', '2026-04-10 10:28:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '04637fe3583bdf24a435b00d3c61f9bfa9501708304ab54d'),
(106, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 10:29:16', '2026-04-10 10:29:34', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '98e4d82edea22ae5fb0277d61a289df15697c15869f1046b'),
(107, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 10:33:28', '2026-04-10 10:33:37', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '76a2c32464a635bfc1c32f51ac1c105bda8960c1c82252a9'),
(108, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 10:33:52', '2026-04-10 10:34:05', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'c08571ddd42bf70613fc47c749f006f0d647d3de99798341'),
(109, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 10:34:18', '2026-04-10 10:34:50', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '25255bb54d7983db80b3c94a3e0ec591c58140768f6f2a10'),
(110, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 10:35:08', '2026-04-10 10:35:20', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '8645eac8cec14968e959d87fb93f848796c8ad758d03d842'),
(111, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 10:35:33', '2026-04-10 10:36:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '819b1a014f0efa8efdb12c58b8efc82d8bfdaa28f7fcb2f2'),
(112, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 10:42:32', '2026-04-10 10:44:32', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '991da7f375f97b4459ce757ffe2a61ad6120af2e4509b153'),
(113, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 10:46:22', '2026-04-10 10:47:03', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '707abebf6c9b5474e13beddbf812f857106d2ffe043feafa'),
(114, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 10:52:40', '2026-04-10 10:56:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '94b19593ed6075cb634b9e80dd00f73e791d7045e42be646'),
(115, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 11:00:56', '2026-04-10 11:02:29', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '45afae6f0ecdd5d37089cbe20cc825f6cdfcd8bef5189a41'),
(116, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 11:12:30', '2026-04-10 11:19:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '906441ddf406dea491d688a637b7c9ff5867400a2f3c0af5'),
(117, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 11:20:11', '2026-04-10 11:21:05', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd31bb845cf4f6d1d7062d5bca3c366a50678c1af3c8c7b83'),
(118, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 11:22:01', '2026-04-10 11:25:06', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f9e3f4a75cd4ee2b0e2b5a28caaf656bb9866c5ef2f33568'),
(119, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 11:48:11', '2026-04-10 11:48:39', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e48f5d91595e59a0a7596aec28fd2966a3a5b92d75430552'),
(120, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 11:48:53', '2026-04-10 11:53:05', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'dc749639ce36353809cef209dbe74f390cb654b509fb68d0'),
(121, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 11:53:20', '2026-04-10 11:53:57', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '1c1ecf148b370b8e747e4de5c4ef2051a3d77852f3d76952'),
(122, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 11:54:10', '2026-04-10 11:54:38', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '7a6cb97d0c9e16166bfade08a00308a27c1f703aeacc6935'),
(123, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 12:19:08', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5f363f73091189b38eae320262796224dde82c76d208b5de'),
(124, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 12:19:47', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2ce2c81419f68130e26b4c76a4c18a5d09c5c394984c88a1'),
(125, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 12:24:07', '2026-04-10 12:25:26', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '199d1660f9571dc089c8751579a22a2e7a9401be9035bf4a'),
(126, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 12:25:50', '2026-04-10 12:26:30', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2b2770b2e00ed969d7ef0df4df92bd44323fabdbfd890339'),
(127, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 12:26:44', '2026-04-10 12:26:57', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e11dfb9264f300fed4314fa05ad2699d4ecc44811706466a'),
(128, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 12:35:59', '2026-04-10 12:36:21', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '6372abe2d365a26bea97fc151975b737a9ecbcb1e3477827'),
(129, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 12:37:18', '2026-04-10 12:37:42', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '10529867450c6e9aaa1e02c90fc6fbfef81b241b580995bb'),
(130, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 12:41:07', '2026-04-10 12:42:32', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd59b1475c6d7303229b5a8d615910f02d7d05a3b30e3905a'),
(131, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 12:42:55', '2026-04-10 12:43:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '59e911898b5b135c4b46d50b0a29535952ffeaa945d5870c'),
(132, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 12:49:27', '2026-04-10 12:49:36', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd2e2d03bcd3fdcb96e6b4347bdccff24f29d82d5a93ac245'),
(133, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 22:37:08', '2026-04-10 22:38:21', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bd5a8e619a425cfb314463f1d9c81ecacfcb9af861390e2b'),
(134, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 22:38:36', '2026-04-10 22:39:36', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b17cd46d2062b56608e7637351673f257e86574fcf7403ea'),
(135, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 22:44:40', '2026-04-10 22:45:03', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '1ac82c137fb8e88748b11f718dbc9f4689338eac6ae88273'),
(136, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 23:14:12', '2026-04-10 23:22:31', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', 'f3cad39d8f15eea4186a66ce8b2ffe92380dea44a690aed5'),
(137, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 23:17:41', '2026-04-10 23:19:52', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5e3cef3878834e895584befa367bdd6e2ec51499772d68c7'),
(138, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 23:29:46', '2026-04-10 23:41:48', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', 'e008ef5d2489cec1280242faeaad45f7e06b32e1c5c8d2ca'),
(139, 4, 'mharijie@gmail.com', 'customer', '2026-04-10 23:31:33', '2026-04-10 23:34:44', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b2a329ee1e669c3885854c9c970894457a0080f82f833fb4'),
(140, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-10 23:35:02', '2026-04-10 23:39:19', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'cd13a9a768a31134b56510f9a81872a568b291f044019fc9'),
(141, 3, 'harijiem@gmail.com', 'moderator', '2026-04-10 23:39:34', '2026-04-10 23:39:45', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '1667df5616a7c21dfc7af8071ab6b53f0d756c624ec8672f'),
(142, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 15:28:19', '2026-04-16 15:34:34', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a16ffa42578f6ec48e823f114df8ca3a8a443c6128e3e5b2'),
(143, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 15:48:56', '2026-04-16 15:59:10', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e1437f82308730978dd2230da76c6810e82fb48df177c73e'),
(144, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 16:09:32', '2026-04-16 16:10:53', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '6da132f1ed613e8e6ba454bb54c998cb57229699c36c4955'),
(145, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 16:13:45', '2026-04-16 16:14:15', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b2a5fe7c733b60eea029b0306069abc04e7562d02797ea1a'),
(146, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 16:14:30', '2026-04-16 16:15:47', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f1dbf5122553e03f80d7b7bb294acc0814db4bcb454779a7'),
(147, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 16:16:01', '2026-04-16 16:20:08', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'eb9510e2fd996aa59600def132931c22c39389e6c07e24c0'),
(148, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 16:23:55', '2026-04-16 16:29:14', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'de443c248183f3c7633092b551792cd006112f5357d1ed98'),
(149, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 17:19:36', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '728f91f9a58593eddd91976d49f9f6f84df2fe0e33ad3c57'),
(150, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 17:20:19', '2026-04-16 17:20:25', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '81f4de32d6e44091764acca09c7143f80354f42742157e25'),
(151, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 17:20:35', '2026-04-16 17:20:38', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bb7cebaa6b7dc25ba2fa00b6ddf54aaad2c7c201a8721b8c'),
(152, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 17:27:40', '2026-04-16 17:28:20', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'fe3f05e5eca0a527e9efee6ce415debc8fa11f3f5c388e39'),
(153, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 17:28:36', '2026-04-16 17:33:45', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '287d11b2c96a5408da50683cfca545c1c44022c6c2bd7d3a'),
(154, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 17:37:09', '2026-04-16 17:38:53', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '3451c882f4fb9bbf5c0cd732caa5072f03727d2fe8073f39'),
(155, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 17:44:45', '2026-04-16 17:45:27', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '170a97a64786e2cd8f7823bdcf68b45b8fdf424434b17e07'),
(156, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 17:48:37', '2026-04-16 17:48:56', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '7dbd6ac431c01232497a254eab374e3d7c5f65b368436ade'),
(157, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 17:49:15', '2026-04-16 17:52:43', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b881735084f7e5f9a648f1bdbb520c9ad4bcddb0f1317eb6'),
(158, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 17:58:53', '2026-04-16 17:59:17', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd3d88244fd27a0ec7da3e89c5a758d1eafffdcf3ee0608f9'),
(159, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 17:59:30', '2026-04-16 18:01:00', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '762ddf166b53b4fb42ea4cc2e60b078018ce9498a9647a3b'),
(160, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 18:04:01', '2026-04-16 18:04:26', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bff8697b5c8244895cd0ac7ac68112ef94283ce9ef354a07'),
(161, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 18:04:37', '2026-04-16 18:04:46', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'da1096145bfca94164f9c640491d6d4a0396e7829852b947'),
(162, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 18:05:00', '2026-04-16 18:05:16', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '47582aed4daeab9d25b3ee872214ce4f6113c1dad0bdcbf4'),
(163, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 18:05:39', '2026-04-16 18:08:06', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b1e795b68543ed881ad0fea8cf38e9622daa959fad902676'),
(164, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 18:12:31', '2026-04-16 18:13:31', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'c8b2b3d4e832fa6fd9ee80b96d29381589b8b1f6967d7ad3'),
(165, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 18:17:33', '2026-04-16 18:20:24', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e10112195fda5185f69368d09ef76e63c6e6dc538ae423fd'),
(166, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 18:20:38', '2026-04-16 18:22:06', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '3b01365bc96a2d4cb03c2a7eabd4cbe08f184e246bf876f2'),
(167, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 18:28:19', '2026-04-16 18:29:20', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '721e22d280778a9c4609e43eb614470e651d84b730e21c6d'),
(168, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 18:29:31', '2026-04-16 18:31:33', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'be32dc65f120b46189c326af10fe2d4735e7ef476e2e0320'),
(169, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 18:54:05', '2026-04-16 18:56:49', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '989225c69051e1bf1f7af238acfd919ba99fd4840c4e2ffb'),
(170, 3, 'harijiem@gmail.com', 'moderator', '2026-04-16 18:57:07', '2026-04-16 18:58:08', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'bb1099cf41721b2007f63200517f69243ba91a6eb1f34177'),
(171, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 18:58:38', '2026-04-16 19:00:07', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'cf94f0c61878be0226396750c30d88bd16f358602eb2a2a6'),
(172, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 19:00:22', '2026-04-16 19:03:13', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '39e48a25027cf698b3e15a872204b29bae3897dd9707dab5'),
(173, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 19:03:30', '2026-04-16 19:03:52', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2c380edd88e3b9d88ace33ef03e7bc609c57a97de2d1c5dd'),
(174, 4, 'mharijie@gmail.com', 'customer', '2026-04-16 19:13:44', '2026-04-16 19:14:14', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5a791d4375e2306be357fbd4167d9928065469a6d3aff760'),
(175, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 19:14:32', '2026-04-16 19:16:53', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd17a43baff22d4478a87afc3299c789df0e5a0943164910a'),
(176, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 19:22:35', NULL, 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'f170271271a771141877bc30019d948fd3c77688ca5ec54c'),
(177, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 19:42:07', '2026-04-16 19:44:57', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '79b85e253eac5ec72dfef42dbe508777136ec4f2af59b092'),
(178, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 19:48:21', '2026-04-16 19:51:33', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '9de64824afe1fd9ba1729a3cd48de28cf00d594d67afb97e'),
(179, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 19:56:42', '2026-04-16 20:00:04', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '178f2bfdd9614cada1d2c0a90c88c1b79bfded285ebb2a15'),
(180, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 20:03:40', '2026-04-16 20:04:14', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'b96816afbbe9289f9b582e017d620328756fde2155b65e96'),
(181, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 20:09:11', '2026-04-16 20:12:41', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'facade1da17fd8b4191256b190eb4ae94e2b0219ab629acf'),
(182, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 20:20:13', '2026-04-16 20:22:20', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '891d004d983b0ced04fd317fffa067486783eac4df564299'),
(183, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 20:25:16', '2026-04-16 20:26:40', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd6a91a6331bfc3ea147702363aa7bc31e1ede98cd71b3cd7'),
(184, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 20:29:15', '2026-04-16 20:31:36', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'dc034490f844687fd502d9c3d29920e50d7055b30688d90c'),
(185, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 20:47:45', '2026-04-16 20:49:23', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '602c4fb825e73424e7752f82d1d68172315da09571708819'),
(186, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 20:59:00', '2026-04-16 21:00:48', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd23b26ce41492af10c331b1b4f5973ba1961f98f56f72fbe'),
(187, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 21:08:45', '2026-04-16 21:11:00', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'ba3bc5309dbd40a910ce4b9679c7eed33df748f7620c94ce'),
(188, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 21:23:45', '2026-04-16 21:24:13', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e3886d6367aed49254b731a6c152b0c4a8315ee3d3321007'),
(189, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 21:28:28', '2026-04-16 21:33:43', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'e7316e21bb0aa1f8498bbaf3e953f0dab6f68d905cfa0960'),
(190, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 21:34:14', '2026-04-16 21:36:03', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'ec5cc1b5e48d9a4e12035ad1f51316926b0a038df15fd3bc'),
(191, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 21:38:52', '2026-04-16 21:39:45', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '28d90c1c005b515c4049ae2a1b0bdf44bd250e44c7e9430a'),
(192, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-16 21:44:10', '2026-04-16 21:44:31', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '79262e4aaa0c2db85aaea6b158eedfadf2ddbf490740d852'),
(193, 4, 'mharijie@gmail.com', 'customer', '2026-04-17 11:31:50', '2026-04-17 11:56:37', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'ac5e0013b9bcfe96c1399127e5c4f49875abd0e0936c8f11'),
(194, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-17 11:56:51', '2026-04-17 11:57:10', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '3104fcd9307188c121ddc16eaadce4e5ad8b4d51a75afcd1'),
(195, 4, 'mharijie@gmail.com', 'customer', '2026-04-17 11:57:23', '2026-04-17 12:11:41', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'a631d0d9a0408995f1fe8d522f1040b004537fb8286162fe'),
(196, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-17 12:11:28', '2026-04-17 12:15:32', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'a736eea69743fcb5d843fc88445cd39c0fb975ac8c927a49'),
(197, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-17 12:17:40', '2026-04-17 12:23:45', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '77cb97e8df5d77360c168b14c1d6ed704e2508f514edaffc'),
(198, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-17 12:24:11', '2026-04-17 12:25:59', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'ec69bb94c9f187be568419cb7f4c8a16230b7985ed692100');
INSERT INTO `user_session_logs` (`log_id`, `user_id`, `email`, `role_name`, `login_at`, `logout_at`, `login_success`, `ip_address`, `user_agent`, `session_token`) VALUES
(199, 4, 'mharijie@gmail.com', 'customer', '2026-04-17 12:26:10', '2026-04-17 12:26:50', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '29718bc30ac31d4110162b34b977b25650427e8fba2cda95'),
(200, 4, 'mharijie@gmail.com', 'customer', '2026-04-18 09:02:15', '2026-04-18 09:39:45', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '201125a8fc81b6d6a35cf70ff4c87aeb2d636613896a5af8'),
(201, 4, 'mharijie@gmail.com', 'customer', '2026-04-18 09:23:24', '2026-04-18 09:23:50', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '685b2af41ac7de7e0263b1635fc98b02a6a3c588242e15aa'),
(202, 4, 'mharijie@gmail.com', 'customer', '2026-04-18 09:24:02', '2026-04-18 09:24:23', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '83e56d0d89bb8bea67ae9c5adc08f4d4383f6f43bc171867'),
(203, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-18 09:27:23', '2026-04-18 09:29:06', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '90c336a481a4fa3302fcad6acde47c5b144599a540a13f95'),
(204, 4, 'mharijie@gmail.com', 'customer', '2026-04-18 09:29:21', '2026-04-18 09:30:43', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '1bdd0df7157cf4acf6b69d1f1568c144cc895d0bc44d8e72'),
(205, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-18 09:30:58', '2026-04-18 09:31:47', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'd891c85ef7e887cbe7173b72bad10c5836d3f8f21cd69d42'),
(206, 4, 'mharijie@gmail.com', 'customer', '2026-04-18 09:32:01', '2026-04-18 09:32:34', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5895409e88d105f45a6bbd1712ed6df2710c2d7b8498a671'),
(207, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-18 09:32:55', '2026-04-18 09:33:07', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '07e6d9acc5921b587195cdb0bf349c4aa6a141ce8a0578ea'),
(208, 4, 'mharijie@gmail.com', 'customer', '2026-04-18 09:33:32', '2026-04-18 09:35:44', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '5a31586d54f45e8596d86191bc1c8689a3acc5db72de35cd'),
(209, 3, 'harijiem@gmail.com', 'moderator', '2026-04-18 09:36:24', '2026-04-18 09:43:41', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'cd9f316c75e28f3cd40b6a7e88ed20bdb48d1222003afef2'),
(210, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-18 09:40:07', '2026-04-18 09:43:14', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'feb59234ce56ba631339f29525d705a68737cf53d42bd634'),
(211, 4, 'mharijie@gmail.com', 'customer', '2026-04-18 09:43:46', '2026-04-18 09:45:02', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '73f6cb26e7c4ded9f25d0b127f81e2bba0071ef8247c12be'),
(212, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-21 11:05:21', '2026-04-21 11:24:32', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '211900ab35d892a5d66f6692e9b2ca590c4e331d23f06b9b'),
(213, 4, 'mharijie@gmail.com', 'customer', '2026-04-21 11:24:42', '2026-04-21 11:31:58', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', 'fbdf56d017a749f4cc8c5c1159483c7328e8a74db8c52cc5'),
(214, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 14:33:22', '2026-04-27 14:33:27', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '43a944b5f965777ec74387e9705f8ac706c27a265d8611b4'),
(215, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 14:48:26', '2026-04-27 14:51:52', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'ea570a8fd031c4273d955f35081be1acb0fe29ad318f5ce8'),
(216, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 14:58:03', '2026-04-27 14:58:54', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'b1fde94371c8d0e129af9ff06392a3dc3cb62d74da9be9f8'),
(217, 4, 'mharijie@gmail.com', 'customer', '2026-04-27 15:10:58', '2026-04-27 15:11:57', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '0f52221f3e9f95b771f54ff5e7b88805eea88e24bf153eef'),
(218, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 15:12:12', '2026-04-27 15:12:35', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '686ffaefbf49959dc9a092e355982e30f6ae7d053670a05d'),
(219, 4, 'mharijie@gmail.com', 'customer', '2026-04-27 15:12:48', '2026-04-27 15:15:53', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '72dce17f9a931df1ca724318c43bbfcf6aea284ae7c02d80'),
(220, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 15:27:18', '2026-04-27 15:29:02', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'a3158277abac6f6c2438625de5d484800948c59f4e610f81'),
(221, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 15:33:09', '2026-04-27 15:33:50', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '0c66cb680f46319f39f7313a91e3bbb675e88c97823348d8'),
(222, 3, 'harijiem@gmail.com', 'moderator', '2026-04-27 15:34:10', '2026-04-27 15:34:24', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '7d45866e74827b72ebc11b3ce8dfd6dd4fc30e03a403e0fe'),
(223, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 15:35:08', '2026-04-27 15:36:52', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '57be35df61032fac095a373e62b9d7cd90ef4f18750b8291'),
(224, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 15:37:06', '2026-04-27 15:38:05', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '8448e541c1aeb190ef238c6cb3f666f288ac6d4723d62783'),
(225, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-27 15:42:15', '2026-04-27 15:47:39', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2cf22746e19db4a184dc8ebda80d6a17e565184fe4ce7ce1'),
(226, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-30 13:16:53', '2026-04-30 13:17:49', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '34243135dbdf1f204df6aaa3dce651a9b521eb6b56eb0f3d'),
(227, 2, 'tongtongornamental@gmail.com', 'admin', '2026-04-30 13:18:30', '2026-04-30 13:18:51', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '5fa9240d42b2bf97b3caffb90f111545f15508a13cbc853a'),
(228, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 13:19:04', '2026-04-30 13:21:50', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'bbfcdfd0877dd426a72c4baaf396bce7bbfc82a07b52eb8c'),
(229, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 13:25:13', '2026-04-30 13:26:38', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '42e81bfbed984ee910ba40f732f3f14b39d8800b543e1512'),
(230, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 13:30:25', '2026-04-30 13:32:05', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'a09bb2cb0b412fc2db82adf2d6424b545784ac9afd827608'),
(231, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 13:35:21', '2026-04-30 13:36:23', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '71da42e170f109791f5e5f981d673ac868d6b2caec5a2f99'),
(232, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 13:38:42', '2026-04-30 13:40:58', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '4bd86794911ee48499eb89a0176eb2421b5c8507c91dc577'),
(233, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 13:45:20', '2026-04-30 13:49:04', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '92279b8e7aa01ef896f9224d7bc197e2ef1c4946852f19a6'),
(234, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 13:59:30', '2026-04-30 14:01:32', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '04b59151996e1d81c4f7f7458a734b3e02cfaae57cba72d4'),
(235, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 14:04:15', '2026-04-30 14:08:42', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '5de0bb7b0562cb4cf856c1c9506815df9b61984a845cba11'),
(236, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 14:11:39', '2026-04-30 14:13:47', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '8aba8ccfdd425944a95aca3f79d56b8a4d60ce0ffa22aada'),
(237, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 14:18:29', '2026-04-30 14:20:28', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '936fd28566d428922f4ab7fbcef2d7f1b4f107bd1d5c9818'),
(238, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 14:23:44', '2026-04-30 14:24:25', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '8d051b4732ae6ade1ec5b2cce1bd1a7b75d55a19c9d2ed8f'),
(239, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 14:27:10', '2026-04-30 14:28:43', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'c9b3a13ce7bac0b3b5ae901e803523495eb2ee75108806cf'),
(240, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 14:31:24', '2026-04-30 14:32:20', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '30d2bed3cf6f9b1d6ff44ac6e3331cad1b4421ae7729a2d1'),
(241, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 14:35:09', '2026-04-30 14:36:06', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'eeec8e00d9e0fd790cf4e5329bf390f1cd63bebe6aff821d'),
(242, 4, 'mharijie@gmail.com', 'customer', '2026-04-30 14:38:25', '2026-04-30 14:39:00', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '681c0d77df437d150bfdea0f80213d9cf5efa862bdce8d1b'),
(243, 4, 'mharijie@gmail.com', 'customer', '2026-05-01 09:21:05', '2026-05-01 09:21:14', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'ad695e5a9d145f0966a51a6e575b3202e84031348c0e2ce2'),
(244, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-01 09:21:27', '2026-05-01 09:22:53', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '5412f4674764c2609996a46a95b95572396ee50d40fb88bf'),
(245, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 09:23:04', '2026-05-01 09:23:12', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '85a2a5ee74d2dd97a1472543d5a7b97cff2db79ce4c3bf00'),
(246, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-01 09:23:27', '2026-05-01 09:25:03', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'e3fe14e1a89b348012df76fe5f5641bccce1bb14bdb1f7a5'),
(247, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 09:25:14', '2026-05-01 09:25:22', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '54e6c1cb1f3b9ff479c723e0e84ec160ec2631d644359e4e'),
(248, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 09:30:07', '2026-05-01 09:31:13', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'a8c85a172398e063cffb884daf2981789fc84469c3ca15a4'),
(249, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 09:40:15', '2026-05-01 09:43:18', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'df390a82170262d5a957ec85f53d1a1a9cf91a869f15c131'),
(250, 4, 'mharijie@gmail.com', 'customer', '2026-05-01 09:43:27', '2026-05-01 09:43:47', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'c16fe5e5518dc4017bc8dee28d5f062826285001e4a0bdae'),
(251, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 09:43:59', '2026-05-01 09:46:16', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '176b35a4fc30659d40c63496baa5ba150a2c349694493314'),
(252, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-01 09:46:40', '2026-05-01 09:47:16', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'd5a485dafc4db6610e1b9193b5b063e246ac80d3c3a2d141'),
(253, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 09:51:35', '2026-05-01 09:54:14', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'd8eebc4840c4609aa3895ed1333a557ef7d5c360d77a472b'),
(254, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 10:01:35', '2026-05-01 10:03:26', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '99857c62c8989f06eae0f1f9e0984756e397be0e5891755e'),
(255, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 10:06:07', '2026-05-01 10:08:10', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'c45fd645645cb6b86d19fc7f3826137d7c88c8339aab08fb'),
(256, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 10:13:43', '2026-05-01 10:13:59', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'e1db1ce8ccd5bad24d22a0200ea50422863b7cb5360154bf'),
(257, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 10:14:13', '2026-05-01 10:16:44', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '38b4aef8e98aaff7954088d123e580e734d3779798eefc1b'),
(258, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 10:19:14', '2026-05-01 10:21:10', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '6c522b25d40e5e7c97999cdaef730ae3140e5263110bf788'),
(259, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 10:27:15', '2026-05-01 10:43:28', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'a8f1d82d34c55f51308c4d8d6cd8c1b895e4f1f4d89be4d7'),
(260, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 10:50:31', '2026-05-01 10:53:51', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '050bd2fe90047c146a996c54022e3145f82b09cb5265c098'),
(261, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-01 10:54:05', '2026-05-01 10:54:37', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'd9ec8c0a686fcfa119c16deaf3fe549af1a186b2c6121363'),
(262, 3, 'harijiem@gmail.com', 'moderator', '2026-05-01 10:58:28', '2026-05-01 10:59:45', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'dc22fb123ca12e99e936b26dd3363a4706997a69afdd813d'),
(263, 4, 'mharijie@gmail.com', 'customer', '2026-05-01 10:59:56', '2026-05-01 11:02:06', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '902ad7cd8deca825427fb2ebfc9e84cc1240d387d151323c'),
(264, 4, 'mharijie@gmail.com', 'customer', '2026-05-01 11:04:46', '2026-05-01 11:10:10', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '1d12ded2fca96dfcadfcabf01c1c159595119e8f086dbdc4'),
(265, 4, 'mharijie@gmail.com', 'customer', '2026-05-01 11:14:53', '2026-05-01 11:18:26', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'b1e66382373a6cda534e668065186ff6db444b3b8c715c11'),
(266, 4, 'mharijie@gmail.com', 'customer', '2026-05-01 11:21:12', '2026-05-01 11:23:49', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'bd9e455b8517748e06b9eb3416d63d7e4acf562b466462e3'),
(267, 4, 'mharijie@gmail.com', 'customer', '2026-05-01 11:28:13', '2026-05-01 11:30:27', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '3688c3ca99ad68b7facf26163995fb7095b6f6b6fd8bb387'),
(268, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-01 11:30:41', '2026-05-01 11:32:47', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'c69d67f0601bd2ce6e67c89802048e72b504c689f64d1ae7'),
(269, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-01 11:46:09', '2026-05-01 11:49:01', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '31495de3655795d8f927884088fd9893ec006774e6d15577'),
(270, 3, 'harijiem@gmail.com', 'moderator', '2026-05-08 08:30:27', '2026-05-08 08:30:51', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'ffa608eec664da8e456b245bbf67ae1c4ed32c0853ebf49b'),
(271, 4, 'mharijie@gmail.com', 'customer', '2026-05-08 08:31:04', '2026-05-08 08:35:48', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '88a6b7276f17f5383dcac8a38cdf28b575657b09cc926167'),
(272, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-08 08:36:02', '2026-05-08 08:36:19', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '882fa20420b1468d56c7c40962fd46b59fbe8add0e66e394'),
(273, 3, 'harijiem@gmail.com', 'moderator', '2026-05-08 08:36:35', '2026-05-08 08:36:43', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'a0f7c3025eba6fc8a16febbf3e17072cf292d9d7ff3ac3a4'),
(274, 4, 'mharijie@gmail.com', 'customer', '2026-05-08 08:36:53', '2026-05-08 08:37:05', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'e186645f6c12bbda7cfe15345be212b166cb10e170c79bc2'),
(275, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-08 08:51:06', '2026-05-08 08:53:44', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'df3e0727b4ea68f62fa9764e703b407694e3dd526aea8f53'),
(276, 3, 'harijiem@gmail.com', 'moderator', '2026-05-08 08:53:55', '2026-05-08 08:54:04', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '45a007e3bab3e5aec30b977fdbdde757dca883ea5c78d5ab'),
(277, 4, 'mharijie@gmail.com', 'customer', '2026-05-08 08:54:21', '2026-05-08 08:54:58', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '939cba4a6ca9f9225cfa5533339dcd7f1739bcf4f56817bf'),
(278, 4, 'mharijie@gmail.com', 'customer', '2026-05-08 08:55:25', NULL, 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '8c629a38bb8fa05c942c8c4344f4d28ceb02745115cb6de3'),
(279, 4, 'mharijie@gmail.com', 'customer', '2026-05-08 09:11:10', '2026-05-08 09:12:19', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'e411bb217b3385e26258cb3e0f75023ec3a4fccd23677dde'),
(280, 4, 'mharijie@gmail.com', 'customer', '2026-05-08 09:12:29', '2026-05-08 09:14:23', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'f514e20e2a91f8a5f55dda147ec76c92083d4ad0dcabdf17'),
(281, 4, 'mharijie@gmail.com', 'customer', '2026-05-08 09:17:06', '2026-05-08 09:22:11', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '4e58cb6e25fd0d20092e66c004d2b47a348913ae0642e2e3'),
(282, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 16:54:51', '2026-05-09 16:55:01', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'ceb711836731b599c3588090d5bb0b6dd4d58993df84f4be'),
(283, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-09 16:56:24', '2026-05-09 16:57:27', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '743e25a44de54f4f610baabb9861e39285b08836ae01700b'),
(284, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 16:57:43', '2026-05-09 17:00:40', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '90ae2c88b656c0ad2515dc4f1e42173d601728d7feae51e4'),
(285, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 17:07:50', '2026-05-09 17:08:30', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '36bd6a5de1f365f7531f7b35c6609bd4ddc207691e19a540'),
(286, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-09 17:09:01', '2026-05-09 17:09:19', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '67bbf80322e3fc3453ca3252fd86bc914e7db9ff24783be3'),
(287, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 17:09:28', '2026-05-09 17:14:17', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'f0fb1daa91bc7ae036ca6221736fc0e6af4015b3cc04f5bf'),
(288, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 17:17:39', '2026-05-09 17:17:52', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'd51f94267673d2df003e1284b49a0a0e06cfea55eccc747e'),
(289, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-09 17:32:15', '2026-05-09 17:36:17', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'f1651f701e8246f07d276895eb02a83500c48b51ebc6d417'),
(290, 3, 'harijiem@gmail.com', 'moderator', '2026-05-09 17:36:32', '2026-05-09 17:40:39', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'b4c6343133578300f77d48e4b99ed5d0418811f95799f485'),
(291, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 17:40:43', '2026-05-09 17:47:53', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'cb1aa581d4906c2fe353b72f8ea8635cc2a6e63bfac833cf'),
(292, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-09 17:45:59', '2026-05-09 17:46:49', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2862cf4a3eccdf7102b9e5bcbfb1c5808f505e3398625d0c'),
(293, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-09 17:50:03', '2026-05-09 17:50:42', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '88e68abe60e5a7a9c53f51d6f78127152b3254a288be5aa4'),
(294, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 17:50:54', '2026-05-09 17:51:22', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '807b39e3f489b1fcd9b2384fb6f5550ab43840868818507c'),
(295, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-09 17:51:34', '2026-05-09 17:51:48', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'f8b35cea43f74cbfaf7292889b9dc7e359e13b40080eaa22'),
(296, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 17:52:00', '2026-05-09 17:52:10', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'f0fe0cfb853a49c8fc410601d4553e03d94d21f7e07e8d5e'),
(297, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-09 17:52:23', '2026-05-09 17:52:35', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '148960876ba10d24f9fc19548e0784fe1f4dbf62091b413e'),
(298, 4, 'mharijie@gmail.com', 'customer', '2026-05-09 17:52:47', '2026-05-09 18:00:04', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '799c145f2b195f753ac33b73eae712a11bb7fdd4f3a7a0fe'),
(299, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-15 22:06:50', '2026-05-15 22:06:57', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '7668a674201b134a51e8fcedf7565ce3c8ea43a146aa353f'),
(300, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-15 22:19:37', '2026-05-15 22:20:20', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '3953e93a16ed64c2f96b7185e266bf36599a103d680b56c7'),
(301, 4, 'mharijie@gmail.com', 'customer', '2026-05-15 22:20:34', '2026-05-15 22:21:04', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '72d4c8cf9e1acb138d9b6123ca790f50280bdc8504086900'),
(302, 4, 'mharijie@gmail.com', 'customer', '2026-05-15 22:25:27', '2026-05-15 22:26:49', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '5b1014e65faadf7846c7084eee6d5f2465b12c137f4e9da9'),
(303, 2, 'tongtongornamental@gmail.com', 'admin', '2026-05-15 23:26:26', '2026-05-15 23:30:13', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '0d83eacab37e1526d7b9bb27040d227c042faec82711ad76'),
(304, 4, 'mharijie@gmail.com', 'customer', '2026-05-15 23:32:05', '2026-05-15 23:36:39', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', 'be9e3284c90391e8a0c1ed9fbbf75f99d5dd7ec6386fb9eb'),
(305, 3, 'harijiem@gmail.com', 'moderator', '2026-05-15 23:32:25', '2026-05-15 23:34:39', 1, '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', 'f94bf0d58108a230fb94ca5a6d9392155175254d820c4db0');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `background_settings`
--
ALTER TABLE `background_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_name` (`setting_name`),
  ADD UNIQUE KEY `setting_name_2` (`setting_name`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`cart_id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `cash_register_entries`
--
ALTER TABLE `cash_register_entries`
  ADD PRIMARY KEY (`entry_id`),
  ADD KEY `idx_cash_register_entries_user_id` (`user_id`);

--
-- Indexes for table `cash_register_reconciliations`
--
ALTER TABLE `cash_register_reconciliations`
  ADD PRIMARY KEY (`reconcile_id`),
  ADD KEY `idx_cash_register_reconciliations_user_id` (`user_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`invoice_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `invoice_requests`
--
ALTER TABLE `invoice_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `invoice_id` (`invoice_id`),
  ADD KEY `requested_by` (`requested_by`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_cancellation_requests`
--
ALTER TABLE `order_cancellation_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `unique_product_name` (`name`);

--
-- Indexes for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_rating` (`rating`),
  ADD KEY `idx_verified_purchase` (`is_verified_purchase`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `transaction_logs`
--
ALTER TABLE `transaction_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_transaction_logs_order_id` (`order_id`),
  ADD KEY `idx_transaction_logs_created_at` (`created_at`),
  ADD KEY `idx_transaction_logs_processed_by_user_id` (`processed_by_user_id`);

--
-- Indexes for table `user_accounts`
--
ALTER TABLE `user_accounts`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `user_session_logs`
--
ALTER TABLE `user_session_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_user_session_logs_user` (`user_id`),
  ADD KEY `idx_user_session_logs_login_at` (`login_at`),
  ADD KEY `idx_user_session_logs_session_token` (`session_token`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `cash_register_entries`
--
ALTER TABLE `cash_register_entries`
  MODIFY `entry_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `cash_register_reconciliations`
--
ALTER TABLE `cash_register_reconciliations`
  MODIFY `reconcile_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `invoice_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `invoice_requests`
--
ALTER TABLE `invoice_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `order_cancellation_requests`
--
ALTER TABLE `order_cancellation_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `transaction_logs`
--
ALTER TABLE `transaction_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_accounts`
--
ALTER TABLE `user_accounts`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_session_logs`
--
ALTER TABLE `user_session_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=306;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cash_register_entries`
--
ALTER TABLE `cash_register_entries`
  ADD CONSTRAINT `cash_register_entries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `cash_register_reconciliations`
--
ALTER TABLE `cash_register_reconciliations`
  ADD CONSTRAINT `cash_register_reconciliations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_session_logs`
--
ALTER TABLE `user_session_logs`
  ADD CONSTRAINT `fk_user_session_logs_user` FOREIGN KEY (`user_id`) REFERENCES `user_accounts` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
