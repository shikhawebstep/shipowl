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