INSERT INTO `admin` (`id`, `name`, `uniqeId`, `username`, `email`, `password`, `role`, `status`, `createdAt`, `updatedAt`, `pr_token`, `pr_expires_at`, `pr_last_reset`) VALUES
(1, 'Rohit Admin', 'ADMIN-12', 'rohit-admin', 'rohitwebstep-admin@gmail.com', '$2b$10$hW8vbhToemWerVuNQ5W4l.7RVppP2Y3a8hooIZTPidgugCkWMcOyC', 'admin', 'active', '2025-04-07 05:19:36.000', '2025-04-14 06:32:13.419', NULL, NULL, '2025-04-14 06:32:13.417'),
(2, 'Rohit Dropshipper', 'ADMIN-132', 'rohit-dropshipper', 'rohitwebstep-drop@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'dropshipper', 'active', '2025-04-07 05:19:36.000', '2025-04-07 05:19:39.000', NULL, NULL, NULL),
(3, 'Rohit Supplier', 'ADMIN-142', 'rohit-supplier', 'rohitwebstep-sup@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'supplier', 'active', '2025-04-07 05:19:36.000', '2025-04-07 05:19:39.000', NULL, NULL, NULL),
(4, 'Shikha Admin', 'ADMIN-162', 'shikha-admin', 'shikhawebstep@gmail.com', '$2b$10$hW8vbhToemWerVuNQ5W4l.7RVppP2Y3a8hooIZTPidgugCkWMcOyC', 'admin', 'active', '2025-04-07 05:19:36.000', '2025-04-14 06:32:13.419', NULL, NULL, '2025-04-14 06:32:13.417');

INSERT INTO `adminStaff` (`id`, `admin_id`, `name`, `email`, `password`, `status`, `createdAt`, `updatedAt`, `pr_token`, `pr_expires_at`, `pr_last_reset`) VALUES
(1, 1, 'Rohit Admin Staff', 'rohitwebstep-admin-staff@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'active', '2025-04-07 06:32:17.000', '2025-04-07 06:32:20.000', NULL, NULL, NULL),
(2, 2, 'Rohit Dropshipper Staff', 'rohitwebstep-drop-staff@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'active', '2025-04-07 06:32:17.000', '2025-04-07 06:32:20.000', NULL, NULL, NULL),
(3, 3, 'Rohit Supplier Staff', 'rohitwebstep-sup-staff@gmail.com', '$2b$10$vws6emtcbykca5VJkQIsu.o3mzNY5Qj/g/2659P/uHooVQ79VQg5q', 'active', '2025-04-07 06:32:17.000', '2025-04-07 06:32:20.000', NULL, NULL, NULL);
