INSERT INTO `dropshipperproduct` (
  `id`, `dropshipperId`, `supplierId`, `supplierProductId`, `productId`,
  `status`, `createdAt`, `createdBy`, `createdByRole`,
  `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES
(1, 2, 3, 1, 1, 1, '2025-05-28 05:09:11.534', 2, 'dropshipper', '2025-05-28 05:09:11.536', NULL, NULL, NULL, NULL, NULL),
(2, 2, 3, 1, 1, 1, '2025-05-28 05:12:22.100', 2, 'dropshipper', '2025-05-28 05:12:22.101', NULL, NULL, NULL, NULL, NULL);

INSERT INTO `dropshipperproductvariant` (
  `id`, `dropshipperId`, `productId`, `supplierProductId`, `dropshipperProductId`,
  `supplierProductVariantId`, `price`, `stock`, `status`,
  `createdAt`, `createdBy`, `createdByRole`, `updatedAt`, `updatedBy`, `updatedByRole`,
  `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES
(1, 2, 1, 1, 1, 1, 99.99, 10, 1, '2025-05-28 05:09:11.545', 2, 'dropshipper', '2025-05-28 05:09:11.547', NULL, NULL, NULL, NULL, NULL),
(2, 2, 1, 1, 2, 2, 89.50, 5, 1, '2025-05-28 05:13:13.600', 2, 'dropshipper', '2025-05-28 05:13:13.602', NULL, NULL, NULL, NULL, NULL);
