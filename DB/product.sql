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
  `id`, `name`, `productId`, `image`, `color`, `modal`, `sku`,
  `product_link`, `suggested_price`, `createdAt`, `createdBy`, `createdByRole`,
  `updatedAt`, `updatedBy`, `updatedByRole`, `deletedAt`, `deletedBy`, `deletedByRole`
) VALUES (
  1, 'Black Color - Wireless Edition', 1,
  'https://example.com/images/variant-black.jpg', 'Black', 'shipowl', 'WH-BLK-01',
  'https://example.com/product/wireless-bluetooth-headphones-black', 4499.00,
  '2025-05-28 04:55:32', 1, 'admin', '2025-05-28 04:55:32', 1, 'admin',
  NULL, NULL, NULL
),
(
  2, 'Blue Color - Self Ship Edition', 1,
  'https://example.com/images/variant-blue.jpg', 'Blue', 'selfship', 'WH-BLU-01',
  'https://example.com/product/wireless-bluetooth-headphones-blue', 4299.00,
  '2025-05-28 04:56:32', 1, 'admin', '2025-05-28 04:56:32', 1, 'admin',
  NULL, NULL, NULL
);
