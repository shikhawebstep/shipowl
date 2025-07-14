INSERT INTO `appConfig` (`id`, `shippingCost`, `status`) VALUES (NULL, '75', '1');

INSERT INTO `admin` (`id`, `name`, `uniqeId`, `username`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`, `pr_token`, `pr_expires_at`, `pr_last_reset`) VALUES
(1, 'Rohit Admin', 'ADMIN-12', 'rohit-admin', 'rohitwebstep-admin@gmail.com', '$2b$10$hW8vbhToemWerVuNQ5W4l.7RVppP2Y3a8hooIZTPidgugCkWMcOyC', 'admin', 'active', '2025-04-07 05:19:36.000', '2025-04-14 06:32:13.419', NULL, NULL, '2025-04-14 06:32:13.417'),
(2, 'Rohit Dropshipper', 'ADMIN-132', 'rohit-dropshipper', 'rohitwebstep-drop@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'dropshipper', 'active', '2025-04-07 05:19:36.000', '2025-04-07 05:19:39.000', NULL, NULL, NULL),
(3, 'Rohit Supplier', 'ADMIN-142', 'rohit-supplier', 'rohitwebstep-sup@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'supplier', 'active', '2025-04-07 05:19:36.000', '2025-04-07 05:19:39.000', NULL, NULL, NULL),
(4, 'Shikha Admin', 'ADMIN-162', 'shikha-admin', 'shikhawebstep@gmail.com', '$2b$10$hW8vbhToemWerVuNQ5W4l.7RVppP2Y3a8hooIZTPidgugCkWMcOyC', 'admin', 'active', '2025-04-07 05:19:36.000', '2025-04-14 06:32:13.419', NULL, NULL, '2025-04-14 06:32:13.417');

INSERT INTO `adminStaff` (`id`, `admin_id`, `name`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`, `pr_token`, `pr_expires_at`, `pr_last_reset`) VALUES
(1, 1, 'Rohit Admin Staff', 'rohitwebstep-admin-staff@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'admin', 'active', '2025-04-07 06:32:17.000', '2025-04-07 06:32:20.000', NULL, NULL, NULL),
(2, 2, 'Rohit Dropshipper Staff', 'rohitwebstep-drop-staff@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'dropshipper', 'active', '2025-04-07 06:32:17.000', '2025-04-07 06:32:20.000', NULL, NULL, NULL),
(3, 3, 'Rohit Supplier Staff', 'rohitwebstep-sup-staff@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'supplier', 'active', '2025-04-07 06:32:17.000', '2025-04-07 06:32:20.000', NULL, NULL, NULL);

INSERT INTO `shopifyStore` (`adminId`, `name`, `shop`, `accessToken`, `email`, `shopName`, `planName`, `country`, `shopOwner`, `domain`, `myshopifyDomain`, `province`, `city`, `phone`, `currency`, `moneyFormat`, `timezone`, `createdAtShop`, `userId`, `verificationStatus`, `status`, `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`) VALUES
(2, 'webproductstore', 'webproductstore.myshopify.com', 'shpua_bef703b1286280a7fe39af702a42b09f', 'yashikawebstep@gmail.com', NULL, 'partner_test', 'India', 'Yashika Admin', 'webproductstore.myshopify.com', 'webproductstore.myshopify.com', NULL, NULL, NULL, 'INR', 'Rs. {{amount}}', 'America/New_York', '2025-05-16 12:26:51.000', NULL, 0, 0, '2025-05-30 11:44:13.371', 2, 'dropshipper', '2025-05-30 11:46:06.198', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `globalPermission` (`panel`, `module`, `action`, `status`, `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`) VALUES
('supplier', 'Product', 'Add to List', 1, '2025-05-09 15:38:39.000', NULL, NULL, '2025-05-09 15:39:07.000', NULL, NULL, NULL, NULL, NULL),
('supplier', 'Product', 'Update', 1, '2025-05-09 15:38:39.000', NULL, NULL, '2025-05-09 15:39:07.000', NULL, NULL, NULL, NULL, NULL),
('supplier', 'Product', 'Delete', 1, '2025-05-09 15:38:39.000', NULL, NULL, '2025-05-09 15:39:07.000', NULL, NULL, NULL, NULL, NULL),
('dropshipper', 'Product', 'Push to Shopify', 1, '2025-05-09 15:38:39.000', NULL, NULL, '2025-05-09 15:39:07.000', NULL, NULL, NULL, NULL, NULL),
('dropshipper', 'Product', 'Update', 1, '2025-05-09 15:38:39.000', NULL, NULL, '2025-05-09 15:39:07.000', NULL, NULL, NULL, NULL, NULL),
('dropshipper', 'Product', 'Delete', 1, '2025-05-09 15:38:39.000', NULL, NULL, '2025-05-09 15:39:07.000', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `adminStaffPermission` (`panel`, `module`, `action`, `status`, `CreatedAt`, `CreatedBy`, `CreatedByRole`, `UpdatedAt`, `UpdatedBy`, `UpdatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`) VALUES
('Admin', 'Dropshipper', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'Orders', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'Bank Account Change Request View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'Bank Account Change Request Review', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Dropshipper', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Supplier', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'Orders', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'Bank Account Change Request View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'Bank Account Change Request Review', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'Password Change', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Product', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Product', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Product', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Product', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Product', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Product', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Product', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Product', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Product', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Order Variables', 'orderNumber', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'awbNumber', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'status', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'orderNote', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'subtotal', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'tax', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'discount', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'totalAmount', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'currency', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'shippingName', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'shippingPhone', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'shippingEmail', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'shippingAddress', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'shippingZip', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'shippingCountry', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'shippingState', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'shippingCity', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'billingName', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'billingPhone', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'billingEmail', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'billingAddress', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'billingZip', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'billingCountry', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'billingState', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Order Variables', 'billingCity', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Category', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Category', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Category', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Category', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Category', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Category', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Category', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Category', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Category', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Brand', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Brand', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Brand', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Brand', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Brand', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Brand', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Brand', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Brand', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Brand', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Mail', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Mail', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Mail', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Country', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Country', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Country', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Country', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Country', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Country', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Country', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'State', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'State', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'State', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'State', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'State', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'State', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'State', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'City', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'City', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'City', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'City', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'City', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'City', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'City', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Warehouse', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Warehouse', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Warehouse', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Warehouse', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Warehouse', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Warehouse', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Warehouse', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Warehouse', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Warehouse', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Good Pincode', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Good Pincode', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Good Pincode', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Good Pincode', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Good Pincode', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Good Pincode', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Good Pincode', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Good Pincode', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Good Pincode', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Bad Pincode', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Bad Pincode', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Bad Pincode', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Bad Pincode', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Bad Pincode', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Bad Pincode', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Bad Pincode', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Bad Pincode', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Bad Pincode', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'High RTO', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'High RTO', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'High RTO', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'High RTO', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'High RTO', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'High RTO', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'High RTO', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'High RTO', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'High RTO', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Sub User', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Sub User', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Sub User', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Sub User', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Sub User', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Sub User', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Sub User', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Sub User', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Sub User', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Admin', 'Global Permission', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Global Permission', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier Order Permission', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Admin', 'Supplier Order Permission', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Supplier', 'Sub User', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Sub User', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Sub User', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Sub User', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Sub User', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Sub User', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Sub User', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Sub User', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Supplier', 'Warehouse', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Warehouse', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Warehouse', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Warehouse', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Warehouse', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Warehouse', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Warehouse', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Warehouse', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Warehouse', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Supplier', 'My Profile', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'My Profile', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'My Profile', 'Bank Account Change Request', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Supplier', 'Product', 'Add to List', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Product', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Product', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Product', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Product', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Product', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Product', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Product', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Product', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Supplier', 'Order', 'report', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order', 'Warehouse Collected', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order', 'Need to Raise', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order', 'RTO', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Supplier', 'Order Variables', 'orderNumber', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'awbNumber', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'status', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'orderNote', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'subtotal', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'tax', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'discount', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'totalAmount', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'currency', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'shippingName', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'shippingPhone', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'shippingEmail', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'shippingAddress', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'shippingZip', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'shippingCountry', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'shippingState', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'shippingCity', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'billingName', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'billingPhone', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'billingEmail', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'billingAddress', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'billingZip', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'billingCountry', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'billingState', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Supplier', 'Order Variables', 'billingCity', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Dropshipper', 'Report', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Shopify', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Shopify', 'Add', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Shopify', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Shopify', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Dropshipper', 'Payment', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Payment', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Payment', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Payment', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Payment', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Payment', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Payment', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Payment', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Payment', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Dropshipper', 'Sub User', 'Create', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Sub User', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Sub User', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Sub User', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Sub User', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Sub User', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Sub User', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Sub User', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Sub User', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Dropshipper', 'My Profile', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'My Profile', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'My Profile', 'Bank Account Change Request', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),

('Dropshipper', 'Product', 'Push to Shopify', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Product', 'View', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Product', 'View Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Product', 'Update', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Product', 'Soft Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Product', 'Trash Listing', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Product', 'Restore', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Product', 'Permanent Delete', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL),
('Dropshipper', 'Product', 'Export', 1, '2025-06-09 17:44:14.000', NULL, NULL, '2025-06-09 17:44:14.000', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `brand` (`id`, `name`, `slug`, `description`, `image`, `status`, `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`) VALUES
(1, 'Apple', 'apple', 'Leading consumer electronics brand', '', 1, '2025-05-28 04:55:12', 1, 'admin', '2025-05-28 04:55:12', NULL, NULL, NULL, NULL, NULL),
(2, 'Samsung', 'samsung', 'Global electronics and appliances brand', '', 1, '2025-05-28 05:00:00', 1, 'admin', '2025-05-28 05:00:00', NULL, NULL, NULL, NULL, NULL),
(3, 'Sony', 'sony', 'Electronics and entertainment giant', '', 1, '2025-05-28 05:05:00', 1, 'admin', '2025-05-28 05:05:00', NULL, NULL, NULL, NULL, NULL),
(4, 'LG', 'lg', 'Home appliances and TV manufacturer', '', 1, '2025-05-28 05:10:00', 1, 'admin', '2025-05-28 05:10:00', NULL, NULL, NULL, NULL, NULL),
(5, 'Dell', 'dell', 'Computer systems and laptops brand', '', 1, '2025-05-28 05:15:00', 1, 'admin', '2025-05-28 05:15:00', NULL, NULL, NULL, NULL, NULL),
(6, 'HP', 'hp', 'Laptops, desktops, and printers', '', 1, '2025-05-28 05:20:00', 1, 'admin', '2025-05-28 05:20:00', NULL, NULL, NULL, NULL, NULL),
(7, 'Lenovo', 'lenovo', 'PCs, laptops, and smart devices', '', 1, '2025-05-28 05:25:00', 1, 'admin', '2025-05-28 05:25:00', NULL, NULL, NULL, NULL, NULL),
(8, 'Asus', 'asus', 'Laptops and gaming equipment', '', 1, '2025-05-28 05:30:00', 1, 'admin', '2025-05-28 05:30:00', NULL, NULL, NULL, NULL, NULL),
(9, 'Acer', 'acer', 'Monitors and personal computers', '', 1, '2025-05-28 05:35:00', 1, 'admin', '2025-05-28 05:35:00', NULL, NULL, NULL, NULL, NULL),
(10, 'Microsoft', 'microsoft', 'Tech and software company', '', 1, '2025-05-28 05:40:00', 1, 'admin', '2025-05-28 05:40:00', NULL, NULL, NULL, NULL, NULL),
(11, 'Google', 'google', 'AI, web services, and devices', '', 1, '2025-05-28 05:45:00', 1, 'admin', '2025-05-28 05:45:00', NULL, NULL, NULL, NULL, NULL),
(12, 'OnePlus', 'oneplus', 'Smartphones and gadgets', '', 1, '2025-05-28 05:50:00', 1, 'admin', '2025-05-28 05:50:00', NULL, NULL, NULL, NULL, NULL),
(13, 'Xiaomi', 'xiaomi', 'Smartphones and IoT devices', '', 1, '2025-05-28 05:55:00', 1, 'admin', '2025-05-28 05:55:00', NULL, NULL, NULL, NULL, NULL),
(14, 'Oppo', 'oppo', 'Mobile phones and accessories', '', 1, '2025-05-28 06:00:00', 1, 'admin', '2025-05-28 06:00:00', NULL, NULL, NULL, NULL, NULL),
(15, 'Vivo', 'vivo', 'Smartphones and wearables', '', 1, '2025-05-28 06:05:00', 1, 'admin', '2025-05-28 06:05:00', NULL, NULL, NULL, NULL, NULL),
(16, 'Realme', 'realme', 'Smartphones and smart gadgets', '', 1, '2025-05-28 06:10:00', 1, 'admin', '2025-05-28 06:10:00', NULL, NULL, NULL, NULL, NULL),
(17, 'Motorola', 'motorola', 'Mobile phones and communication tech', '', 1, '2025-05-28 06:15:00', 1, 'admin', '2025-05-28 06:15:00', NULL, NULL, NULL, NULL, NULL),
(18, 'Nokia', 'nokia', 'Trusted mobile technology brand', '', 1, '2025-05-28 06:20:00', 1, 'admin', '2025-05-28 06:20:00', NULL, NULL, NULL, NULL, NULL),
(19, 'Huawei', 'huawei', 'Telecom and mobile tech leader', '', 1, '2025-05-28 06:25:00', 1, 'admin', '2025-05-28 06:25:00', NULL, NULL, NULL, NULL, NULL),
(20, 'Honor', 'honor', 'Smartphone sub-brand of Huawei', '', 1, '2025-05-28 06:30:00', 1, 'admin', '2025-05-28 06:30:00', NULL, NULL, NULL, NULL, NULL),
(21, 'Panasonic', 'panasonic', 'Electronics and appliances brand', '', 1, '2025-05-28 06:35:00', 1, 'admin', '2025-05-28 06:35:00', NULL, NULL, NULL, NULL, NULL),
(22, 'Toshiba', 'toshiba', 'Electronics, laptops, and storage devices', '', 1, '2025-05-28 06:40:00', 1, 'admin', '2025-05-28 06:40:00', NULL, NULL, NULL, NULL, NULL),
(23, 'Philips', 'philips', 'Consumer electronics and lighting', '', 1, '2025-05-28 06:45:00', 1, 'admin', '2025-05-28 06:45:00', NULL, NULL, NULL, NULL, NULL),
(24, 'Sharp', 'sharp', 'TVs and appliances', '', 1, '2025-05-28 06:50:00', 1, 'admin', '2025-05-28 06:50:00', NULL, NULL, NULL, NULL, NULL),
(25, 'TCL', 'tcl', 'Smart TVs and electronics', '', 1, '2025-05-28 06:55:00', 1, 'admin', '2025-05-28 06:55:00', NULL, NULL, NULL, NULL, NULL),
(26, 'ZTE', 'zte', 'Mobile and telecom company', '', 1, '2025-05-28 07:00:00', 1, 'admin', '2025-05-28 07:00:00', NULL, NULL, NULL, NULL, NULL),
(27, 'Infinix', 'infinix', 'Smartphones for budget markets', '', 1, '2025-05-28 07:05:00', 1, 'admin', '2025-05-28 07:05:00', NULL, NULL, NULL, NULL, NULL),
(28, 'Tecno', 'tecno', 'Affordable mobile devices', '', 1, '2025-05-28 07:10:00', 1, 'admin', '2025-05-28 07:10:00', NULL, NULL, NULL, NULL, NULL),
(29, 'iQOO', 'iqoo', 'Performance-focused smartphones', '', 1, '2025-05-28 07:15:00', 1, 'admin', '2025-05-28 07:15:00', NULL, NULL, NULL, NULL, NULL),
(30, 'Micromax', 'micromax', 'Indian electronics brand', '', 1, '2025-05-28 07:20:00', 1, 'admin', '2025-05-28 07:20:00', NULL, NULL, NULL, NULL, NULL),
(31, 'Lava', 'lava', 'Affordable mobile technology', '', 1, '2025-05-28 07:25:00', 1, 'admin', '2025-05-28 07:25:00', NULL, NULL, NULL, NULL, NULL),
(32, 'Alcatel', 'alcatel', 'Smartphones and tablets', '', 1, '2025-05-28 07:30:00', 1, 'admin', '2025-05-28 07:30:00', NULL, NULL, NULL, NULL, NULL),
(33, 'BlackBerry', 'blackberry', 'Mobile and secure communications', '', 1, '2025-05-28 07:35:00', 1, 'admin', '2025-05-28 07:35:00', NULL, NULL, NULL, NULL, NULL),
(34, 'HTC', 'htc', 'Mobile innovation company', '', 1, '2025-05-28 07:40:00', 1, 'admin', '2025-05-28 07:40:00', NULL, NULL, NULL, NULL, NULL),
(35, 'Fairphone', 'fairphone', 'Ethically produced smartphones', '', 1, '2025-05-28 07:45:00', 1, 'admin', '2025-05-28 07:45:00', NULL, NULL, NULL, NULL, NULL),
(36, 'Meizu', 'meizu', 'Smartphones and audio', '', 1, '2025-05-28 07:50:00', 1, 'admin', '2025-05-28 07:50:00', NULL, NULL, NULL, NULL, NULL),
(37, 'Coolpad', 'coolpad', 'Affordable Android smartphones', '', 1, '2025-05-28 07:55:00', 1, 'admin', '2025-05-28 07:55:00', NULL, NULL, NULL, NULL, NULL),
(38, 'Gionee', 'gionee', 'Smartphone manufacturer', '', 1, '2025-05-28 08:00:00', 1, 'admin', '2025-05-28 08:00:00', NULL, NULL, NULL, NULL, NULL),
(39, 'Nothing', 'nothing', 'Innovative tech startup by Carl Pei', '', 1, '2025-05-28 08:05:00', 1, 'admin', '2025-05-28 08:05:00', NULL, NULL, NULL, NULL, NULL),
(40, 'ROG (Republic of Gamers)', 'rog', 'Gaming brand by Asus', '', 1, '2025-05-28 08:10:00', 1, 'admin', '2025-05-28 08:10:00', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `category` (`id`, `name`, `slug`, `description`, `image`, `status`, `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`) VALUES
(1, 'Electronics', 'electronics', 'Electronic gadgets and accessories', 'electronics.jpg', 1, '2024-06-01 10:15:00', 101, 'admin', '2024-06-15 14:30:00', 101, 'admin', NULL, NULL, NULL),
(2, 'Home Appliances', 'home-appliances', 'Appliances for home use', 'home_appliances.jpg', 1, '2024-06-02 09:40:00', 102, 'admin', '2024-06-16 15:00:00', 102, 'admin', NULL, NULL, NULL),
(3, 'Furniture', 'furniture', 'Indoor and outdoor furniture', 'furniture.jpg', 1, '2024-06-03 11:00:00', 103, 'editor', '2024-06-17 10:25:00', 103, 'editor', NULL, NULL, NULL),
(4, 'Books', 'books', 'Books of all genres and authors', 'books.jpg', 1, '2024-06-04 13:20:00', 104, 'admin', '2024-06-18 13:10:00', 104, 'admin', NULL, NULL, NULL),
(5, 'Fashion', 'fashion', 'Clothing and accessories', 'fashion.jpg', 1, '2024-06-05 08:55:00', 105, 'admin', '2024-06-19 09:05:00', 105, 'admin', NULL, NULL, NULL),
(6, 'Toys', 'toys', 'Toys for kids of all ages', 'toys.jpg', 1, '2024-06-06 14:10:00', 106, 'editor', '2024-06-20 11:30:00', 106, 'editor', NULL, NULL, NULL),
(7, 'Beauty', 'beauty', 'Beauty and personal care products', 'beauty.jpg', 1, '2024-06-07 15:20:00', 107, 'admin', '2024-06-21 12:10:00', 107, 'admin', NULL, NULL, NULL),
(8, 'Sports', 'sports', 'Sports gear and fitness accessories', 'sports.jpg', 1, '2024-06-08 10:00:00', 108, 'editor', '2024-06-22 14:40:00', 108, 'editor', NULL, NULL, NULL),
(9, 'Garden', 'garden', 'Gardening tools and decor', 'garden.jpg', 1, '2024-06-09 09:10:00', 109, 'admin', '2024-06-23 09:50:00', 109, 'admin', NULL, NULL, NULL),
(10, 'Automotive', 'automotive', 'Car and bike accessories', 'automotive.jpg', 1, '2024-06-10 10:30:00', 110, 'editor', '2024-06-24 10:20:00', 110, 'editor', NULL, NULL, NULL),
(11, 'Health', 'health', 'Health products and supplements', 'health.jpg', 1, '2024-06-11 13:50:00', 111, 'admin', '2024-06-25 15:15:00', 111, 'admin', NULL, NULL, NULL),
(12, 'Pet Supplies', 'pet-supplies', 'Products for pet care', 'pet.jpg', 1, '2024-06-12 12:45:00', 112, 'admin', '2024-06-26 14:55:00', 112, 'admin', NULL, NULL, NULL),
(13, 'Grocery', 'grocery', 'Daily grocery items', 'grocery.jpg', 1, '2024-06-13 09:30:00', 113, 'editor', '2024-06-27 11:35:00', 113, 'editor', NULL, NULL, NULL),
(14, 'Stationery', 'stationery', 'Office and school supplies', 'stationery.jpg', 1, '2024-06-14 14:25:00', 114, 'admin', '2024-06-28 13:20:00', 114, 'admin', NULL, NULL, NULL),
(15, 'Travel', 'travel', 'Travel accessories and luggage', 'travel.jpg', 1, '2024-06-15 16:00:00', 115, 'editor', '2024-06-29 10:10:00', 115, 'editor', NULL, NULL, NULL),
(16, 'Music', 'music', 'Musical instruments and accessories', 'music.jpg', 1, '2024-06-16 10:45:00', 116, 'admin', '2024-06-30 12:40:00', 116, 'admin', NULL, NULL, NULL),
(17, 'Gaming', 'gaming', 'Gaming consoles and accessories', 'gaming.jpg', 1, '2024-06-17 09:55:00', 117, 'admin', '2024-07-01 11:50:00', 117, 'admin', NULL, NULL, NULL),
(18, 'Cameras', 'cameras', 'Photography gear and accessories', 'cameras.jpg', 1, '2024-06-18 14:00:00', 118, 'editor', '2024-07-02 14:30:00', 118, 'editor', NULL, NULL, NULL),
(19, 'Footwear', 'footwear', 'Shoes and sandals', 'footwear.jpg', 1, '2024-06-19 08:20:00', 119, 'admin', '2024-07-03 13:40:00', 119, 'admin', NULL, NULL, NULL),
(20, 'Jewelry', 'jewelry', 'Jewelry and fashion accessories', 'jewelry.jpg', 1, '2024-06-20 13:10:00', 120, 'editor', '2024-07-04 12:10:00', 120, 'editor', NULL, NULL, NULL),
(21, 'Mobile Phones', 'mobile-phones', 'Smartphones and mobile accessories', 'mobiles.jpg', 1, '2024-06-21 11:45:00', 101, 'admin', '2024-07-05 10:25:00', 101, 'admin', NULL, NULL, NULL),
(22, 'Smart Home', 'smart-home', 'Smart devices for home automation', 'smart_home.jpg', 1, '2024-06-22 12:30:00', 102, 'admin', '2024-07-06 09:35:00', 102, 'admin', NULL, NULL, NULL),
(23, 'Kitchen', 'kitchen', 'Kitchen appliances and accessories', 'kitchen.jpg', 1, '2024-06-23 15:20:00', 103, 'editor', '2024-07-07 12:15:00', 103, 'editor', NULL, NULL, NULL),
(24, 'Office Supplies', 'office-supplies', 'All types of office equipment', 'office.jpg', 1, '2024-06-24 14:10:00', 104, 'admin', '2024-07-08 13:50:00', 104, 'admin', NULL, NULL, NULL),
(25, 'Crafts', 'crafts', 'DIY and craft materials', 'crafts.jpg', 1, '2024-06-25 09:15:00', 105, 'admin', '2024-07-09 11:25:00', 105, 'admin', NULL, NULL, NULL),
(26, 'Lighting', 'lighting', 'Lamps and lighting fixtures', 'lighting.jpg', 1, '2024-06-26 16:45:00', 106, 'editor', '2024-07-10 10:15:00', 106, 'editor', NULL, NULL, NULL),
(27, 'Watches', 'watches', 'Wristwatches and smartwatches', 'watches.jpg', 1, '2024-06-27 10:30:00', 107, 'admin', '2024-07-11 14:00:00', 107, 'admin', NULL, NULL, NULL),
(28, 'Accessories', 'accessories', 'General fashion accessories', 'accessories.jpg', 1, '2024-06-28 09:50:00', 108, 'admin', '2024-07-12 12:50:00', 108, 'admin', NULL, NULL, NULL),
(29, 'Bags', 'bags', 'Travel and fashion bags', 'bags.jpg', 1, '2024-06-29 11:00:00', 109, 'editor', '2024-07-13 11:40:00', 109, 'editor', NULL, NULL, NULL),
(30, 'Wines & Beverages', 'wines-beverages', 'Wines, spirits, and soft drinks', 'beverages.jpg', 1, '2024-06-30 15:00:00', 110, 'admin', '2024-07-14 13:30:00', 110, 'admin', NULL, NULL, NULL),
(31, 'Tools & Hardware', 'tools-hardware', 'Construction and repair tools', 'tools.jpg', 1, '2024-07-01 10:10:00', 111, 'editor', '2024-07-15 09:45:00', 111, 'editor', NULL, NULL, NULL),
(32, 'Gadgets', 'gadgets', 'Trendy electronic gadgets', 'gadgets.jpg', 1, '2024-07-02 09:40:00', 112, 'admin', '2024-07-16 10:55:00', 112, 'admin', NULL, NULL, NULL),
(33, 'Art', 'art', 'Paintings, sculptures, and more', 'art.jpg', 1, '2024-07-03 14:20:00', 113, 'editor', '2024-07-17 11:15:00', 113, 'editor', NULL, NULL, NULL),
(34, 'Baby Products', 'baby-products', 'Everything for babies and toddlers', 'baby.jpg', 1, '2024-07-04 08:35:00', 114, 'admin', '2024-07-18 12:30:00', 114, 'admin', NULL, NULL, NULL),
(35, 'Baking', 'baking', 'Baking tools and ingredients', 'baking.jpg', 1, '2024-07-05 13:15:00', 115, 'editor', '2024-07-19 13:05:00', 115, 'editor', NULL, NULL, NULL),
(36, 'Cleaning Supplies', 'cleaning-supplies', 'Products for home and industrial cleaning', 'cleaning.jpg', 1, '2024-07-06 10:05:00', 116, 'admin', '2024-07-20 14:25:00', 116, 'admin', NULL, NULL, NULL),
(37, 'Decor', 'decor', 'Home and office decor', 'decor.jpg', 1, '2024-07-07 11:45:00', 117, 'admin', '2024-07-21 10:30:00', 117, 'admin', NULL, NULL, NULL),
(38, 'Safety', 'safety', 'Safety gear and equipment', 'safety.jpg', 1, '2024-07-08 09:20:00', 118, 'editor', '2024-07-22 09:00:00', 118, 'editor', NULL, NULL, NULL),
(39, 'Wearables', 'wearables', 'Smart wearables and trackers', 'wearables.jpg', 1, '2024-07-09 10:10:00', 119, 'admin', '2024-07-23 13:45:00', 119, 'admin', NULL, NULL, NULL),
(40, 'Gift Items', 'gift-items', 'Unique and special gift ideas', 'gifts.jpg', 1, '2024-07-10 12:00:00', 120, 'editor', '2024-07-24 11:50:00', 120, 'editor', NULL, NULL, NULL),
(41, 'Home & Kitchenware', 'home---kitchenware', 'Stylish and functional Home & Kitchen essentials.', '/uploads/category/1-ff5abbea-ff58-4739-8687-f9ebcdce73ff-1750065511906.webp', 1, '2025-06-16 09:18:31.982', 1, 'admin', '2025-06-16 09:18:31.983', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `emailConfig` (`id`, `panel`, `module`, `subject`, `action`, `html_template`, `smtp_host`, `smtp_secure`, `smtp_port`, `smtp_username`, `smtp_password`, `from_email`, `from_name`, `status`, `variables`, `to`, `cc`, `bcc`, `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`, `updatedByRole`) VALUES
(1, 'admin', 'auth', 'Password Reset Request from Shipping OWL – {{appName}}', 'forget-password', '<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Password Reset</title>\n    <style>\n      body {\n        margin: 0;\n        padding: 0;\n        font-family: \"Segoe UI\", sans-serif;\n        background-color: #f5f8fa;\n        color: #333;\n      }\n      .container {\n        max-width: 600px;\n        margin: 40px auto;\n        background-color: #ffffff;\n        border-radius: 8px;\n        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);\n        overflow: hidden;\n      }\n      .header {\n        background-color: #1d4ed8;\n        padding: 20px;\n        text-align: center;\n        color: #ffffff;\n      }\n      .header h1 {\n        margin: 0;\n        font-size: 24px;\n      }\n      .content {\n        padding: 30px;\n      }\n      .content h2 {\n        font-size: 20px;\n        margin-bottom: 15px;\n        color: #1f2937;\n      }\n      .content p {\n        font-size: 16px;\n        line-height: 1.6;\n      }\n      .btn {\n        display: inline-block;\n        margin: 20px 0;\n        padding: 12px 24px;\n        background-color: #2563eb;\n        color: white;\n        border-radius: 6px;\n        text-decoration: none;\n        font-weight: 600;\n      }\n      .footer {\n        background-color: #f3f4f6;\n        padding: 20px;\n        text-align: center;\n        font-size: 14px;\n        color: #6b7280;\n      }\n\n      @media (max-width: 600px) {\n        .content {\n          padding: 20px;\n        }\n        .btn {\n          width: 100%;\n          text-align: center;\n        }\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"container\">\n      <div class=\"header\">\n        <h1>{{appName}}</h1>\n      </div>\n      <div class=\"content\">\n        <h2>Hello {{name}},</h2>\n        <p>\n          You recently requested to reset your password for your {{appName}} account. Click the button below to reset it.\n        </p>\n        <p style=\"text-align: center;\">\n          <a href=\"{{resetUrl}}\" class=\"btn\">Reset Password</a>\n        </p>\n        <p>If you did not request a password reset, you can safely ignore this email. This link will expire in 60 minutes.</p>\n        <p>Thanks,<br>The {{appName}} Team</p>\n      </div>\n      <div class=\"footer\">\n        &copy; {{year}} {{appName}}. All rights reserved.\n      </div>\n    </div>\n  </body>\n</html>', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The admin\'s full name (e.g., Sarah Smith)\",\n  \"{{email}}\": \"The admin\'s email address (e.g., sarah@example.com)\",\n  \"{{resetUrl}}\": \"The secure link to reset the password\",\n  \"{{year}}\": \"The current year (e.g., 2025)\",\n  \"{{appName}}\": \"The name of the platform or application (e.g., Shipping OWL)\"\n}\n', '[{\"name\":\"{{name}}\",\"email\":\"{{email}}\"}]', '[{\"name\":\"{{name}}\",\"email\":\"{{email}}\"},{\"name\":\"{{name}}\",\"email\":\"{{email}}\"}]', '[{\"name\":\"Quia obcaecati in ni\",\"email\":\"zadoqaj@mailinator.com\"},{\"name\":\"Dolore laboris volup\",\"email\":\"tyturodal@mailinator.com\"}]', '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),
(2, 'admin', 'auth', '🔐 Password Reset Confirmation – {{appName}}', 'reset-password', '<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Password Changed</title>\n    <style>\n      body {\n        margin: 0;\n        padding: 0;\n        font-family: \"Segoe UI\", sans-serif;\n        background-color: #f9fafb;\n        color: #111827;\n      }\n      .container {\n        max-width: 600px;\n        margin: 40px auto;\n        background-color: #ffffff;\n        border-radius: 8px;\n        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);\n        overflow: hidden;\n      }\n      .header {\n        background-color: #059669;\n        padding: 20px;\n        text-align: center;\n        color: #ffffff;\n      }\n      .header h1 {\n        margin: 0;\n        font-size: 24px;\n      }\n      .content {\n        padding: 30px;\n      }\n      .content h2 {\n        font-size: 20px;\n        margin-bottom: 15px;\n        color: #111827;\n      }\n      .content p {\n        font-size: 16px;\n        line-height: 1.6;\n      }\n      .footer {\n        background-color: #f3f4f6;\n        padding: 20px;\n        text-align: center;\n        font-size: 14px;\n        color: #6b7280;\n      }\n      @media (max-width: 600px) {\n        .content {\n          padding: 20px;\n        }\n      }\n    </style>\n  </head>\n  <body>\n    <div class=\"container\">\n      <div class=\"header\">\n        <h1>{{appName}}</h1>\n      </div>\n      <div class=\"content\">\n        <h2>Hi {{name}},</h2>\n        <p>\n          This is a confirmation that your password has been changed successfully for your {{appName}} account.\n        </p>\n        <p>If you did not make this change, please contact our support team immediately.</p>\n        <p>Thank you for using {{appName}}!</p>\n      </div>\n      <div class=\"footer\">\n        &copy; {{year}} {{appName}}. All rights reserved.\n      </div>\n    </div>\n  </body>\n</html>', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The admin\'s full name (e.g., Jane Doe)\",\n  \"{{email}}\": \"The admin\'s email address (e.g., jane@example.com)\",\n  \"{{year}}\": \"The current year (e.g., 2025)\",\n  \"{{appName}}\": \"The name of the platform or application (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),
(3, 'admin', 'supplier', 'Password Changed Notification', 'password-change', '<!DOCTYPE html>\r\n<html lang=\"en\">\r\n\r\n<head>\r\n  <meta charset=\"UTF-8\">\r\n  <title>Password Changed Notification</title>\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\r\n  <style>\r\n    body {\r\n      margin: 0;\r\n      padding: 0;\r\n      font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif;\r\n      background-color: #f4f6f9;\r\n    }\r\n\r\n    .email-container {\r\n      max-width: 600px;\r\n      margin: 40px auto;\r\n      background-color: #ffffff;\r\n      border-radius: 8px;\r\n      padding: 30px;\r\n      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);\r\n      border: 1px solid #e0e0e0;\r\n    }\r\n\r\n    .header {\r\n      font-size: 20px;\r\n      font-weight: bold;\r\n      color: #1a1a1a;\r\n      border-bottom: 1px solid #e0e0e0;\r\n      padding-bottom: 15px;\r\n      margin-bottom: 25px;\r\n    }\r\n\r\n    .content {\r\n      font-size: 15px;\r\n      color: #333333;\r\n      line-height: 1.7;\r\n    }\r\n\r\n    .content strong {\r\n      color: #000000;\r\n    }\r\n\r\n    .password-box {\r\n      background-color: #f1f1f1;\r\n      border-left: 4px solid #4CAF50;\r\n      padding: 12px 16px;\r\n      margin: 20px 0;\r\n      font-family: monospace;\r\n      font-size: 16px;\r\n      color: #1a1a1a;\r\n    }\r\n\r\n    .footer {\r\n      margin-top: 40px;\r\n      font-size: 13px;\r\n      color: #888888;\r\n      text-align: center;\r\n    }\r\n\r\n    @media (max-width: 600px) {\r\n      .email-container {\r\n        padding: 20px;\r\n      }\r\n\r\n      .password-box {\r\n        font-size: 14px;\r\n      }\r\n    }\r\n  </style>\r\n</head>\r\n\r\n<body>\r\n  <div class=\"email-container\">\r\n    <div class=\"header\">Your Password Has Been Updated</div>\r\n\r\n    <div class=\"content\">\r\n      Hello <strong>{{supplierName}}</strong>,\r\n      <br><br>\r\n      Your account password has been successfully updated by an administrator of <strong>{{appName}}</strong>.\r\n      <br><br>\r\n      Please find your new login password below. We recommend changing it after your next login for security reasons.\r\n\r\n      <div class=\"password-box\">\r\n        New Password: <strong>{{password}}</strong>\r\n      </div>\r\n\r\n      If you did not request or expect this change, please contact our support team immediately.\r\n    </div>\r\n\r\n    <div class=\"footer\">\r\n      &copy; {{year}} {{appName}}. All rights reserved.\r\n    </div>\r\n  </div>\r\n</body>\r\n\r\n</html>', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The supplier’s full name\",\n  \"{{email}}\": \"The supplier’s email address\",\n  \"{{password}}\": \"The generated or reset password for the supplier account\",\n  \"{{year}}\": \"The current year (e.g., 2025)\",\n  \"{{appName}}\": \"The name of the application (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),
(4, 'admin', 'dropshipper', 'Password Changed Notification', 'password-change', '<!DOCTYPE html>\r\n<html lang=\"en\">\r\n\r\n<head>\r\n  <meta charset=\"UTF-8\">\r\n  <title>Password Changed Notification</title>\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\r\n  <style>\r\n    body {\r\n      margin: 0;\r\n      padding: 0;\r\n      font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif;\r\n      background-color: #f4f6f9;\r\n    }\r\n\r\n    .email-container {\r\n      max-width: 600px;\r\n      margin: 40px auto;\r\n      background-color: #ffffff;\r\n      border-radius: 8px;\r\n      padding: 30px;\r\n      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);\r\n      border: 1px solid #e0e0e0;\r\n    }\r\n\r\n    .header {\r\n      font-size: 20px;\r\n      font-weight: bold;\r\n      color: #1a1a1a;\r\n      border-bottom: 1px solid #e0e0e0;\r\n      padding-bottom: 15px;\r\n      margin-bottom: 25px;\r\n    }\r\n\r\n    .content {\r\n      font-size: 15px;\r\n      color: #333333;\r\n      line-height: 1.7;\r\n    }\r\n\r\n    .content strong {\r\n      color: #000000;\r\n    }\r\n\r\n    .password-box {\r\n      background-color: #f1f1f1;\r\n      border-left: 4px solid #4CAF50;\r\n      padding: 12px 16px;\r\n      margin: 20px 0;\r\n      font-family: monospace;\r\n      font-size: 16px;\r\n      color: #1a1a1a;\r\n    }\r\n\r\n    .footer {\r\n      margin-top: 40px;\r\n      font-size: 13px;\r\n      color: #888888;\r\n      text-align: center;\r\n    }\r\n\r\n    @media (max-width: 600px) {\r\n      .email-container {\r\n        padding: 20px;\r\n      }\r\n\r\n      .password-box {\r\n        font-size: 14px;\r\n      }\r\n    }\r\n  </style>\r\n</head>\r\n\r\n<body>\r\n  <div class=\"email-container\">\r\n    <div class=\"header\">Your Password Has Been Updated</div>\r\n\r\n    <div class=\"content\">\r\n      Hello <strong>{{dropshipperName}}</strong>,\r\n      <br><br>\r\n      Your account password has been successfully updated by an administrator of <strong>{{appName}}</strong>.\r\n      <br><br>\r\n      Please find your new login password below. We recommend changing it after your next login for security reasons.\r\n\r\n      <div class=\"password-box\">\r\n        New Password: <strong>{{password}}</strong>\r\n      </div>\r\n\r\n      If you did not request or expect this change, please contact our support team immediately.\r\n    </div>\r\n\r\n    <div class=\"footer\">\r\n      &copy; {{year}} {{appName}}. All rights reserved.\r\n    </div>\r\n  </div>\r\n</body>\r\n\r\n</html>', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The dropshipper’s full name\",\n  \"{{email}}\": \"The dropshipper’s email address\",\n  \"{{password}}\": \"The generated or reset password for the dropshipper account\",\n  \"{{year}}\": \"The current year (e.g., for copyright or timestamp)\",\n  \"{{appName}}\": \"The name of the application (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),

(5, 'supplier', 'auth', 'Supplier Registration', 'registration', '<!DOCTYPE html>\n<html lang=\"en\">\n\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Registration Submitted</title>\n</head>\n\n<body style=\"margin: 0; padding: 0; background-color: #f6f9fc; font-family: \'Segoe UI\', Arial, sans-serif;\">\n  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding: 40px 0;\">\n    <tr>\n      <td align=\"center\">\n        <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\"\n          style=\"background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;\">\n          <tr>\n            <td style=\"background-color: #3498db; padding: 20px; text-align: center;\">\n              <h2 style=\"margin: 0; color: #fff;\">Registration Received</h2>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"padding: 30px;\">\n              <p style=\"font-size: 16px; color: #333;\">Hi <strong>{{name}}</strong>,</p>\n\n              <p style=\"font-size: 16px; color: #333;\">\n                Thank you for registering with us. We have successfully received your application.\n              </p>\n\n              <table style=\"width: 100%; margin: 20px 0; font-size: 16px; color: #444;\">\n                <tr>\n                  <td style=\"padding: 8px 0;\"><strong>Email:</strong></td>\n                  <td style=\"padding: 8px 0;\">{{email}}</td>\n                </tr>\n                <tr>\n                  <td style=\"padding: 8px 0;\"><strong>Password:</strong></td>\n                  <td style=\"padding: 8px 0;\">{{password}}</td>\n                </tr>\n              </table>\n\n              <p style=\"font-size: 15px; color: #555;\">\n                Please verify your account using the button below:\n              </p>\n\n              <div style=\"text-align: center; margin: 30px 0;\">\n                <a href=\"{{verificationLink}}\"\n                  style=\"background-color: #3498db; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;\">\n                  Verify Account\n                </a>\n              </div>\n\n              <p style=\"font-size: 15px; color: #555;\">\n                Your application has been forwarded to the admin team for verification. We will notify you once your\n                account is approved and activated.\n              </p>\n\n              <p style=\"margin-top: 30px; font-size: 15px;\">Regards,<br><strong>The Registration Team</strong></p>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"background-color: #eeeeee; text-align: center; padding: 15px; font-size: 13px; color: #777;\">\n              &copy; {{year}} {{appName}}. All rights reserved.\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n\n</html>', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The supplier’s full name (e.g., John Smith)\",\n  \"{{email}}\": \"The supplier’s email address (e.g., john@example.com)\",\n  \"{{year}}\": \"The current year (e.g., 2025)\",\n  \"{{appName}}\": \"The name of the platform (e.g., Shipping OWL)\",\n  \"{{verificationLink}}\": \"The account verification link containing a secure token\",\n  \"{{password}}\": \"The initial or temporary password assigned to the supplier\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),
(6, 'supplier', 'auth', 'Supplier Status Update', 'status-update', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>\n  <title>Status Notification</title>\n</head>\n<body style=\"margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;\">\n  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f4f4f4; padding: 40px 0;\">\n    <tr>\n      <td align=\"center\">\n        <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);\">\n          <tr>\n            <td style=\"background-color: {{statusColor}}; color: #ffffff; padding: 20px; text-align: center;\">\n              <h2 style=\"margin: 0;\">Status Update Notification</h2>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"padding: 30px;\">\n              <p style=\"font-size: 16px;\">Hello <strong>{{name}}</strong>,</p>\n              <p style=\"font-size: 16px;\">This is to inform you that your account status has been updated.</p>\n\n              <table style=\"width: 100%; margin: 20px 0; font-size: 16px;\">\n                <tr>\n                  <td style=\"padding: 10px 0;\"><strong>Email:</strong></td>\n                  <td style=\"padding: 10px 0;\">{{email}}</td>\n                </tr>\n                <tr>\n                  <td style=\"padding: 10px 0;\"><strong>Status:</strong></td>\n                  <td style=\"padding: 10px 0; color: {{statusColor}};\"><strong>{{status}}</strong></td>\n                </tr>\n              </table>\n\n              <p style=\"font-size: 15px; color: #555;\">If you have any questions or concerns, feel free to contact our support team.</p>\n\n              <p style=\"margin-top: 30px; font-size: 15px;\">Regards,<br><strong>The Admin Team</strong></p>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"background-color: #eeeeee; text-align: center; padding: 15px; font-size: 13px; color: #777;\">\n              &copy; {{year}} {{appName}}. All rights reserved.\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The supplier’s full name (e.g., John Doe)\",\n  \"{{email}}\": \"The supplier’s email address (e.g., john@example.com)\",\n  \"{{status}}\": \"Account status as a label (Active or Inactive)\",\n  \"{{statusColor}}\": \"Color code representing the status (green for Active, red for Inactive)\",\n  \"{{year}}\": \"The current year (e.g., 2025)\",\n  \"{{appName}}\": \"The name of the platform (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),
(7, 'supplier', 'auth', 'Supplier Registration Email Verified', 'verify', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>\n  <title>Account Verified</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f5f8fa; font-family: \'Segoe UI\', Arial, sans-serif;\">\n  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding: 40px 0;\">\n    <tr>\n      <td align=\"center\">\n        <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;\">\n          <tr>\n            <td style=\"background-color: #2ecc71; padding: 20px; text-align: center;\">\n              <h2 style=\"margin: 0; color: #ffffff;\">Account Verified Successfully</h2>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"padding: 30px;\">\n              <p style=\"font-size: 16px; color: #333;\">Hi <strong>{{name}}</strong>,</p>\n\n              <p style=\"font-size: 16px; color: #333;\">\n                🎉 Congratulations! Your supplier account with <strong>{{appName}}</strong> has been verified successfully.\n              </p>\n\n              <p style=\"font-size: 15px; color: #555;\">\n                You can now log in and start exploring your dashboard.\n              </p>\n\n              <p style=\"margin: 25px 0; text-align: center;\">\n                <a href=\"{{loginLink}}\" style=\"display: inline-block; padding: 12px 25px; background-color: #2980b9; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;\">\n                  Log In to Your Account\n                </a>\n              </p>\n\n              <p style=\"font-size: 15px; color: #555;\">\n                If you have any questions, feel free to contact our support team.\n              </p>\n\n              <p style=\"margin-top: 30px; font-size: 15px;\">Regards,<br><strong>{{appName}} Team</strong></p>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"background-color: #eeeeee; text-align: center; padding: 15px; font-size: 13px; color: #777;\">\n              &copy; {{year}} {{appName}}. All rights reserved.\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The Supplier \'s full name (e.g., Jane Doe)\",\n  \"{{email}}\": \"The Supplier \'s email address (e.g., jane@example.com)\",\n  \"{{year}}\": \"The current calendar year (e.g., 2025)\",\n  \"{{loginLink}}\": \"The secure link to log into the Supplier  panel\",\n  \"{{appName}}\": \"The name of the platform or application (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),
(8, 'supplier', 'need to raise', 'Dispute Raised: RTO Delivered Orders Not Received at Warehouse', 'dispute-1', '<!DOCTYPE html>\n<html>\n\n<head>\n  <meta charset=\"UTF-8\">\n  <title>RTO Dispute Notification</title>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <style>\n    body {\n      margin: 0;\n      padding: 0;\n      font-family: Arial, sans-serif;\n      background-color: #f7f9fc;\n    }\n\n    .email-container {\n      max-width: 600px;\n      margin: auto;\n      background-color: #ffffff;\n      border: 1px solid #dcdcdc;\n      border-radius: 8px;\n      padding: 30px;\n      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);\n    }\n\n    .header {\n      font-size: 20px;\n      font-weight: bold;\n      color: #1a1a1a;\n      margin-bottom: 20px;\n    }\n\n    .content {\n      font-size: 15px;\n      color: #333333;\n      margin-bottom: 20px;\n      line-height: 1.6;\n    }\n\n    .order-table {\n      width: 100%;\n      border-collapse: collapse;\n      margin-top: 10px;\n    }\n\n    .order-table th,\n    .order-table td {\n      border: 1px solid #cccccc;\n      padding: 10px;\n      text-align: left;\n      font-size: 14px;\n    }\n\n    .order-table th {\n      background-color: #f0f0f0;\n      font-weight: bold;\n    }\n\n    .footer {\n      margin-top: 30px;\n      font-size: 13px;\n      color: #777777;\n      text-align: center;\n    }\n\n    @media (max-width: 600px) {\n      .email-container {\n        padding: 20px;\n      }\n\n      .order-table th,\n      .order-table td {\n        font-size: 13px;\n      }\n    }\n  </style>\n</head>\n\n<body>\n  <div class=\"email-container\">\n    <div class=\"header\">RTO Delivery Dispute Notification</div>\n\n    <div class=\"content\">\n      The following order(s) have been marked as <strong>RTO Delivered</strong> by the courier partner, but they have\n      not been received at our warehouse. Kindly review the details and investigate the issue at the earliest:\n    </div>\n\n    <table class=\"order-table\">\n      <tr>\n        <th>Order ID</th>\n        <th>AWB Number</th>\n        <th>RTO Delivered Date</th>\n        <th>Dispute Raised Date</th>\n      </tr>\n      {{orderTableRows}}\n    </table>\n\n    <div class=\"content\" style=\"margin-top: 20px;\">\n      We request your logistics team to verify the actual delivery status and respond with confirmation or corrective\n      action at the earliest. Thank you for your cooperation.\n    </div>\n\n    <div class=\"footer\">\n      This is an automated message from <strong>{{appName}}</strong>. For further queries, please contact our support\n      team.\n    </div>\n  </div>\n</body>\n\n</html>', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{orderTableRows}}\": \"The rendered HTML <tr> rows containing order details (used inside an HTML <table>)\",\n  \"{{year}}\": \"The current year (e.g., 2025)\",\n  \"{{appName}}\": \"The name of the application (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),
(9, 'supplier', 'need to raise', 'Dispute Raised: RTO Delivered Orders Not Received at Warehouse', 'dispute-2', '<!DOCTYPE html>\n<html>\n\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Dispute Level 2 Notification</title>\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <style>\n    body {\n      margin: 0;\n      padding: 0;\n      font-family: Arial, sans-serif;\n      background-color: #f7f9fc;\n    }\n\n    .email-container {\n      max-width: 600px;\n      margin: auto;\n      background-color: #ffffff;\n      border: 1px solid #dcdcdc;\n      border-radius: 8px;\n      padding: 30px;\n      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);\n    }\n\n    .header {\n      font-size: 20px;\n      font-weight: bold;\n      color: #1a1a1a;\n      margin-bottom: 20px;\n    }\n\n    .content {\n      font-size: 15px;\n      color: #333333;\n      margin-bottom: 20px;\n      line-height: 1.6;\n    }\n\n    .order-table {\n      width: 100%;\n      border-collapse: collapse;\n      margin-top: 10px;\n    }\n\n    .order-table th,\n    .order-table td {\n      border: 1px solid #cccccc;\n      padding: 10px;\n      text-align: left;\n      font-size: 14px;\n    }\n\n    .order-table th {\n      background-color: #f0f0f0;\n      font-weight: bold;\n    }\n\n    .footer {\n      margin-top: 30px;\n      font-size: 13px;\n      color: #777777;\n      text-align: center;\n    }\n\n    @media (max-width: 600px) {\n      .email-container {\n        padding: 20px;\n      }\n\n      .order-table th,\n      .order-table td {\n        font-size: 13px;\n      }\n    }\n  </style>\n</head>\n\n<body>\n  <div class=\"email-container\">\n    <div class=\"header\">RTO Dispute Level 2 Notification</div>\n\n    <div class=\"content\">\n      We have received the return package for the following order(s), but the item received does not match the original\n      product delivered.\n      This is a <strong>Level 2 dispute</strong> regarding incorrect return contents.\n    </div>\n\n    <table class=\"order-table\">\n      <tr>\n        <th>Order ID</th>\n        <th>AWB Number</th>\n        <th>RTO Delivered Date</th>\n        <th>Dispute Raised Date</th>\n      </tr>\n      {{orderTableRows}}\n    </table>\n\n    <div class=\"content\" style=\"margin-top: 20px;\">\n      Attached with this email are supporting files, including:\n      <ul>\n        <li>📦 Packaging Gallery</li>\n        <li>📦 Unboxing Gallery</li>\n      </ul>\n      Please review the attachments and investigate this matter with your logistics team at the earliest.\n    </div>\n\n    <div class=\"footer\">\n      This is an automated message from <strong>{{appName}}</strong>. For further assistance, please contact our support\n      team.\n    </div>\n  </div>\n</body>\n\n</html>', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{orderTableRows}}\": \"The rendered HTML <tr> rows containing order details (used inside an HTML <table>)\",\n  \"{{year}}\": \"The current year (e.g., 2025)\",\n  \"{{appName}}\": \"The name of the application (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),

(10, 'dropshipper', 'auth', 'Dropshipper Registration', 'registration', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>\n  <title>Welcome Dropshipper</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f4f7f9; font-family: \'Segoe UI\', Arial, sans-serif;\">\n  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding: 40px 0;\">\n    <tr>\n      <td align=\"center\">\n        <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;\">\n          <tr>\n            <td style=\"background-color: #34495e; padding: 20px; text-align: center;\">\n              <h2 style=\"margin: 0; color: #ffffff;\">Welcome to {{appName}}!</h2>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"padding: 30px;\">\n              <p style=\"font-size: 16px; color: #333;\">Hi <strong>{{name}}</strong>,</p>\n\n              <p style=\"font-size: 16px; color: #333;\">\n                We’re excited to have you on board as a <strong>dropshipper</strong> at <strong>{{appName}}</strong>.\n              </p>\n\n              <p style=\"font-size: 15px; color: #555;\">\n                To get started, please verify your account by clicking the button below:\n              </p>\n\n              <p style=\"margin: 25px 0; text-align: center;\">\n                <a href=\"{{verificationLink}}\" style=\"display: inline-block; padding: 12px 25px; background-color: #27ae60; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;\">\n                  Verify Your Account\n                </a>\n              </p>\n\n              <p style=\"font-size: 15px; color: #555;\">\n                After verification, you’ll be able to access your dashboard and start selling!\n              </p>\n\n              <p style=\"margin-top: 30px; font-size: 15px;\">Welcome again,<br><strong>{{appName}} Team</strong></p>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"background-color: #eeeeee; text-align: center; padding: 15px; font-size: 13px; color: #777;\">\n              &copy; {{year}} {{appName}}. All rights reserved.\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The dropshipper’s full name (e.g., John Doe)\",\n  \"{{email}}\": \"The dropshipper’s email address (e.g., john@example.com)\",\n  \"{{verificationLink}}\": \"The verification URL to activate the dropshipper\'s account\",\n  \"{{year}}\": \"The current year (e.g., 2025)\",\n  \"{{appName}}\": \"The name of the platform (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL),
(11, 'dropshipper', 'auth', 'Dropshipper Registration Email Verified', 'verify', '<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>\n  <title>Account Verified</title>\n</head>\n<body style=\"margin: 0; padding: 0; background-color: #f5f8fa; font-family: \'Segoe UI\', Arial, sans-serif;\">\n  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding: 40px 0;\">\n    <tr>\n      <td align=\"center\">\n        <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;\">\n          <tr>\n            <td style=\"background-color: #2ecc71; padding: 20px; text-align: center;\">\n              <h2 style=\"margin: 0; color: #ffffff;\">Account Verified Successfully</h2>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"padding: 30px;\">\n              <p style=\"font-size: 16px; color: #333;\">Hi <strong>{{name}}</strong>,</p>\n\n              <p style=\"font-size: 16px; color: #333;\">\n                🎉 Congratulations! Your dropshipper account with <strong>{{appName}}</strong> has been verified successfully.\n              </p>\n\n              <p style=\"font-size: 15px; color: #555;\">\n                You can now log in and start exploring your dashboard.\n              </p>\n\n              <p style=\"margin: 25px 0; text-align: center;\">\n                <a href=\"{{loginLink}}\" style=\"display: inline-block; padding: 12px 25px; background-color: #2980b9; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;\">\n                  Log In to Your Account\n                </a>\n              </p>\n\n              <p style=\"font-size: 15px; color: #555;\">\n                If you have any questions, feel free to contact our support team.\n              </p>\n\n              <p style=\"margin-top: 30px; font-size: 15px;\">Regards,<br><strong>{{appName}} Team</strong></p>\n            </td>\n          </tr>\n          <tr>\n            <td style=\"background-color: #eeeeee; text-align: center; padding: 15px; font-size: 13px; color: #777;\">\n              &copy; {{year}} {{appName}}. All rights reserved.\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>\n', 'smtp.gmail.com', 1, 465, 'rohitwebstep@gmail.com', 'dxoaeeczgiapoybi', 'rohitwebstep@gmail.com', 'Shipping OWL', 1, '{\n  \"{{name}}\": \"The dropshipper\'s full name (e.g., Jane Doe)\",\n  \"{{email}}\": \"The dropshipper\'s email address (e.g., jane@example.com)\",\n  \"{{year}}\": \"The current calendar year (e.g., 2025)\",\n  \"{{loginLink}}\": \"The secure link to log into the dropshipper panel\",\n  \"{{appName}}\": \"The name of the platform or application (e.g., Shipping OWL)\"\n}\n', NULL, NULL, NULL, '2025-04-14 10:37:10.000', NULL, NULL, '2025-04-14 10:37:17.000', NULL, NULL);

INSERT INTO `product` (
  `id`, `shippingOwlProductId`, `categoryId`, `name`, `slug`, `main_sku`,
  `description`, `tags`, `brandId`, `originCountryId`, `hsnCode`, `taxRate`,
  `rtoAddress`, `pickupAddress`, `shippingCountryId`, `video_url`, `list_as`,
  `shipping_time`, `weight`, `package_length`, `package_width`, `package_height`,
  `chargeable_weight`, `package_weight_image`, `package_length_image`,
  `package_width_image`, `package_height_image`, `product_detail_video`,
  `training_guidance_video`, `isVisibleToAll`, `status`, `isVarientExists`,
  `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`,
  `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES (
  1, 'PRD-675363', 1, 'Wireless Bluetooth Headphones', 'wireless-bluetooth-headphones', 'WH-12345',
  'High-quality wireless headphones with noise cancellation and 30 hours battery life.',
  '["wireless","bluetooth","audio","music"]', 3, 101, '85183000', 18,
  'Warehouse RTO Address, Mumbai', 'Pickup Hub A, New Delhi', 101,
  'https://example.com/video/product-demo.mp4', 'warehouse', '2-3 Days', 0.45,
  20, 18, 10, NULL,
  'https://example.com/images/weight.jpg', 'https://example.com/images/length.jpg',
  'https://example.com/images/width.jpg', 'https://example.com/images/height.jpg',
  'https://example.com/videos/detail.mp4', 'https://example.com/videos/guidance.mp4',
  1, 1, 1, '2025-05-28 04:55:32', 1, 'admin',
  '2025-05-28 04:55:32', 1, 'admin', NULL, NULL, NULL
);

INSERT INTO `productVariant` (
  `id`, `name`, `productId`, `color`, `sku`,
  `product_link`, `suggested_price`, `createdAt`, `createdBy`, `createdByRole`,
  `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES 
(
  1, 'Black Color - Wireless Edition', 1, 'Black', 'WH-BLK-01',
  'https://example.com/product/wireless-bluetooth-headphones-black', 4499.00,
  '2025-05-28 04:55:32', 1, 'admin', '2025-05-28 04:55:32', 1, 'admin',
  NULL, NULL, NULL
),
(
  2, 'Blue Color - Self Ship Edition', 1, 'Blue', 'WH-BLU-01',
  'https://example.com/product/wireless-bluetooth-headphones-blue', 4299.00,
  '2025-05-28 04:56:32', 1, 'admin', '2025-05-28 04:56:32', 1, 'admin',
  NULL, NULL, NULL
);

INSERT INTO `supplierProduct` (
  `id`, `supplierId`, `productId`, `status`, `createdAt`, `createdBy`, `createdByRole`,
  `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES
(1, 3, 1, 1, '2025-05-28 04:58:20.637', 3, 'supplier', '2025-05-28 04:58:20.639', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `supplierProductVariant` (
  `id`, `supplierId`, `productId`, `productVariantId`, `supplierProductId`,
  `price`, `stock`, `status`, `createdAt`, `createdBy`, `createdByRole`,
  `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES
(1, 3, 1, 1, 1, 99.99, 10, 1, '2025-05-28 04:58:20.646', 3, 'supplier', '2025-05-28 04:58:20.650', NULL, NULL, NULL, NULL, NULL),
(2, 3, 1, 2, 1, 89.50, 20, 1, '2025-05-28 05:01:20.000', 3, 'supplier', '2025-05-28 05:01:20.100', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `dropshipperProduct` (
  `shopifyStoreId`, `dropshipperId`, `supplierId`, `supplierProductId`, `productId`,
  `status`, `createdAt`, `createdBy`, `createdByRole`,
  `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES
(1, 2, 3, 1, 1, 1, '2025-05-28 05:09:11.534', 2, 'dropshipper', '2025-05-28 05:09:11.536', NULL, NULL, NULL, NULL, NULL),
(1, 2, 3, 1, 1, 1, '2025-05-28 05:12:22.100', 2, 'dropshipper', '2025-05-28 05:12:22.101', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `dropshipperProductVariant` (
  `id`, `dropshipperId`, `productId`, `supplierProductId`, `dropshipperProductId`,
  `supplierProductVariantId`, `price`, `status`,
  `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`, `updatedByRole`,
  `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES
(1, 2, 1, 1, 1, 1, 99.99, 1, '2025-05-28 05:09:11.545', 2, 'dropshipper', '2025-05-28 05:09:11.547', NULL, NULL, NULL, NULL, NULL),
(2, 2, 1, 1, 2, 2, 89.50, 1, '2025-05-28 05:13:13.600', 2, 'dropshipper', '2025-05-28 05:13:13.602', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `payment` (
  `id`, `transactionId`, `cycle`, `amount`, `status`, `date`,
  `createdAt`, `createdBy`, `createdByRole`,
  `updatedAt`, `updatedBy`, `updatedByRole`,
  `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES
(1, 'TXN202508041001', 'monthly', 499.99, 'pending', '2025-08-04 12:00:00',
 '2025-05-28 05:12:00.000', 2, 'supplier', '2025-05-28 05:12:30.000', NULL, NULL, NULL, NULL, NULL),
(2, 'TXN202508041002', 'yearly', 999.00, 'failed', '2025-08-04 14:45:00',
 '2025-05-28 05:15:00.000', 3, 'dropshipper', '2025-05-28 05:15:20.000', NULL, NULL, NULL, NULL, NULL),
(3, 'TXN202508041003', 'cod', 1899.50, 'success', '2025-08-04 16:00:00',
 '2025-05-28 05:18:00.000', 1, 'admin', '2025-05-28 05:18:45.000', NULL, NULL, NULL, NULL, NULL);

-- Insert into `order`
INSERT INTO `order` (
  `id`, `orderNumber`, `status`, `orderNote`, `subtotal`, `tax`, `discount`, `totalAmount`, `currency`,
  `shippingName`, `shippingPhone`, `shippingEmail`, `shippingAddress`, `shippingZip`, `shippingCountryId`,
  `shippingStateId`, `shippingCityId`, `billingName`, `billingPhone`, `billingEmail`, `billingAddress`,
  `billingZip`, `billingCountryId`, `billingStateId`, `billingCityId`, `paymentId`, `shippingApiResult`,
  `delivered`, `lastRefreshAt`, `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`,
  `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES
(1, 'M62LMGXI', 'pending', 'Lsdsd', 100, 10, 5, 105, 'INR', 'Meena Joshi', '9811122233', 'meena.joshi@example.com', '207, Inder Nagar, Ambala City', '110067', 101, 4007, 57675, 'John Doe', '9874563210', 'john@example.com', 'Flat No. 403, Mahavir Dham CHS, Plot No. 112, Sector 12, Dwarka', '110067', 101, 4007, 57675, 1,
'{\"status\":true,\"responsemsg\":\"Order Placed Successfully.\",\"data\":{\"awb_number\":\"13630911386265\",\"order_number\":\"12513560\",\"job_id\":null,\"lrnum\":\"\",\"waybills_num_json\":null,\"lable_data\":null,\"routing_code\":\"DEL/KIS\",\"payment_mode\":\"COD\",\"client_order_id\":\"1\",\"partner_display_name\":\"Delhivery\",\"courier_code\":\"PXDEL01\",\"pickup_id\":\"4257544\",\"courier_name\":\"Delhivery\"}}',
0, NULL, '2025-05-28 10:00:35.215', NULL, NULL, '2025-05-28 10:36:02.808', 1, 'admin', NULL, NULL, NULL),

(2, 'X73YDHLW', 'confirmed', 'Please deliver between 9AM-1PM', 180, 15, 10, 185, 'INR',
'Ravi Sharma', '9898989898', 'ravi.sharma@example.com', 'A-50, Model Town, Ludhiana', '141002', 101, 4007, 57675,
'Ravi Sharma', '9898989898', 'ravi.billing@example.com', 'A-50, Model Town, Ludhiana', '141002', 101, 4007, 57675, 2,
'{\"status\":true,\"responsemsg\":\"Order Created.\",\"data\":{\"awb_number\":\"13630911386266\",\"order_number\":\"12513561\",\"payment_mode\":\"Prepaid\",\"courier_name\":\"Delhivery\"}}',
1, NULL, '2025-05-29 09:30:12.000', 2, 'dropshipper', '2025-05-29 09:32:55.000', 1, 'admin', NULL, NULL, NULL),

(3, 'Z94PLQRE', 'shipped', 'Urgent order for gifting', 90, 9, 0, 99, 'INR',
'Anita Verma', '9876543210', 'anita.verma@example.com', '24, Green Park, Delhi', '110016', 101, 4007, 57675,
'Anita Verma', '9876543210', 'anita.billing@example.com', '24, Green Park, Delhi', '110016', 101, 4007, 57675, 3,
'{\"status\":true,\"responsemsg\":\"Shipped via Delhivery.\",\"data\":{\"awb_number\":\"13630911386267\",\"order_number\":\"12513562\",\"payment_mode\":\"COD\",\"courier_name\":\"Delhivery\"}}',
1, NULL, '2025-05-30 11:00:00.000', 2, 'dropshipper', '2025-05-30 11:15:00.000', 1, 'admin', NULL, NULL, NULL);

-- Insert into `orderitem`
INSERT INTO `orderItem` (
  `id`, `orderId`, `dropshipperProductId`, `dropshipperProductVariantId`, `dropshipperId`, `supplierProductId`, `supplierProductVariantId`, `supplierId`, `quantity`, `price`, `total`
) VALUES
(1, 1, 1, 1, 2, 1, 1, 3, 2, 50, 100),
(2, 2, 2, 2, 2, 1, 2, 3, 2, 90, 180),
(3, 3, 1, 1, 2, 1, 1, 3, 1, 90, 90);
