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
