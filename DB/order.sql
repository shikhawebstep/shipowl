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
INSERT INTO `orderitem` (
  `id`, `orderId`, `dropshipperProductId`, `dropshipperProductVariantId`, `quantity`, `price`, `total`
) VALUES
(1, 1, 1, 1, 2, 50, 100),
(2, 2, 2, 2, 2, 90, 180),
(3, 3, 1, 1, 1, 90, 90);
