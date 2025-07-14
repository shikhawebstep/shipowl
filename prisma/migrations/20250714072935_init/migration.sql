-- CreateTable
CREATE TABLE `appConfig` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `shippingCost` BIGINT NOT NULL,
    `status` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emailConfig` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `panel` VARCHAR(191) NOT NULL,
    `panel1` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `html_template` LONGTEXT NULL,
    `smtp_host` VARCHAR(191) NOT NULL,
    `smtp_secure` BOOLEAN NOT NULL,
    `smtp_port` INTEGER NOT NULL,
    `smtp_username` VARCHAR(191) NOT NULL,
    `smtp_password` VARCHAR(191) NOT NULL,
    `from_email` VARCHAR(191) NOT NULL,
    `from_name` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL,
    `variables` JSON NULL,
    `to` JSON NULL,
    `cc` JSON NULL,
    `bcc` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,

    INDEX `emailConfig_createdBy_idx`(`createdBy`),
    INDEX `emailConfig_updatedBy_idx`(`updatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `profilePicture` LONGTEXT NULL,
    `name` VARCHAR(191) NOT NULL,
    `uniqeId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifiedAt` DATETIME(3) NULL,
    `referralCode` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `type` VARCHAR(191) NOT NULL DEFAULT 'main',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `dateOfBirth` DATETIME(3) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `currentAddress` VARCHAR(191) NULL,
    `permanentAddress` VARCHAR(191) NULL,
    `permanentPostalCode` VARCHAR(191) NULL,
    `permanentCityId` BIGINT NULL,
    `permanentStateId` BIGINT NULL,
    `permanentCountryId` BIGINT NULL,
    `pr_token` VARCHAR(191) NULL,
    `pr_expires_at` DATETIME(3) NULL,
    `pr_last_reset` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `admin_uniqeId_key`(`uniqeId`),
    UNIQUE INDEX `admin_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shopifyStore` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NULL,
    `name` VARCHAR(191) NULL,
    `logo` LONGTEXT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `shopName` VARCHAR(191) NULL,
    `planName` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `shopOwner` VARCHAR(191) NULL,
    `domain` VARCHAR(191) NULL,
    `myshopifyDomain` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NULL,
    `moneyFormat` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL,
    `createdAtShop` DATETIME(3) NULL,
    `userId` INTEGER NULL,
    `verificationStatus` BOOLEAN NOT NULL DEFAULT true,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `shopifyStore_shop_key`(`shop`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `companyDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `brandName` VARCHAR(191) NULL,
    `brandShortName` VARCHAR(191) NULL,
    `billingAddress` VARCHAR(191) NULL,
    `billingPincode` VARCHAR(191) NULL,
    `billingCountryId` BIGINT NULL,
    `billingStateId` BIGINT NULL,
    `billingCityId` BIGINT NULL,
    `businessType` VARCHAR(191) NULL,
    `clientEntryType` VARCHAR(191) NULL,
    `gstNumber` VARCHAR(191) NULL,
    `companyPanNumber` VARCHAR(191) NULL,
    `companyPanCardName` LONGTEXT NULL,
    `companyPanCardImage` LONGTEXT NULL,
    `aadharNumber` VARCHAR(191) NULL,
    `gstDocument` VARCHAR(191) NULL,
    `panCardHolderName` VARCHAR(191) NULL,
    `aadharCardHolderName` VARCHAR(191) NULL,
    `panCardImage` LONGTEXT NULL,
    `aadharCardImage` LONGTEXT NULL,
    `additionalDocumentUpload` VARCHAR(191) NULL,
    `documentId` VARCHAR(191) NULL,
    `documentName` VARCHAR(191) NULL,
    `documentImage` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `companyDetail_adminId_key`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bankAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `accountHolderName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `bankBranch` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL,
    `ifscCode` VARCHAR(191) NOT NULL,
    `cancelledChequeImage` LONGTEXT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `bankAccount_adminId_key`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bankAccountChangeRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `bankAccountId` INTEGER NULL,
    `accountHolderName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `bankBranch` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL,
    `ifscCode` VARCHAR(191) NOT NULL,
    `cancelledChequeImage` LONGTEXT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `remarks` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `bankAccountChangeRequest_adminId_key`(`adminId`),
    UNIQUE INDEX `bankAccountChangeRequest_bankAccountId_key`(`bankAccountId`),
    INDEX `bankAccountChangeRequest_adminId_idx`(`adminId`),
    INDEX `bankAccountChangeRequest_bankAccountId_idx`(`bankAccountId`),
    INDEX `bankAccountChangeRequest_createdBy_idx`(`createdBy`),
    INDEX `bankAccountChangeRequest_updatedBy_idx`(`updatedBy`),
    INDEX `bankAccountChangeRequest_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `adminId` INTEGER NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `role_name_key`(`name`),
    INDEX `role_createdBy_idx`(`createdBy`),
    INDEX `role_updatedBy_idx`(`updatedBy`),
    INDEX `role_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `adminStaff` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `roleId` INTEGER NULL,
    `panel` VARCHAR(191) NOT NULL,
    `profilePicture` LONGTEXT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `currentAddress` VARCHAR(191) NULL,
    `permanentAddress` VARCHAR(191) NULL,
    `permanentPostalCode` VARCHAR(191) NULL,
    `permanentCityId` BIGINT NULL,
    `permanentStateId` BIGINT NULL,
    `permanentCountryId` BIGINT NULL,
    `password` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `pr_token` VARCHAR(191) NULL,
    `pr_expires_at` DATETIME(3) NULL,
    `pr_last_reset` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `adminStaff_email_key`(`email`),
    INDEX `adminStaff_admin_id_idx`(`admin_id`),
    INDEX `adminStaff_roleId_idx`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rolePermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `panel` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `rolePermission_createdBy_idx`(`createdBy`),
    INDEX `rolePermission_updatedBy_idx`(`updatedBy`),
    INDEX `rolePermission_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roleHasPermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` INTEGER NOT NULL,
    `rolePermissionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `roleHasPermission_roleId_idx`(`roleId`),
    INDEX `roleHasPermission_rolePermissionId_idx`(`rolePermissionId`),
    INDEX `roleHasPermission_createdBy_idx`(`createdBy`),
    INDEX `roleHasPermission_updatedBy_idx`(`updatedBy`),
    INDEX `roleHasPermission_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `globalPermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `panel` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loginLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `adminRole` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `response` VARCHAR(191) NULL,
    `ipv4` VARCHAR(191) NULL,
    `ipv6` VARCHAR(191) NULL,
    `internetServiceProvider` VARCHAR(191) NULL,
    `clientInformation` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `loginLog_adminId_idx`(`adminId`),
    INDEX `loginLog_adminRole_idx`(`adminRole`),
    INDEX `loginLog_action_idx`(`action`),
    INDEX `loginLog_createdAt_idx`(`createdAt`),
    INDEX `loginLog_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activityLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `adminRole` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `payload` LONGTEXT NULL,
    `response` LONGTEXT NULL,
    `result` BOOLEAN NOT NULL,
    `data` LONGTEXT NULL,
    `ipv4` VARCHAR(191) NULL,
    `ipv6` VARCHAR(191) NULL,
    `internetServiceProvider` VARCHAR(191) NULL,
    `clientInformation` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `activityLog_adminId_idx`(`adminId`),
    INDEX `activityLog_adminRole_idx`(`adminRole`),
    INDEX `activityLog_module_idx`(`module`),
    INDEX `activityLog_action_idx`(`action`),
    INDEX `activityLog_createdAt_idx`(`createdAt`),
    INDEX `activityLog_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `country` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `iso3` VARCHAR(191) NULL,
    `iso2` VARCHAR(191) NULL,
    `phonecode` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NULL,
    `currencyName` VARCHAR(191) NULL,
    `currencySymbol` VARCHAR(191) NULL,
    `nationality` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `country_createdBy_idx`(`createdBy`),
    INDEX `country_updatedBy_idx`(`updatedBy`),
    INDEX `country_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `state` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `countryId` BIGINT NOT NULL,
    `iso2` VARCHAR(191) NULL,
    `type` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `state_countryId_idx`(`countryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `city` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `stateId` BIGINT NOT NULL,
    `countryId` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `city_stateId_idx`(`stateId`),
    INDEX `city_countryId_idx`(`countryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `gst_number` VARCHAR(191) NOT NULL,
    `contact_name` VARCHAR(191) NOT NULL,
    `contact_number` VARCHAR(191) NOT NULL,
    `address_line_1` VARCHAR(191) NOT NULL,
    `address_line_2` VARCHAR(191) NULL,
    `postal_code` VARCHAR(191) NOT NULL,
    `countryId` BIGINT NULL,
    `stateId` BIGINT NULL,
    `cityId` BIGINT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `warehouse_slug_key`(`slug`),
    INDEX `warehouse_countryId_idx`(`countryId`),
    INDEX `warehouse_stateId_idx`(`stateId`),
    INDEX `warehouse_cityId_idx`(`cityId`),
    INDEX `warehouse_createdBy_idx`(`createdBy`),
    INDEX `warehouse_updatedBy_idx`(`updatedBy`),
    INDEX `warehouse_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `image` LONGTEXT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `category_slug_key`(`slug`),
    INDEX `category_createdBy_idx`(`createdBy`),
    INDEX `category_updatedBy_idx`(`updatedBy`),
    INDEX `category_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `image` LONGTEXT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `brand_slug_key`(`slug`),
    INDEX `brand_createdBy_idx`(`createdBy`),
    INDEX `brand_updatedBy_idx`(`updatedBy`),
    INDEX `brand_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `expectedPrice` INTEGER NULL,
    `expectedDailyOrders` VARCHAR(191) NULL,
    `url` LONGTEXT NULL,
    `image` LONGTEXT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shippingOwlProductId` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `main_sku` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `gallery` LONGTEXT NOT NULL,
    `imageSortingIndex` JSON NULL,
    `tags` JSON NULL,
    `brandId` INTEGER NOT NULL,
    `originCountryId` BIGINT NOT NULL,
    `hsnCode` VARCHAR(191) NULL,
    `taxRate` DOUBLE NULL,
    `rtoAddress` VARCHAR(191) NULL,
    `pickupAddress` VARCHAR(191) NULL,
    `shippingCountryId` BIGINT NOT NULL,
    `video_url` LONGTEXT NULL,
    `list_as` VARCHAR(191) NULL,
    `shipping_time` VARCHAR(191) NULL,
    `weight` DOUBLE NULL,
    `package_length` DOUBLE NULL,
    `package_width` DOUBLE NULL,
    `package_height` DOUBLE NULL,
    `chargeable_weight` DOUBLE NULL,
    `package_weight_image` LONGTEXT NULL,
    `package_length_image` LONGTEXT NULL,
    `package_width_image` LONGTEXT NULL,
    `package_height_image` LONGTEXT NULL,
    `product_detail_video` LONGTEXT NULL,
    `training_guidance_video` LONGTEXT NULL,
    `isVisibleToAll` BOOLEAN NOT NULL DEFAULT true,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `isVarientExists` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `product_shippingOwlProductId_key`(`shippingOwlProductId`),
    UNIQUE INDEX `product_slug_key`(`slug`),
    UNIQUE INDEX `product_main_sku_key`(`main_sku`),
    INDEX `product_categoryId_idx`(`categoryId`),
    INDEX `product_brandId_idx`(`brandId`),
    INDEX `product_originCountryId_idx`(`originCountryId`),
    INDEX `product_shippingCountryId_idx`(`shippingCountryId`),
    INDEX `product_createdBy_idx`(`createdBy`),
    INDEX `product_updatedBy_idx`(`updatedBy`),
    INDEX `product_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `productId` INTEGER NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `product_link` VARCHAR(191) NULL,
    `suggested_price` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `productVariant_sku_key`(`sku`),
    INDEX `productVariant_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productSupplierVisibility` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `supplierId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `productSupplierVisibility_productId_idx`(`productId`),
    INDEX `productSupplierVisibility_supplierId_idx`(`supplierId`),
    INDEX `productSupplierVisibility_createdBy_idx`(`createdBy`),
    INDEX `productSupplierVisibility_updatedBy_idx`(`updatedBy`),
    INDEX `productSupplierVisibility_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courierCompany` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `website` LONGTEXT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `flatShippingRate` INTEGER NULL,
    `rtoCharges` INTEGER NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `courierCompany_slug_key`(`slug`),
    UNIQUE INDEX `courierCompany_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `highRto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pincode` VARCHAR(191) NOT NULL,
    `countryId` BIGINT NULL,
    `stateId` BIGINT NULL,
    `cityId` BIGINT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `highRto_countryId_idx`(`countryId`),
    INDEX `highRto_stateId_idx`(`stateId`),
    INDEX `highRto_cityId_idx`(`cityId`),
    INDEX `highRto_createdBy_idx`(`createdBy`),
    INDEX `highRto_updatedBy_idx`(`updatedBy`),
    INDEX `highRto_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `badPincode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pincode` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `badPincode_createdBy_idx`(`createdBy`),
    INDEX `badPincode_updatedBy_idx`(`updatedBy`),
    INDEX `badPincode_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goodPincode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pincode` VARCHAR(191) NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `goodPincode_createdBy_idx`(`createdBy`),
    INDEX `goodPincode_updatedBy_idx`(`updatedBy`),
    INDEX `goodPincode_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplierProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplierId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `supplierProduct_supplierId_idx`(`supplierId`),
    INDEX `supplierProduct_productId_idx`(`productId`),
    INDEX `supplierProduct_createdBy_idx`(`createdBy`),
    INDEX `supplierProduct_updatedBy_idx`(`updatedBy`),
    INDEX `supplierProduct_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplierProductVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplierId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `productVariantId` INTEGER NOT NULL,
    `supplierProductId` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `stock` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `supplierProductVariant_supplierId_idx`(`supplierId`),
    INDEX `supplierProductVariant_productId_idx`(`productId`),
    INDEX `supplierProductVariant_supplierProductId_idx`(`supplierProductId`),
    INDEX `supplierProductVariant_createdBy_idx`(`createdBy`),
    INDEX `supplierProductVariant_updatedBy_idx`(`updatedBy`),
    INDEX `supplierProductVariant_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dropshipperProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shopifyProductId` VARCHAR(191) NULL,
    `shopifyStoreId` INTEGER NOT NULL,
    `dropshipperId` INTEGER NOT NULL,
    `supplierId` INTEGER NOT NULL,
    `supplierProductId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `dropshipperProduct_dropshipperId_idx`(`dropshipperId`),
    INDEX `dropshipperProduct_supplierId_idx`(`supplierId`),
    INDEX `dropshipperProduct_productId_idx`(`productId`),
    INDEX `dropshipperProduct_supplierProductId_idx`(`supplierProductId`),
    INDEX `dropshipperProduct_createdBy_idx`(`createdBy`),
    INDEX `dropshipperProduct_updatedBy_idx`(`updatedBy`),
    INDEX `dropshipperProduct_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dropshipperProductVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dropshipperId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `supplierProductId` INTEGER NOT NULL,
    `dropshipperProductId` INTEGER NOT NULL,
    `supplierProductVariantId` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `dropshipperProductVariant_dropshipperId_idx`(`dropshipperId`),
    INDEX `dropshipperProductVariant_productId_idx`(`productId`),
    INDEX `dropshipperProductVariant_supplierProductId_idx`(`supplierProductId`),
    INDEX `dropshipperProductVariant_dropshipperProductId_idx`(`dropshipperProductId`),
    INDEX `dropshipperProductVariant_createdBy_idx`(`createdBy`),
    INDEX `dropshipperProductVariant_updatedBy_idx`(`updatedBy`),
    INDEX `dropshipperProductVariant_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` VARCHAR(191) NOT NULL,
    `cycle` VARCHAR(191) NULL,
    `amount` DOUBLE NULL,
    `status` VARCHAR(191) NULL,
    `date` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `payment_transactionId_key`(`transactionId`),
    INDEX `payment_createdBy_idx`(`createdBy`),
    INDEX `payment_updatedBy_idx`(`updatedBy`),
    INDEX `payment_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(191) NOT NULL,
    `awbNumber` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `orderNote` VARCHAR(191) NULL,
    `subtotal` DOUBLE NOT NULL DEFAULT 0.0,
    `tax` DOUBLE NOT NULL DEFAULT 0.0,
    `discount` DOUBLE NOT NULL DEFAULT 0.0,
    `totalAmount` DOUBLE NOT NULL DEFAULT 0.0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `shippingName` VARCHAR(191) NOT NULL,
    `shippingPhone` VARCHAR(191) NOT NULL,
    `shippingEmail` VARCHAR(191) NOT NULL,
    `shippingAddress` VARCHAR(191) NOT NULL,
    `shippingZip` VARCHAR(191) NOT NULL,
    `shippingCountryId` BIGINT NULL,
    `shippingStateId` BIGINT NULL,
    `shippingCityId` BIGINT NULL,
    `billingName` VARCHAR(191) NOT NULL,
    `billingPhone` VARCHAR(191) NOT NULL,
    `billingEmail` VARCHAR(191) NOT NULL,
    `billingAddress` VARCHAR(191) NOT NULL,
    `billingZip` VARCHAR(191) NOT NULL,
    `billingCountryId` BIGINT NULL,
    `billingStateId` BIGINT NULL,
    `billingCityId` BIGINT NULL,
    `isPostpaid` BOOLEAN NOT NULL DEFAULT false,
    `paymentId` INTEGER NULL,
    `shippingApiResult` JSON NULL,
    `barcodeImage` LONGTEXT NULL,
    `delivered` BOOLEAN NOT NULL DEFAULT false,
    `deliveredDate` DATETIME(3) NULL,
    `rtoDelivered` BOOLEAN NOT NULL DEFAULT false,
    `rtoDeliveredDate` DATETIME(3) NULL,
    `lastRefreshAt` DATETIME(3) NULL,
    `disputeCase` INTEGER NULL,
    `supplierRTOResponse` VARCHAR(191) NULL,
    `packingGallery` LONGTEXT NULL,
    `unboxingGallery` LONGTEXT NULL,
    `collectedAtWarehouse` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `order_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `order_awbNumber_key`(`awbNumber`),
    INDEX `order_createdBy_idx`(`createdBy`),
    INDEX `order_updatedBy_idx`(`updatedBy`),
    INDEX `order_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `dropshipperProductId` INTEGER NULL,
    `dropshipperProductVariantId` INTEGER NULL,
    `dropshipperId` INTEGER NULL,
    `supplierProductId` INTEGER NULL,
    `supplierProductVariantId` INTEGER NULL,
    `supplierId` INTEGER NULL,
    `quantity` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,

    INDEX `orderItem_orderId_idx`(`orderId`),
    INDEX `orderItem_dropshipperProductId_idx`(`dropshipperProductId`),
    INDEX `orderItem_dropshipperProductVariantId_idx`(`dropshipperProductVariantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rtoInventory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `orderItemId` INTEGER NOT NULL,
    `dropshipperId` INTEGER NOT NULL,
    `dropshipperProductId` INTEGER NOT NULL,
    `dropshipperProductVariantId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `rtoInventory_orderItemId_key`(`orderItemId`),
    INDEX `rtoInventory_orderId_idx`(`orderId`),
    INDEX `rtoInventory_dropshipperId_idx`(`dropshipperId`),
    INDEX `rtoInventory_dropshipperProductId_idx`(`dropshipperProductId`),
    INDEX `rtoInventory_dropshipperProductVariantId_idx`(`dropshipperProductVariantId`),
    INDEX `rtoInventory_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplierOrderPermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNumber` BOOLEAN NOT NULL DEFAULT false,
    `awbNumber` BOOLEAN NOT NULL DEFAULT false,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `orderNote` BOOLEAN NOT NULL DEFAULT false,
    `subtotal` BOOLEAN NOT NULL DEFAULT false,
    `tax` BOOLEAN NOT NULL DEFAULT false,
    `discount` BOOLEAN NOT NULL DEFAULT false,
    `totalAmount` BOOLEAN NOT NULL DEFAULT false,
    `currency` BOOLEAN NOT NULL DEFAULT false,
    `shippingName` BOOLEAN NOT NULL DEFAULT false,
    `shippingPhone` BOOLEAN NOT NULL DEFAULT false,
    `shippingEmail` BOOLEAN NOT NULL DEFAULT false,
    `shippingAddress` BOOLEAN NOT NULL DEFAULT false,
    `shippingZip` BOOLEAN NOT NULL DEFAULT false,
    `shippingCountry` BOOLEAN NOT NULL DEFAULT false,
    `shippingState` BOOLEAN NOT NULL DEFAULT false,
    `shippingCity` BOOLEAN NOT NULL DEFAULT false,
    `billingName` BOOLEAN NOT NULL DEFAULT false,
    `billingPhone` BOOLEAN NOT NULL DEFAULT false,
    `billingEmail` BOOLEAN NOT NULL DEFAULT false,
    `billingAddress` BOOLEAN NOT NULL DEFAULT false,
    `billingZip` BOOLEAN NOT NULL DEFAULT false,
    `billingCountry` BOOLEAN NOT NULL DEFAULT false,
    `billingState` BOOLEAN NOT NULL DEFAULT false,
    `billingCity` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `raiseTicket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dropshipperId` INTEGER NOT NULL,
    `ticketNumber` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `gallery` LONGTEXT NOT NULL,
    `status` BOOLEAN NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,
    `responseBy` INTEGER NULL,
    `responseAt` DATETIME(3) NULL,
    `responseByRole` VARCHAR(191) NULL,

    UNIQUE INDEX `raiseTicket_ticketNumber_key`(`ticketNumber`),
    INDEX `raiseTicket_dropshipperId_idx`(`dropshipperId`),
    INDEX `raiseTicket_createdBy_idx`(`createdBy`),
    INDEX `raiseTicket_updatedBy_idx`(`updatedBy`),
    INDEX `raiseTicket_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticketOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `raiseTicketId` INTEGER NOT NULL,
    `orderId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` INTEGER NULL,
    `createdByRole` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,
    `updatedByRole` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` INTEGER NULL,
    `deletedByRole` VARCHAR(191) NULL,

    INDEX `ticketOrder_raiseTicketId_idx`(`raiseTicketId`),
    INDEX `ticketOrder_orderId_idx`(`orderId`),
    INDEX `ticketOrder_createdBy_idx`(`createdBy`),
    INDEX `ticketOrder_updatedBy_idx`(`updatedBy`),
    INDEX `ticketOrder_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin` ADD CONSTRAINT `admin_permanentCityId_fkey` FOREIGN KEY (`permanentCityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin` ADD CONSTRAINT `admin_permanentStateId_fkey` FOREIGN KEY (`permanentStateId`) REFERENCES `state`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin` ADD CONSTRAINT `admin_permanentCountryId_fkey` FOREIGN KEY (`permanentCountryId`) REFERENCES `country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shopifyStore` ADD CONSTRAINT `shopifyStore_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companyDetail` ADD CONSTRAINT `companyDetail_billingCountryId_fkey` FOREIGN KEY (`billingCountryId`) REFERENCES `country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companyDetail` ADD CONSTRAINT `companyDetail_billingStateId_fkey` FOREIGN KEY (`billingStateId`) REFERENCES `state`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companyDetail` ADD CONSTRAINT `companyDetail_billingCityId_fkey` FOREIGN KEY (`billingCityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `companyDetail` ADD CONSTRAINT `admin_company_detail_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bankAccount` ADD CONSTRAINT `admin_bank_account_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bankAccountChangeRequest` ADD CONSTRAINT `admin_bank_account_change_request_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bankAccountChangeRequest` ADD CONSTRAINT `bankAccountChangeRequest_bankAccountId_fkey` FOREIGN KEY (`bankAccountId`) REFERENCES `bankAccount`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role` ADD CONSTRAINT `role_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adminStaff` ADD CONSTRAINT `adminStaff_permanentCityId_fkey` FOREIGN KEY (`permanentCityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adminStaff` ADD CONSTRAINT `adminStaff_permanentStateId_fkey` FOREIGN KEY (`permanentStateId`) REFERENCES `state`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adminStaff` ADD CONSTRAINT `adminStaff_permanentCountryId_fkey` FOREIGN KEY (`permanentCountryId`) REFERENCES `country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adminStaff` ADD CONSTRAINT `adminStaff_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `adminStaff` ADD CONSTRAINT `adminStaff_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roleHasPermission` ADD CONSTRAINT `roleHasPermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roleHasPermission` ADD CONSTRAINT `roleHasPermission_rolePermissionId_fkey` FOREIGN KEY (`rolePermissionId`) REFERENCES `rolePermission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `state` ADD CONSTRAINT `state_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `city` ADD CONSTRAINT `city_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `state`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `city` ADD CONSTRAINT `city_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse` ADD CONSTRAINT `warehouse_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse` ADD CONSTRAINT `warehouse_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `state`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse` ADD CONSTRAINT `warehouse_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productRequest` ADD CONSTRAINT `productRequest_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_originCountryId_fkey` FOREIGN KEY (`originCountryId`) REFERENCES `country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_shippingCountryId_fkey` FOREIGN KEY (`shippingCountryId`) REFERENCES `country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productVariant` ADD CONSTRAINT `productVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productSupplierVisibility` ADD CONSTRAINT `productSupplierVisibility_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productSupplierVisibility` ADD CONSTRAINT `productSupplierVisibility_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `highRto` ADD CONSTRAINT `highRto_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `highRto` ADD CONSTRAINT `highRto_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `state`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `highRto` ADD CONSTRAINT `highRto_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplierProduct` ADD CONSTRAINT `supplierProduct_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplierProduct` ADD CONSTRAINT `supplierProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplierProductVariant` ADD CONSTRAINT `admin_supplier_product_variant_fkey` FOREIGN KEY (`supplierId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplierProductVariant` ADD CONSTRAINT `supplierProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplierProductVariant` ADD CONSTRAINT `supplierProductVariant_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `productVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplierProductVariant` ADD CONSTRAINT `supplierProductVariant_supplierProductId_fkey` FOREIGN KEY (`supplierProductId`) REFERENCES `supplierProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProduct` ADD CONSTRAINT `dropshipperProduct_dropshipperId_fkey` FOREIGN KEY (`dropshipperId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProduct` ADD CONSTRAINT `dropshipperProduct_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProduct` ADD CONSTRAINT `dropshipperProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProduct` ADD CONSTRAINT `dropshipperProduct_supplierProductId_fkey` FOREIGN KEY (`supplierProductId`) REFERENCES `supplierProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProduct` ADD CONSTRAINT `dropshipperProduct_shopifyStoreId_fkey` FOREIGN KEY (`shopifyStoreId`) REFERENCES `shopifyStore`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProductVariant` ADD CONSTRAINT `admin_dropshipper_product_variant_fkey` FOREIGN KEY (`dropshipperId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProductVariant` ADD CONSTRAINT `dropshipperProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProductVariant` ADD CONSTRAINT `dropshipperProductVariant_supplierProductId_fkey` FOREIGN KEY (`supplierProductId`) REFERENCES `supplierProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProductVariant` ADD CONSTRAINT `dropshipperProductVariant_dropshipperProductId_fkey` FOREIGN KEY (`dropshipperProductId`) REFERENCES `dropshipperProduct`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dropshipperProductVariant` ADD CONSTRAINT `dropshipperProductVariant_supplierProductVariantId_fkey` FOREIGN KEY (`supplierProductVariantId`) REFERENCES `supplierProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_shippingCountryId_fkey` FOREIGN KEY (`shippingCountryId`) REFERENCES `country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_shippingStateId_fkey` FOREIGN KEY (`shippingStateId`) REFERENCES `state`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_shippingCityId_fkey` FOREIGN KEY (`shippingCityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_billingCountryId_fkey` FOREIGN KEY (`billingCountryId`) REFERENCES `country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_billingStateId_fkey` FOREIGN KEY (`billingStateId`) REFERENCES `state`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_billingCityId_fkey` FOREIGN KEY (`billingCityId`) REFERENCES `city`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_dropshipperProductId_fkey` FOREIGN KEY (`dropshipperProductId`) REFERENCES `dropshipperProduct`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_dropshipperProductVariantId_fkey` FOREIGN KEY (`dropshipperProductVariantId`) REFERENCES `dropshipperProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_dropshipperId_fkey` FOREIGN KEY (`dropshipperId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_supplierProductId_fkey` FOREIGN KEY (`supplierProductId`) REFERENCES `supplierProduct`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_supplierProductVariantId_fkey` FOREIGN KEY (`supplierProductVariantId`) REFERENCES `supplierProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderItem` ADD CONSTRAINT `orderItem_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rtoInventory` ADD CONSTRAINT `rtoInventory_dropshipperId_fkey` FOREIGN KEY (`dropshipperId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rtoInventory` ADD CONSTRAINT `rtoInventory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rtoInventory` ADD CONSTRAINT `rtoInventory_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `orderItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rtoInventory` ADD CONSTRAINT `rtoInventory_dropshipperProductId_fkey` FOREIGN KEY (`dropshipperProductId`) REFERENCES `dropshipperProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rtoInventory` ADD CONSTRAINT `rtoInventory_dropshipperProductVariantId_fkey` FOREIGN KEY (`dropshipperProductVariantId`) REFERENCES `dropshipperProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raiseTicket` ADD CONSTRAINT `raiseTicket_responseBy_fkey` FOREIGN KEY (`responseBy`) REFERENCES `admin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `raiseTicket` ADD CONSTRAINT `raiseTicket_dropshipperId_fkey` FOREIGN KEY (`dropshipperId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticketOrder` ADD CONSTRAINT `ticketOrder_raiseTicketId_fkey` FOREIGN KEY (`raiseTicketId`) REFERENCES `raiseTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticketOrder` ADD CONSTRAINT `ticketOrder_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
