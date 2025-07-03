-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 03, 2025 at 03:41 PM
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
-- Database: `locations`
--

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `id` mediumint(8) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `iso3` char(3) DEFAULT NULL,
  `iso2` char(2) DEFAULT NULL,
  `phonecode` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `currencyName` varchar(255) DEFAULT NULL,
  `currencySymbol` varchar(255) DEFAULT NULL,
  `nationality` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`id`, `name`, `iso3`, `iso2`, `phonecode`, `currency`, `currencyName`, `currencySymbol`, `nationality`) VALUES
(1, 'Afghanistan', 'AFG', 'AF', '93', 'AFN', 'Afghan afghani', '؋', 'Afghan'),
(2, 'Aland Islands', 'ALA', 'AX', '358', 'EUR', 'Euro', '€', 'Aland Island'),
(3, 'Albania', 'ALB', 'AL', '355', 'ALL', 'Albanian lek', 'Lek', 'Albanian '),
(4, 'Algeria', 'DZA', 'DZ', '213', 'DZD', 'Algerian dinar', 'دج', 'Algerian'),
(5, 'American Samoa', 'ASM', 'AS', '1', 'USD', 'United States dollar', '$', 'American Samoan'),
(6, 'Andorra', 'AND', 'AD', '376', 'EUR', 'Euro', '€', 'Andorran'),
(7, 'Angola', 'AGO', 'AO', '244', 'AOA', 'Angolan kwanza', 'Kz', 'Angolan'),
(8, 'Anguilla', 'AIA', 'AI', '1', 'XCD', 'Eastern Caribbean dollar', '$', 'Anguillan'),
(9, 'Antarctica', 'ATA', 'AQ', '672', 'AAD', 'Antarctican dollar', '$', 'Antarctic'),
(10, 'Antigua and Barbuda', 'ATG', 'AG', '1', 'XCD', 'Eastern Caribbean dollar', '$', 'Antiguan or Barbudan'),
(11, 'Argentina', 'ARG', 'AR', '54', 'ARS', 'Argentine peso', '$', 'Argentine'),
(12, 'Armenia', 'ARM', 'AM', '374', 'AMD', 'Armenian dram', '֏', 'Armenian'),
(13, 'Aruba', 'ABW', 'AW', '297', 'AWG', 'Aruban florin', 'ƒ', 'Aruban'),
(14, 'Australia', 'AUS', 'AU', '61', 'AUD', 'Australian dollar', '$', 'Australian'),
(15, 'Austria', 'AUT', 'AT', '43', 'EUR', 'Euro', '€', 'Austrian'),
(16, 'Azerbaijan', 'AZE', 'AZ', '994', 'AZN', 'Azerbaijani manat', 'm', 'Azerbaijani, Azeri'),
(17, 'The Bahamas', 'BHS', 'BS', '1', 'BSD', 'Bahamian dollar', 'B$', 'Bahamian'),
(18, 'Bahrain', 'BHR', 'BH', '973', 'BHD', 'Bahraini dinar', '.د.ب', 'Bahraini'),
(19, 'Bangladesh', 'BGD', 'BD', '880', 'BDT', 'Bangladeshi taka', '৳', 'Bangladeshi'),
(20, 'Barbados', 'BRB', 'BB', '1', 'BBD', 'Barbadian dollar', 'Bds$', 'Barbadian'),
(21, 'Belarus', 'BLR', 'BY', '375', 'BYN', 'Belarusian ruble', 'Br', 'Belarusian'),
(22, 'Belgium', 'BEL', 'BE', '32', 'EUR', 'Euro', '€', 'Belgian'),
(23, 'Belize', 'BLZ', 'BZ', '501', 'BZD', 'Belize dollar', '$', 'Belizean'),
(24, 'Benin', 'BEN', 'BJ', '229', 'XOF', 'West African CFA franc', 'CFA', 'Beninese, Beninois'),
(25, 'Bermuda', 'BMU', 'BM', '1', 'BMD', 'Bermudian dollar', '$', 'Bermudian, Bermudan'),
(26, 'Bhutan', 'BTN', 'BT', '975', 'BTN', 'Bhutanese ngultrum', 'Nu.', 'Bhutanese'),
(27, 'Bolivia', 'BOL', 'BO', '591', 'BOB', 'Bolivian boliviano', 'Bs.', 'Bolivian'),
(28, 'Bosnia and Herzegovina', 'BIH', 'BA', '387', 'BAM', 'Bosnia and Herzegovina convertible mark', 'KM', 'Bosnian or Herzegovinian'),
(29, 'Botswana', 'BWA', 'BW', '267', 'BWP', 'Botswana pula', 'P', 'Motswana, Botswanan'),
(30, 'Bouvet Island', 'BVT', 'BV', '0055', 'NOK', 'Norwegian krone', 'ko', 'Bouvet Island'),
(31, 'Brazil', 'BRA', 'BR', '55', 'BRL', 'Brazilian real', 'R$', 'Brazilian'),
(32, 'British Indian Ocean Territory', 'IOT', 'IO', '246', 'USD', 'United States dollar', '$', 'BIOT'),
(33, 'Brunei', 'BRN', 'BN', '673', 'BND', 'Brunei dollar', 'B$', 'Bruneian'),
(34, 'Bulgaria', 'BGR', 'BG', '359', 'BGN', 'Bulgarian lev', 'Лв.', 'Bulgarian'),
(35, 'Burkina Faso', 'BFA', 'BF', '226', 'XOF', 'West African CFA franc', 'CFA', 'Burkinabe'),
(36, 'Burundi', 'BDI', 'BI', '257', 'BIF', 'Burundian franc', 'FBu', 'Burundian'),
(37, 'Cambodia', 'KHM', 'KH', '855', 'KHR', 'Cambodian riel', 'KHR', 'Cambodian'),
(38, 'Cameroon', 'CMR', 'CM', '237', 'XAF', 'Central African CFA franc', 'FCFA', 'Cameroonian'),
(39, 'Canada', 'CAN', 'CA', '1', 'CAD', 'Canadian dollar', '$', 'Canadian'),
(40, 'Cape Verde', 'CPV', 'CV', '238', 'CVE', 'Cape Verdean escudo', '$', 'Verdean'),
(41, 'Cayman Islands', 'CYM', 'KY', '1', 'KYD', 'Cayman Islands dollar', '$', 'Caymanian'),
(42, 'Central African Republic', 'CAF', 'CF', '236', 'XAF', 'Central African CFA franc', 'FCFA', 'Central African'),
(43, 'Chad', 'TCD', 'TD', '235', 'XAF', 'Central African CFA franc', 'FCFA', 'Chadian'),
(44, 'Chile', 'CHL', 'CL', '56', 'CLP', 'Chilean peso', '$', 'Chilean'),
(45, 'China', 'CHN', 'CN', '86', 'CNY', 'Chinese yuan', '¥', 'Chinese'),
(46, 'Christmas Island', 'CXR', 'CX', '61', 'AUD', 'Australian dollar', '$', 'Christmas Island'),
(47, 'Cocos (Keeling) Islands', 'CCK', 'CC', '61', 'AUD', 'Australian dollar', '$', 'Cocos Island'),
(48, 'Colombia', 'COL', 'CO', '57', 'COP', 'Colombian peso', '$', 'Colombian'),
(49, 'Comoros', 'COM', 'KM', '269', 'KMF', 'Comorian franc', 'CF', 'Comoran, Comorian'),
(50, 'Congo', 'COG', 'CG', '242', 'XAF', 'Congolese Franc', 'CDF', 'Congolese'),
(51, 'Democratic Republic of the Congo', 'COD', 'CD', '243', 'CDF', 'Congolese Franc', 'FC', 'Congolese'),
(52, 'Cook Islands', 'COK', 'CK', '682', 'NZD', 'New Zealand dollar', '$', 'Cook Island'),
(53, 'Costa Rica', 'CRI', 'CR', '506', 'CRC', 'Costa Rican colón', '₡', 'Costa Rican'),
(54, 'Cote D\'Ivoire (Ivory Coast)', 'CIV', 'CI', '225', 'XOF', 'West African CFA franc', 'CFA', 'Ivorian'),
(55, 'Croatia', 'HRV', 'HR', '385', 'EUR', 'Euro', '€', 'Croatian'),
(56, 'Cuba', 'CUB', 'CU', '53', 'CUP', 'Cuban peso', '$', 'Cuban'),
(57, 'Cyprus', 'CYP', 'CY', '357', 'EUR', 'Euro', '€', 'Cypriot'),
(58, 'Czech Republic', 'CZE', 'CZ', '420', 'CZK', 'Czech koruna', 'Kč', 'Czech'),
(59, 'Denmark', 'DNK', 'DK', '45', 'DKK', 'Danish krone', 'Kr.', 'Danish'),
(60, 'Djibouti', 'DJI', 'DJ', '253', 'DJF', 'Djiboutian franc', 'Fdj', 'Djiboutian'),
(61, 'Dominica', 'DMA', 'DM', '1', 'XCD', 'Eastern Caribbean dollar', '$', 'Dominican'),
(62, 'Dominican Republic', 'DOM', 'DO', '1', 'DOP', 'Dominican peso', '$', 'Dominican'),
(63, 'Timor-Leste', 'TLS', 'TL', '670', 'USD', 'United States dollar', '$', 'Timorese'),
(64, 'Ecuador', 'ECU', 'EC', '593', 'USD', 'United States dollar', '$', 'Ecuadorian'),
(65, 'Egypt', 'EGY', 'EG', '20', 'EGP', 'Egyptian pound', 'ج.م', 'Egyptian'),
(66, 'El Salvador', 'SLV', 'SV', '503', 'USD', 'United States dollar', '$', 'Salvadoran'),
(67, 'Equatorial Guinea', 'GNQ', 'GQ', '240', 'XAF', 'Central African CFA franc', 'FCFA', 'Equatorial Guinean, Equatoguinean'),
(68, 'Eritrea', 'ERI', 'ER', '291', 'ERN', 'Eritrean nakfa', 'Nfk', 'Eritrean'),
(69, 'Estonia', 'EST', 'EE', '372', 'EUR', 'Euro', '€', 'Estonian'),
(70, 'Ethiopia', 'ETH', 'ET', '251', 'ETB', 'Ethiopian birr', 'Nkf', 'Ethiopian'),
(71, 'Falkland Islands', 'FLK', 'FK', '500', 'FKP', 'Falkland Islands pound', '£', 'Falkland Island'),
(72, 'Faroe Islands', 'FRO', 'FO', '298', 'DKK', 'Danish krone', 'Kr.', 'Faroese'),
(73, 'Fiji Islands', 'FJI', 'FJ', '679', 'FJD', 'Fijian dollar', 'FJ$', 'Fijian'),
(74, 'Finland', 'FIN', 'FI', '358', 'EUR', 'Euro', '€', 'Finnish'),
(75, 'France', 'FRA', 'FR', '33', 'EUR', 'Euro', '€', 'French'),
(76, 'French Guiana', 'GUF', 'GF', '594', 'EUR', 'Euro', '€', 'French Guianese'),
(77, 'French Polynesia', 'PYF', 'PF', '689', 'XPF', 'CFP franc', '₣', 'French Polynesia'),
(78, 'French Southern Territories', 'ATF', 'TF', '262', 'EUR', 'Euro', '€', 'French Southern Territories'),
(79, 'Gabon', 'GAB', 'GA', '241', 'XAF', 'Central African CFA franc', 'FCFA', 'Gabonese'),
(80, 'The Gambia ', 'GMB', 'GM', '220', 'GMD', 'Gambian dalasi', 'D', 'Gambian'),
(81, 'Georgia', 'GEO', 'GE', '995', 'GEL', 'Georgian lari', 'ლ', 'Georgian'),
(82, 'Germany', 'DEU', 'DE', '49', 'EUR', 'Euro', '€', 'German'),
(83, 'Ghana', 'GHA', 'GH', '233', 'GHS', 'Ghanaian cedi', 'GH₵', 'Ghanaian'),
(84, 'Gibraltar', 'GIB', 'GI', '350', 'GIP', 'Gibraltar pound', '£', 'Gibraltar'),
(85, 'Greece', 'GRC', 'GR', '30', 'EUR', 'Euro', '€', 'Greek, Hellenic'),
(86, 'Greenland', 'GRL', 'GL', '299', 'DKK', 'Danish krone', 'Kr.', 'Greenlandic'),
(87, 'Grenada', 'GRD', 'GD', '1', 'XCD', 'Eastern Caribbean dollar', '$', 'Grenadian'),
(88, 'Guadeloupe', 'GLP', 'GP', '590', 'EUR', 'Euro', '€', 'Guadeloupe'),
(89, 'Guam', 'GUM', 'GU', '1', 'USD', 'United States dollar', '$', 'Guamanian, Guambat'),
(90, 'Guatemala', 'GTM', 'GT', '502', 'GTQ', 'Guatemalan quetzal', 'Q', 'Guatemalan'),
(91, 'Guernsey', 'GGY', 'GG', '44', 'GBP', 'British pound', '£', 'Channel Island'),
(92, 'Guinea', 'GIN', 'GN', '224', 'GNF', 'Guinean franc', 'FG', 'Guinean'),
(93, 'Guinea-Bissau', 'GNB', 'GW', '245', 'XOF', 'West African CFA franc', 'CFA', 'Bissau-Guinean'),
(94, 'Guyana', 'GUY', 'GY', '592', 'GYD', 'Guyanese dollar', '$', 'Guyanese'),
(95, 'Haiti', 'HTI', 'HT', '509', 'HTG', 'Haitian gourde', 'G', 'Haitian'),
(96, 'Heard Island and McDonald Islands', 'HMD', 'HM', '672', 'AUD', 'Australian dollar', '$', 'Heard Island or McDonald Islands'),
(97, 'Honduras', 'HND', 'HN', '504', 'HNL', 'Honduran lempira', 'L', 'Honduran'),
(98, 'Hong Kong S.A.R.', 'HKG', 'HK', '852', 'HKD', 'Hong Kong dollar', '$', 'Hong Kong, Hong Kongese'),
(99, 'Hungary', 'HUN', 'HU', '36', 'HUF', 'Hungarian forint', 'Ft', 'Hungarian, Magyar'),
(100, 'Iceland', 'ISL', 'IS', '354', 'ISK', 'Icelandic króna', 'ko', 'Icelandic'),
(101, 'India', 'IND', 'IN', '91', 'INR', 'Indian rupee', '₹', 'Indian'),
(102, 'Indonesia', 'IDN', 'ID', '62', 'IDR', 'Indonesian rupiah', 'Rp', 'Indonesian'),
(103, 'Iran', 'IRN', 'IR', '98', 'IRR', 'Iranian rial', '﷼', 'Iranian, Persian'),
(104, 'Iraq', 'IRQ', 'IQ', '964', 'IQD', 'Iraqi dinar', 'د.ع', 'Iraqi'),
(105, 'Ireland', 'IRL', 'IE', '353', 'EUR', 'Euro', '€', 'Irish'),
(106, 'Israel', 'ISR', 'IL', '972', 'ILS', 'Israeli new shekel', '₪', 'Israeli'),
(107, 'Italy', 'ITA', 'IT', '39', 'EUR', 'Euro', '€', 'Italian'),
(108, 'Jamaica', 'JAM', 'JM', '1', 'JMD', 'Jamaican dollar', 'J$', 'Jamaican'),
(109, 'Japan', 'JPN', 'JP', '81', 'JPY', 'Japanese yen', '¥', 'Japanese'),
(110, 'Jersey', 'JEY', 'JE', '44', 'GBP', 'British pound', '£', 'Channel Island'),
(111, 'Jordan', 'JOR', 'JO', '962', 'JOD', 'Jordanian dinar', 'ا.د', 'Jordanian'),
(112, 'Kazakhstan', 'KAZ', 'KZ', '7', 'KZT', 'Kazakhstani tenge', 'лв', 'Kazakhstani, Kazakh'),
(113, 'Kenya', 'KEN', 'KE', '254', 'KES', 'Kenyan shilling', 'KSh', 'Kenyan'),
(114, 'Kiribati', 'KIR', 'KI', '686', 'AUD', 'Australian dollar', '$', 'I-Kiribati'),
(115, 'North Korea', 'PRK', 'KP', '850', 'KPW', 'North Korean Won', '₩', 'North Korean'),
(116, 'South Korea', 'KOR', 'KR', '82', 'KRW', 'Won', '₩', 'South Korean'),
(117, 'Kuwait', 'KWT', 'KW', '965', 'KWD', 'Kuwaiti dinar', 'ك.د', 'Kuwaiti'),
(118, 'Kyrgyzstan', 'KGZ', 'KG', '996', 'KGS', 'Kyrgyzstani som', 'лв', 'Kyrgyzstani, Kyrgyz, Kirgiz, Kirghiz'),
(119, 'Laos', 'LAO', 'LA', '856', 'LAK', 'Lao kip', '₭', 'Lao, Laotian'),
(120, 'Latvia', 'LVA', 'LV', '371', 'EUR', 'Euro', '€', 'Latvian'),
(121, 'Lebanon', 'LBN', 'LB', '961', 'LBP', 'Lebanese pound', '£', 'Lebanese'),
(122, 'Lesotho', 'LSO', 'LS', '266', 'LSL', 'Lesotho loti', 'L', 'Basotho'),
(123, 'Liberia', 'LBR', 'LR', '231', 'LRD', 'Liberian dollar', '$', 'Liberian'),
(124, 'Libya', 'LBY', 'LY', '218', 'LYD', 'Libyan dinar', 'د.ل', 'Libyan'),
(125, 'Liechtenstein', 'LIE', 'LI', '423', 'CHF', 'Swiss franc', 'CHf', 'Liechtenstein'),
(126, 'Lithuania', 'LTU', 'LT', '370', 'EUR', 'Euro', '€', 'Lithuanian'),
(127, 'Luxembourg', 'LUX', 'LU', '352', 'EUR', 'Euro', '€', 'Luxembourg, Luxembourgish'),
(128, 'Macau S.A.R.', 'MAC', 'MO', '853', 'MOP', 'Macanese pataca', '$', 'Macanese, Chinese'),
(129, 'North Macedonia', 'MKD', 'MK', '389', 'MKD', 'Denar', 'ден', 'Macedonian'),
(130, 'Madagascar', 'MDG', 'MG', '261', 'MGA', 'Malagasy ariary', 'Ar', 'Malagasy'),
(131, 'Malawi', 'MWI', 'MW', '265', 'MWK', 'Malawian kwacha', 'MK', 'Malawian'),
(132, 'Malaysia', 'MYS', 'MY', '60', 'MYR', 'Malaysian ringgit', 'RM', 'Malaysian'),
(133, 'Maldives', 'MDV', 'MV', '960', 'MVR', 'Maldivian rufiyaa', 'Rf', 'Maldivian'),
(134, 'Mali', 'MLI', 'ML', '223', 'XOF', 'West African CFA franc', 'CFA', 'Malian, Malinese'),
(135, 'Malta', 'MLT', 'MT', '356', 'EUR', 'Euro', '€', 'Maltese'),
(136, 'Man (Isle of)', 'IMN', 'IM', '44', 'GBP', 'British pound', '£', 'Manx'),
(137, 'Marshall Islands', 'MHL', 'MH', '692', 'USD', 'United States dollar', '$', 'Marshallese'),
(138, 'Martinique', 'MTQ', 'MQ', '596', 'EUR', 'Euro', '€', 'Martiniquais, Martinican'),
(139, 'Mauritania', 'MRT', 'MR', '222', 'MRU', 'Mauritanian ouguiya', 'UM', 'Mauritanian'),
(140, 'Mauritius', 'MUS', 'MU', '230', 'MUR', 'Mauritian rupee', '₨', 'Mauritian'),
(141, 'Mayotte', 'MYT', 'YT', '262', 'EUR', 'Euro', '€', 'Mahoran'),
(142, 'Mexico', 'MEX', 'MX', '52', 'MXN', 'Mexican peso', '$', 'Mexican'),
(143, 'Micronesia', 'FSM', 'FM', '691', 'USD', 'United States dollar', '$', 'Micronesian'),
(144, 'Moldova', 'MDA', 'MD', '373', 'MDL', 'Moldovan leu', 'L', 'Moldovan'),
(145, 'Monaco', 'MCO', 'MC', '377', 'EUR', 'Euro', '€', 'Monegasque, Monacan'),
(146, 'Mongolia', 'MNG', 'MN', '976', 'MNT', 'Mongolian tögrög', '₮', 'Mongolian'),
(147, 'Montenegro', 'MNE', 'ME', '382', 'EUR', 'Euro', '€', 'Montenegrin'),
(148, 'Montserrat', 'MSR', 'MS', '1', 'XCD', 'Eastern Caribbean dollar', '$', 'Montserratian'),
(149, 'Morocco', 'MAR', 'MA', '212', 'MAD', 'Moroccan dirham', 'DH', 'Moroccan'),
(150, 'Mozambique', 'MOZ', 'MZ', '258', 'MZN', 'Mozambican metical', 'MT', 'Mozambican'),
(151, 'Myanmar', 'MMR', 'MM', '95', 'MMK', 'Burmese kyat', 'K', 'Burmese'),
(152, 'Namibia', 'NAM', 'NA', '264', 'NAD', 'Namibian dollar', '$', 'Namibian'),
(153, 'Nauru', 'NRU', 'NR', '674', 'AUD', 'Australian dollar', '$', 'Nauruan'),
(154, 'Nepal', 'NPL', 'NP', '977', 'NPR', 'Nepalese rupee', '₨', 'Nepali, Nepalese'),
(155, 'Bonaire, Sint Eustatius and Saba', 'BES', 'BQ', '599', 'USD', 'United States dollar', '$', 'Bonaire'),
(156, 'Netherlands', 'NLD', 'NL', '31', 'EUR', 'Euro', '€', 'Dutch, Netherlandic'),
(157, 'New Caledonia', 'NCL', 'NC', '687', 'XPF', 'CFP franc', '₣', 'New Caledonian'),
(158, 'New Zealand', 'NZL', 'NZ', '64', 'NZD', 'New Zealand dollar', '$', 'New Zealand, NZ'),
(159, 'Nicaragua', 'NIC', 'NI', '505', 'NIO', 'Nicaraguan córdoba', 'C$', 'Nicaraguan'),
(160, 'Niger', 'NER', 'NE', '227', 'XOF', 'West African CFA franc', 'CFA', 'Nigerien'),
(161, 'Nigeria', 'NGA', 'NG', '234', 'NGN', 'Nigerian naira', '₦', 'Nigerian'),
(162, 'Niue', 'NIU', 'NU', '683', 'NZD', 'New Zealand dollar', '$', 'Niuean'),
(163, 'Norfolk Island', 'NFK', 'NF', '672', 'AUD', 'Australian dollar', '$', 'Norfolk Island'),
(164, 'Northern Mariana Islands', 'MNP', 'MP', '1', 'USD', 'United States dollar', '$', 'Northern Marianan'),
(165, 'Norway', 'NOR', 'NO', '47', 'NOK', 'Norwegian krone', 'ko', 'Norwegian'),
(166, 'Oman', 'OMN', 'OM', '968', 'OMR', 'Omani rial', '.ع.ر', 'Omani'),
(167, 'Pakistan', 'PAK', 'PK', '92', 'PKR', 'Pakistani rupee', '₨', 'Pakistani'),
(168, 'Palau', 'PLW', 'PW', '680', 'USD', 'United States dollar', '$', 'Palauan'),
(169, 'Palestinian Territory Occupied', 'PSE', 'PS', '970', 'ILS', 'Israeli new shekel', '₪', 'Palestinian'),
(170, 'Panama', 'PAN', 'PA', '507', 'PAB', 'Panamanian balboa', 'B/.', 'Panamanian'),
(171, 'Papua New Guinea', 'PNG', 'PG', '675', 'PGK', 'Papua New Guinean kina', 'K', 'Papua New Guinean, Papuan'),
(172, 'Paraguay', 'PRY', 'PY', '595', 'PYG', 'Paraguayan guarani', '₲', 'Paraguayan'),
(173, 'Peru', 'PER', 'PE', '51', 'PEN', 'Peruvian sol', 'S/.', 'Peruvian'),
(174, 'Philippines', 'PHL', 'PH', '63', 'PHP', 'Philippine peso', '₱', 'Philippine, Filipino'),
(175, 'Pitcairn Island', 'PCN', 'PN', '870', 'NZD', 'New Zealand dollar', '$', 'Pitcairn Island'),
(176, 'Poland', 'POL', 'PL', '48', 'PLN', 'Polish złoty', 'zł', 'Polish'),
(177, 'Portugal', 'PRT', 'PT', '351', 'EUR', 'Euro', '€', 'Portuguese'),
(178, 'Puerto Rico', 'PRI', 'PR', '1', 'USD', 'United States dollar', '$', 'Puerto Rican'),
(179, 'Qatar', 'QAT', 'QA', '974', 'QAR', 'Qatari riyal', 'ق.ر', 'Qatari'),
(180, 'Reunion', 'REU', 'RE', '262', 'EUR', 'Euro', '€', 'Reunionese, Reunionnais'),
(181, 'Romania', 'ROU', 'RO', '40', 'RON', 'Romanian leu', 'lei', 'Romanian'),
(182, 'Russia', 'RUS', 'RU', '7', 'RUB', 'Russian ruble', '₽', 'Russian'),
(183, 'Rwanda', 'RWA', 'RW', '250', 'RWF', 'Rwandan franc', 'FRw', 'Rwandan'),
(184, 'Saint Helena', 'SHN', 'SH', '290', 'SHP', 'Saint Helena pound', '£', 'Saint Helenian'),
(185, 'Saint Kitts and Nevis', 'KNA', 'KN', '1', 'XCD', 'Eastern Caribbean dollar', '$', 'Kittitian or Nevisian'),
(186, 'Saint Lucia', 'LCA', 'LC', '1', 'XCD', 'Eastern Caribbean dollar', '$', 'Saint Lucian'),
(187, 'Saint Pierre and Miquelon', 'SPM', 'PM', '508', 'EUR', 'Euro', '€', 'Saint-Pierrais or Miquelonnais'),
(188, 'Saint Vincent and the Grenadines', 'VCT', 'VC', '1', 'XCD', 'Eastern Caribbean dollar', '$', 'Saint Vincentian, Vincentian'),
(189, 'Saint-Barthelemy', 'BLM', 'BL', '590', 'EUR', 'Euro', '€', 'Barthelemois'),
(190, 'Saint-Martin (French part)', 'MAF', 'MF', '590', 'EUR', 'Euro', '€', 'Saint-Martinoise'),
(191, 'Samoa', 'WSM', 'WS', '685', 'WST', 'Samoan tālā', 'SAT', 'Samoan'),
(192, 'San Marino', 'SMR', 'SM', '378', 'EUR', 'Euro', '€', 'Sammarinese'),
(193, 'Sao Tome and Principe', 'STP', 'ST', '239', 'STN', 'Dobra', 'Db', 'Sao Tomean'),
(194, 'Saudi Arabia', 'SAU', 'SA', '966', 'SAR', 'Saudi riyal', '﷼', 'Saudi, Saudi Arabian'),
(195, 'Senegal', 'SEN', 'SN', '221', 'XOF', 'West African CFA franc', 'CFA', 'Senegalese'),
(196, 'Serbia', 'SRB', 'RS', '381', 'RSD', 'Serbian dinar', 'din', 'Serbian'),
(197, 'Seychelles', 'SYC', 'SC', '248', 'SCR', 'Seychellois rupee', 'SRe', 'Seychellois'),
(198, 'Sierra Leone', 'SLE', 'SL', '232', 'SLL', 'Sierra Leonean leone', 'Le', 'Sierra Leonean'),
(199, 'Singapore', 'SGP', 'SG', '65', 'SGD', 'Singapore dollar', '$', 'Singaporean'),
(200, 'Slovakia', 'SVK', 'SK', '421', 'EUR', 'Euro', '€', 'Slovak'),
(201, 'Slovenia', 'SVN', 'SI', '386', 'EUR', 'Euro', '€', 'Slovenian, Slovene'),
(202, 'Solomon Islands', 'SLB', 'SB', '677', 'SBD', 'Solomon Islands dollar', 'Si$', 'Solomon Island'),
(203, 'Somalia', 'SOM', 'SO', '252', 'SOS', 'Somali shilling', 'Sh.so.', 'Somali, Somalian'),
(204, 'South Africa', 'ZAF', 'ZA', '27', 'ZAR', 'South African rand', 'R', 'South African'),
(205, 'South Georgia', 'SGS', 'GS', '500', 'GBP', 'British pound', '£', 'South Georgia or South Sandwich Islands'),
(206, 'South Sudan', 'SSD', 'SS', '211', 'SSP', 'South Sudanese pound', '£', 'South Sudanese'),
(207, 'Spain', 'ESP', 'ES', '34', 'EUR', 'Euro', '€', 'Spanish'),
(208, 'Sri Lanka', 'LKA', 'LK', '94', 'LKR', 'Sri Lankan rupee', 'Rs', 'Sri Lankan'),
(209, 'Sudan', 'SDN', 'SD', '249', 'SDG', 'Sudanese pound', '.س.ج', 'Sudanese'),
(210, 'Suriname', 'SUR', 'SR', '597', 'SRD', 'Surinamese dollar', '$', 'Surinamese'),
(211, 'Svalbard and Jan Mayen Islands', 'SJM', 'SJ', '47', 'NOK', 'Norwegian krone', 'ko', 'Svalbard'),
(212, 'Eswatini', 'SWZ', 'SZ', '268', 'SZL', 'Lilangeni', 'E', 'Swazi'),
(213, 'Sweden', 'SWE', 'SE', '46', 'SEK', 'Swedish krona', 'ko', 'Swedish'),
(214, 'Switzerland', 'CHE', 'CH', '41', 'CHF', 'Swiss franc', 'CHf', 'Swiss'),
(215, 'Syria', 'SYR', 'SY', '963', 'SYP', 'Syrian pound', 'LS', 'Syrian'),
(216, 'Taiwan', 'TWN', 'TW', '886', 'TWD', 'New Taiwan dollar', '$', 'Chinese, Taiwanese'),
(217, 'Tajikistan', 'TJK', 'TJ', '992', 'TJS', 'Tajikistani somoni', 'SM', 'Tajikistani'),
(218, 'Tanzania', 'TZA', 'TZ', '255', 'TZS', 'Tanzanian shilling', 'TSh', 'Tanzanian'),
(219, 'Thailand', 'THA', 'TH', '66', 'THB', 'Thai baht', '฿', 'Thai'),
(220, 'Togo', 'TGO', 'TG', '228', 'XOF', 'West African CFA franc', 'CFA', 'Togolese'),
(221, 'Tokelau', 'TKL', 'TK', '690', 'NZD', 'New Zealand dollar', '$', 'Tokelauan'),
(222, 'Tonga', 'TON', 'TO', '676', 'TOP', 'Tongan paʻanga', '$', 'Tongan'),
(223, 'Trinidad and Tobago', 'TTO', 'TT', '1', 'TTD', 'Trinidad and Tobago dollar', '$', 'Trinidadian or Tobagonian'),
(224, 'Tunisia', 'TUN', 'TN', '216', 'TND', 'Tunisian dinar', 'ت.د', 'Tunisian'),
(225, 'Turkey', 'TUR', 'TR', '90', 'TRY', 'Turkish lira', '₺', 'Turkish'),
(226, 'Turkmenistan', 'TKM', 'TM', '993', 'TMT', 'Turkmenistan manat', 'T', 'Turkmen'),
(227, 'Turks and Caicos Islands', 'TCA', 'TC', '1', 'USD', 'United States dollar', '$', 'Turks and Caicos Island'),
(228, 'Tuvalu', 'TUV', 'TV', '688', 'AUD', 'Australian dollar', '$', 'Tuvaluan'),
(229, 'Uganda', 'UGA', 'UG', '256', 'UGX', 'Ugandan shilling', 'USh', 'Ugandan'),
(230, 'Ukraine', 'UKR', 'UA', '380', 'UAH', 'Ukrainian hryvnia', '₴', 'Ukrainian'),
(231, 'United Arab Emirates', 'ARE', 'AE', '971', 'AED', 'United Arab Emirates dirham', 'إ.د', 'Emirati, Emirian, Emiri'),
(232, 'United Kingdom', 'GBR', 'GB', '44', 'GBP', 'British pound', '£', 'British, UK'),
(233, 'United States', 'USA', 'US', '1', 'USD', 'United States dollar', '$', 'American'),
(234, 'United States Minor Outlying Islands', 'UMI', 'UM', '1', 'USD', 'United States dollar', '$', 'American'),
(235, 'Uruguay', 'URY', 'UY', '598', 'UYU', 'Uruguayan peso', '$', 'Uruguayan'),
(236, 'Uzbekistan', 'UZB', 'UZ', '998', 'UZS', 'Uzbekistani soʻm', 'лв', 'Uzbekistani, Uzbek'),
(237, 'Vanuatu', 'VUT', 'VU', '678', 'VUV', 'Vanuatu vatu', 'VT', 'Ni-Vanuatu, Vanuatuan'),
(238, 'Vatican City State (Holy See)', 'VAT', 'VA', '379', 'EUR', 'Euro', '€', 'Vatican'),
(239, 'Venezuela', 'VEN', 'VE', '58', 'VES', 'Bolívar', 'Bs', 'Venezuelan'),
(240, 'Vietnam', 'VNM', 'VN', '84', 'VND', 'Vietnamese đồng', '₫', 'Vietnamese'),
(241, 'Virgin Islands (British)', 'VGB', 'VG', '1', 'USD', 'United States dollar', '$', 'British Virgin Island'),
(242, 'Virgin Islands (US)', 'VIR', 'VI', '1', 'USD', 'United States dollar', '$', 'U.S. Virgin Island'),
(243, 'Wallis and Futuna Islands', 'WLF', 'WF', '681', 'XPF', 'CFP franc', '₣', 'Wallis and Futuna, Wallisian or Futunan'),
(244, 'Western Sahara', 'ESH', 'EH', '212', 'MAD', 'Moroccan dirham', 'MAD', 'Sahrawi, Sahrawian, Sahraouian'),
(245, 'Yemen', 'YEM', 'YE', '967', 'YER', 'Yemeni rial', '﷼', 'Yemeni'),
(246, 'Zambia', 'ZMB', 'ZM', '260', 'ZMW', 'Zambian kwacha', 'ZK', 'Zambian'),
(247, 'Zimbabwe', 'ZWE', 'ZW', '263', 'ZWL', 'Zimbabwe Dollar', '$', 'Zimbabwean'),
(248, 'Kosovo', 'XKX', 'XK', '383', 'EUR', 'Euro', '€', 'Kosovar, Kosovan'),
(249, 'Curaçao', 'CUW', 'CW', '599', 'ANG', 'Netherlands Antillean guilder', 'ƒ', 'Curacaoan'),
(250, 'Sint Maarten (Dutch part)', 'SXM', 'SX', '1721', 'ANG', 'Netherlands Antillean guilder', 'ƒ', 'Sint Maarten');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` mediumint(8) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=251;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
