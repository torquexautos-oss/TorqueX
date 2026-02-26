-- TorqueX Car Database Seed
-- Drop existing tables
DROP TABLE IF EXISTS colors;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS brands;

-- Create brands table
CREATE TABLE brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    country TEXT,
    founded_year INTEGER
);

-- Create cars table
CREATE TABLE cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER NOT NULL,
    model_name TEXT NOT NULL,
    body_type TEXT,
    seating_capacity INTEGER,
    ncap_rating REAL,
    bncap_rating REAL,
    price_min REAL,
    price_max REAL,
    ground_clearance_mm INTEGER,
    boot_space_litres INTEGER,
    fuel_tank_capacity REAL,
    description TEXT,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Create variants table
CREATE TABLE variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    variant_name TEXT NOT NULL,
    price_lakh REAL,
    fuel_type TEXT,
    transmission TEXT,
    engine_cc INTEGER,
    engine_type TEXT,
    power_bhp REAL,
    torque_nm REAL,
    mileage_kmpl REAL,
    num_airbags INTEGER,
    tyre_size TEXT,
    FOREIGN KEY (car_id) REFERENCES cars(id)
);

-- Create colors table
CREATE TABLE colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    color_name TEXT NOT NULL,
    hex_code TEXT,
    FOREIGN KEY (car_id) REFERENCES cars(id)
);

-- ==================== BRANDS ====================
INSERT INTO brands (name, country, founded_year) VALUES ('Tata', 'India', 1945);
INSERT INTO brands (name, country, founded_year) VALUES ('Mahindra', 'India', 1945);
INSERT INTO brands (name, country, founded_year) VALUES ('Jeep', 'USA', 1941);
INSERT INTO brands (name, country, founded_year) VALUES ('Citroen', 'France', 1919);
INSERT INTO brands (name, country, founded_year) VALUES ('Skoda', 'Czech Republic', 1895);
INSERT INTO brands (name, country, founded_year) VALUES ('Maruti', 'India', 1981);
-- ==================== TATA CARS (brand_id = 1) ====================

-- 1. Nexon
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Nexon', 'Compact SUV', 5, 5, 5, 8.10, 15.50, 209, 350, 44, 'India''s safest compact SUV with 5-star safety rating. Available in petrol and diesel with turbo engines.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(1, 'Smart (O) Petrol', 8.10, 'Petrol', 'Manual', 1199, 'Turbocharged', 120, 170, 17.4, 6, '215/60 R16'),
(1, 'Smart+ Petrol', 9.50, 'Petrol', 'Manual', 1199, 'Turbocharged', 120, 170, 17.4, 6, '215/60 R16'),
(1, 'Smart+ S Petrol AMT', 11.00, 'Petrol', 'AMT', 1199, 'Turbocharged', 120, 170, 17.0, 6, '215/60 R16'),
(1, 'Pure+ Diesel', 10.50, 'Diesel', 'Manual', 1497, 'Turbocharged', 115, 260, 23.2, 6, '215/60 R16'),
(1, 'Creative+ Diesel AMT', 13.50, 'Diesel', 'AMT', 1497, 'Turbocharged', 115, 260, 24.0, 6, '215/60 R16'),
(1, 'Fearless+ S Diesel AMT', 15.50, 'Diesel', 'AMT', 1497, 'Turbocharged', 115, 260, 24.0, 6, '215/60 R16');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(1, 'Flame Red', '#C41E3A'), (1, 'Creative Ocean', '#1B4F72'), (1, 'Pristine White', '#F5F5F5'),
(1, 'Pure Grey', '#808080'), (1, 'Fearless Purple', '#6C3082'), (1, 'Daytona Grey', '#4A4A4A');

-- 2. Punch
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Punch', 'Micro SUV', 5, 5, 5, 6.13, 10.20, 187, 366, 37, 'Bold micro SUV with 5-star safety. High ground clearance and rugged design for city and weekend getaways.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(2, 'Pure', 6.13, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 86, 113, 18.8, 2, '185/70 R16'),
(2, 'Adventure', 7.50, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 86, 113, 18.8, 6, '185/70 R16'),
(2, 'Adventure S AMT', 8.70, 'Petrol', 'AMT', 1199, 'Naturally Aspirated', 86, 113, 18.1, 6, '185/70 R16'),
(2, 'Accomplished+ AMT', 10.20, 'Petrol', 'AMT', 1199, 'Naturally Aspirated', 86, 113, 18.1, 6, '185/70 R16');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(2, 'Tornado Blue', '#1E3A5F'), (2, 'Tropical Mist', '#A8D8EA'), (2, 'Orcus White', '#FAFAFA'),
(2, 'Meteor Bronze', '#8B6914'), (2, 'Atomic Orange', '#FF6600'), (2, 'Daytona Grey', '#4A4A4A');

-- 3. Tiago
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Tiago', 'Hatchback', 5, 4, NULL, 5.65, 8.50, 165, 242, 35, 'Feature-rich hatchback with peppy engine, great mileage and strong safety. Also available in CNG.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(3, 'XE Petrol', 5.65, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 86, 113, 20.1, 2, '175/65 R14'),
(3, 'XM+ Petrol', 6.60, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 86, 113, 20.1, 2, '175/65 R14'),
(3, 'XZ+ Petrol AMT', 7.80, 'Petrol', 'AMT', 1199, 'Naturally Aspirated', 86, 113, 19.0, 4, '185/60 R15'),
(3, 'XZ+ CNG', 8.50, 'CNG', 'Manual', 1199, 'Naturally Aspirated', 73, 95, 26.5, 2, '175/65 R14');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(3, 'Flame Red', '#C41E3A'), (3, 'Pearlescent White', '#F8F8FF'), (3, 'Daytona Grey', '#4A4A4A'),
(3, 'Arizona Blue', '#5D8AA8'), (3, 'Midnight Plum', '#4E2A5A');

-- 4. Harrier
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Harrier', 'Mid-size SUV', 5, 5, 5, 15.49, 26.44, 198, 425, 50, 'Premium mid-size SUV built on Land Rover-derived OMEGARC platform. Powerful diesel engine with commanding road presence.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(4, 'Smart Diesel MT', 15.49, 'Diesel', 'Manual', 1956, 'Turbocharged', 170, 350, 16.8, 6, '235/65 R17'),
(4, 'Pure+ Diesel MT', 17.50, 'Diesel', 'Manual', 1956, 'Turbocharged', 170, 350, 16.8, 6, '235/65 R17'),
(4, 'Adventure+ Diesel AT', 21.00, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.6, 6, '235/60 R18'),
(4, 'Fearless+ Diesel AT', 24.00, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.6, 6, '235/60 R18'),
(4, 'Fearless+ Dark Diesel AT', 26.44, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.6, 6, '235/60 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(4, 'Coral Red', '#CD4F39'), (4, 'Ash Grey', '#B2BEB5'), (4, 'Orcus White', '#FAFAFA'),
(4, 'Oberon Black', '#1C1C1C'), (4, 'Aurelia Green', '#2E5D45'), (4, 'Stellar Frost', '#D6E4E5');

-- 5. Altroz
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Altroz', 'Premium Hatchback', 5, 5, NULL, 6.70, 10.86, 165, 345, 37, 'Gold standard premium hatchback with 5-star safety. Available in NA petrol, turbo petrol and diesel.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(5, 'XE Petrol', 6.70, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 86, 113, 22.0, 2, '185/60 R16'),
(5, 'XM+ Petrol', 7.80, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 86, 113, 22.0, 2, '185/60 R16'),
(5, 'XZ+ iTurbo', 9.60, 'Petrol', 'Manual', 1199, 'Turbocharged', 120, 170, 18.0, 6, '195/55 R16'),
(5, 'XZ+ iTurbo DCT', 10.86, 'Petrol', 'DCT', 1199, 'Turbocharged', 120, 170, 17.0, 6, '195/55 R16'),
(5, 'XM Diesel', 8.40, 'Diesel', 'Manual', 1497, 'Turbocharged', 90, 200, 25.1, 2, '185/60 R16');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(5, 'Downtown Red', '#8B0000'), (5, 'Cosmo Dark Blue', '#1B2A49'), (5, 'Avenue White', '#FFFFFF'),
(5, 'Harbour Blue', '#3A75C4'), (5, 'Opera Blue', '#0047AB'), (5, 'Urban Bronze', '#826644');

-- 6. Safari
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Safari', 'Full-size SUV', 7, 5, 5, 16.19, 28.49, 198, 340, 50, 'Flagship 3-row SUV with 6 and 7 seat options. Premium interiors with ADAS and Level-2 autonomous features.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(6, 'Smart Diesel MT 7S', 16.19, 'Diesel', 'Manual', 1956, 'Turbocharged', 170, 350, 16.3, 6, '235/65 R17'),
(6, 'Adventure+ Diesel AT 6S', 21.50, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.5, 6, '235/60 R18'),
(6, 'Accomplished+ Diesel AT 6S', 25.00, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.5, 6, '235/60 R18'),
(6, 'Fearless+ Diesel AT 6S', 28.49, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.5, 6, '235/60 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(6, 'Stardust Ash', '#B2BEB5'), (6, 'Orcus White', '#FAFAFA'), (6, 'Oberon Black', '#1C1C1C'),
(6, 'Cosmic Gold', '#C5A46B'), (6, 'Stellar Frost', '#D6E4E5'), (6, 'Supernova Copper', '#B87333');

-- 7. Curvv
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Curvv', 'Coupe SUV', 5, NULL, 5, 10.00, 19.24, 208, 500, 45, 'India''s first mass-market coupe SUV. Bold design with sloping roofline, available in petrol turbo and diesel.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(7, 'Smart Petrol MT', 10.00, 'Petrol', 'Manual', 1199, 'Turbocharged', 125, 225, 17.5, 6, '215/60 R16'),
(7, 'Pure+ Diesel MT', 12.50, 'Diesel', 'Manual', 1497, 'Turbocharged', 115, 260, 22.0, 6, '215/60 R16'),
(7, 'Creative+ Diesel AT', 15.80, 'Diesel', 'Automatic', 1497, 'Turbocharged', 115, 260, 21.0, 6, '215/55 R17'),
(7, 'Accomplished+ S Diesel AT', 17.50, 'Diesel', 'Automatic', 1497, 'Turbocharged', 115, 260, 21.0, 6, '215/55 R17'),
(7, 'Fearless+ S Petrol DCT', 19.24, 'Petrol', 'DCT', 1199, 'Turbocharged', 125, 225, 16.5, 6, '215/55 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(7, 'Flame Red', '#C41E3A'), (7, 'Pure Grey', '#808080'), (7, 'Pristine White', '#F5F5F5'),
(7, 'Opera Blue', '#0047AB'), (7, 'Virtual Sunrise', '#FF7043'), (7, 'Cosmic Gold', '#C5A46B');

-- 8. Tigor
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Tigor', 'Compact Sedan', 5, 4, NULL, 6.30, 8.90, 170, 419, 35, 'Stylish compact sedan with spacious boot and peppy performance. Also available in CNG for budget-conscious buyers.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(8, 'XE Petrol', 6.30, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 86, 113, 20.3, 2, '175/65 R14'),
(8, 'XM+ Petrol', 7.10, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 86, 113, 20.3, 2, '175/65 R14'),
(8, 'XZ+ Petrol AMT', 8.30, 'Petrol', 'AMT', 1199, 'Naturally Aspirated', 86, 113, 19.2, 4, '185/60 R15'),
(8, 'XZ+ CNG', 8.90, 'CNG', 'Manual', 1199, 'Naturally Aspirated', 73, 95, 26.5, 2, '175/65 R14');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(8, 'Arizona Blue', '#5D8AA8'), (8, 'Pearlescent White', '#F8F8FF'), (8, 'Daytona Grey', '#4A4A4A'),
(8, 'Magnetic Red', '#B22234'), (8, 'Midnight Plum', '#4E2A5A');

-- 9. Sierra
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (1, 'Sierra', 'Lifestyle SUV', 5, NULL, NULL, 12.50, 22.00, 200, 370, 50, 'Iconic nameplate reborn as a modern lifestyle SUV. Retro-inspired design with contemporary technology and features.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(9, 'Smart Petrol MT', 12.50, 'Petrol', 'Manual', 1497, 'Turbocharged', 150, 250, 16.0, 6, '215/65 R17'),
(9, 'Adventure+ Petrol AT', 16.50, 'Petrol', 'Automatic', 1497, 'Turbocharged', 150, 250, 15.0, 6, '215/60 R18'),
(9, 'Accomplished+ Diesel MT', 17.00, 'Diesel', 'Manual', 1956, 'Turbocharged', 170, 350, 18.5, 6, '215/65 R17'),
(9, 'Fearless+ Diesel AT', 22.00, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 17.5, 6, '215/60 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(9, 'Grassland Beige', '#C8B88A'), (9, 'Orcus White', '#FAFAFA'), (9, 'Oberon Black', '#1C1C1C'),
(9, 'Forest Green', '#228B22'), (9, 'Tropical Mist', '#A8D8EA');
-- ==================== MAHINDRA CARS (brand_id = 2) ====================

-- 10. Scorpio-N
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'Scorpio-N', 'Mid-size SUV', 7, NULL, 5, 13.99, 24.54, 200, 460, 57, 'Rugged body-on-frame SUV with 4x4 capability. Available in turbo petrol and diesel with powerful performance.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(10, 'Z4 Petrol MT', 13.99, 'Petrol', 'Manual', 1997, 'Turbocharged', 203, 370, 12.5, 6, '245/65 R17'),
(10, 'Z6 Diesel MT', 16.50, 'Diesel', 'Manual', 2184, 'Turbocharged', 175, 370, 16.5, 6, '245/65 R17'),
(10, 'Z8 Diesel AT', 19.50, 'Diesel', 'Automatic', 2184, 'Turbocharged', 175, 400, 14.5, 6, '255/60 R18'),
(10, 'Z8 L Diesel AT 4x4', 24.54, 'Diesel', 'Automatic', 2184, 'Turbocharged', 175, 400, 14.5, 6, '255/60 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(10, 'Dazzling Silver', '#C0C0C0'), (10, 'Deep Forest', '#003300'), (10, 'Red Rage', '#DC143C'),
(10, 'Napoli Black', '#1C1C1C'), (10, 'Grand Canyon', '#8B4513'), (10, 'Everest White', '#F8F8FF');

-- 11. Thar
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'Thar', 'Off-Road SUV', 4, NULL, NULL, 11.35, 17.99, 226, 0, 57, 'Iconic 4x4 off-roader with removable roof. Built for adventure with powerful engine options and go-anywhere capability.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(11, 'AX (O) Petrol MT', 11.35, 'Petrol', 'Manual', 1997, 'Turbocharged', 152, 300, 15.2, 2, '245/75 R16'),
(11, 'LX Diesel MT Hard Top', 13.80, 'Diesel', 'Manual', 2184, 'Turbocharged', 130, 300, 15.2, 2, '245/75 R16'),
(11, 'LX Diesel AT', 15.90, 'Diesel', 'Automatic', 2184, 'Turbocharged', 130, 300, 14.0, 2, '245/75 R16'),
(11, 'LX Petrol AT Convertible', 17.99, 'Petrol', 'Automatic', 1997, 'Turbocharged', 152, 300, 14.5, 2, '245/75 R16');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(11, 'Galaxy Grey', '#5C5C5C'), (11, 'Aquamarine Blue', '#7FFFD4'), (11, 'Napoli Black', '#1C1C1C'),
(11, 'Red Rage', '#DC143C'), (11, 'Rocky Beige', '#C8AD7F'), (11, 'Everest White', '#F8F8FF');

-- 12. Bolero Neo
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'Bolero Neo', 'Compact SUV', 7, NULL, NULL, 9.76, 12.09, 180, 0, 60, 'Rugged compact SUV with 7-seat configuration. Solid build quality and proven diesel engine for rough Indian roads.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(12, 'N4', 9.76, 'Diesel', 'Manual', 1493, 'Turbocharged', 100, 260, 17.0, 2, '215/75 R15'),
(12, 'N8', 10.50, 'Diesel', 'Manual', 1493, 'Turbocharged', 100, 260, 17.0, 2, '215/75 R15'),
(12, 'N10', 11.30, 'Diesel', 'Manual', 1493, 'Turbocharged', 100, 260, 17.0, 2, '215/75 R15'),
(12, 'N10 (O)', 12.09, 'Diesel', 'Manual', 1493, 'Turbocharged', 100, 260, 17.0, 2, '215/75 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(12, 'Pearl White', '#F5F5F5'), (12, 'Diamond White', '#EDEDED'), (12, 'Dsat Silver', '#C0C0C0'),
(12, 'Napoli Black', '#1C1C1C'), (12, 'Burgundy Wine', '#722F37');

-- 13. XUV 3XO
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'XUV 3XO', 'Compact SUV', 5, NULL, NULL, 7.99, 15.49, 195, 364, 40, 'Feature-loaded compact SUV with segment-first tech. Panoramic sunroof, ADAS, and connected car features.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(13, 'MX1 Petrol MT', 7.99, 'Petrol', 'Manual', 1197, 'Turbocharged', 110, 200, 18.9, 2, '205/65 R16'),
(13, 'MX3 Petrol MT', 9.50, 'Petrol', 'Manual', 1197, 'Turbocharged', 110, 200, 18.9, 6, '215/55 R17'),
(13, 'AX5 Diesel MT', 12.00, 'Diesel', 'Manual', 1497, 'Turbocharged', 115, 300, 20.6, 6, '215/55 R17'),
(13, 'AX7 L Petrol AT', 14.00, 'Petrol', 'Automatic', 1197, 'Turbocharged', 110, 200, 17.5, 6, '215/55 R17'),
(13, 'AX7 L Diesel AT', 15.49, 'Diesel', 'Automatic', 1497, 'Turbocharged', 115, 300, 18.5, 6, '215/55 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(13, 'Tango Red', '#E44D2E'), (13, 'Nebula Blue', '#1E3A5F'), (13, 'Everest White', '#F8F8FF'),
(13, 'Napoli Black', '#1C1C1C'), (13, 'Burns Orange', '#CC5500'), (13, 'Deep Forest', '#003300');

-- 14. XUV 7XO
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'XUV 7XO', 'Full-size SUV', 7, 5, 5, 14.99, 27.49, 200, 451, 60, 'Tech-loaded flagship SUV with ADAS Level-2 and segment-best features. Available in 5 and 7 seat configurations.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(14, 'MX Petrol MT', 14.99, 'Petrol', 'Manual', 1997, 'Turbocharged', 200, 380, 13.0, 7, '235/65 R17'),
(14, 'AX5 Diesel MT', 17.50, 'Diesel', 'Manual', 2184, 'Turbocharged', 185, 420, 16.0, 7, '235/65 R17'),
(14, 'AX7 Diesel AT', 22.00, 'Diesel', 'Automatic', 2184, 'Turbocharged', 185, 450, 14.5, 7, '235/60 R18'),
(14, 'AX7 L Diesel AT AWD', 25.00, 'Diesel', 'Automatic', 2184, 'Turbocharged', 185, 450, 14.0, 7, '235/60 R18'),
(14, 'AX7 L Pack Diesel AT AWD', 27.49, 'Diesel', 'Automatic', 2184, 'Turbocharged', 185, 450, 14.0, 7, '235/60 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(14, 'Midnight Blue', '#003366'), (14, 'Everest White', '#F8F8FF'), (14, 'Dazzling Silver', '#C0C0C0'),
(14, 'Red Rage', '#DC143C'), (14, 'Napoli Black', '#1C1C1C'), (14, 'Agate Beige', '#C8B88A');

-- 15. XEV 9e
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'XEV 9e', 'Electric Coupe SUV', 5, NULL, NULL, 21.90, 30.50, 207, 663, 0, 'Born Electric coupe SUV on Mahindra INGLO platform. Stunning design with 500+ km range and rapid charging.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(15, 'Pack One 59 kWh', 21.90, 'Electric', 'Automatic', 0, 'Electric', 228, 380, 5.1, 7, '235/55 R19'),
(15, 'Pack Two 59 kWh', 24.50, 'Electric', 'Automatic', 0, 'Electric', 228, 380, 5.1, 7, '235/55 R19'),
(15, 'Pack Two 79 kWh', 27.00, 'Electric', 'Automatic', 0, 'Electric', 286, 380, 4.3, 7, '255/45 R20'),
(15, 'Pack Three 79 kWh', 30.50, 'Electric', 'Automatic', 0, 'Electric', 286, 380, 4.3, 7, '255/45 R20');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(15, 'Stealth Black', '#1C1C1C'), (15, 'Everest White', '#F8F8FF'), (15, 'Burnt Sienna', '#E97451'),
(15, 'Tango Red', '#E44D2E'), (15, 'Nebula Blue', '#1E3A5F');

-- 16. BE 6
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'BE 6', 'Electric SUV', 5, NULL, NULL, 18.90, 26.90, 207, 455, 0, 'Sporty born-electric SUV on INGLO platform. Aggressive design with fast charging and premium connected features.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(16, 'Pack One 59 kWh', 18.90, 'Electric', 'Automatic', 0, 'Electric', 228, 380, 5.3, 6, '235/55 R19'),
(16, 'Pack Two 59 kWh', 21.50, 'Electric', 'Automatic', 0, 'Electric', 228, 380, 5.3, 6, '235/55 R19'),
(16, 'Pack Three 79 kWh', 24.50, 'Electric', 'Automatic', 0, 'Electric', 286, 380, 4.5, 6, '255/45 R20'),
(16, 'Pack Three 79 kWh Loaded', 26.90, 'Electric', 'Automatic', 0, 'Electric', 286, 380, 4.5, 6, '255/45 R20');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(16, 'Satin Copper', '#B87333'), (16, 'Alpine White', '#F5F5F5'), (16, 'Stealth Black', '#1C1C1C'),
(16, 'Ocean Blue', '#1B4F72'), (16, 'Deep Forest', '#003300');

-- 17. XUV 400 EV
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'XUV 400 EV', 'Electric Compact SUV', 5, 5, NULL, 15.99, 19.89, 180, 378, 0, 'Mahindra''s first electric SUV based on XUV300 platform. Proven 5-star NCAP safety with good range for city and highway.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(17, 'EC Pro 34.5 kWh', 15.99, 'Electric', 'Automatic', 0, 'Electric', 150, 310, 6.5, 6, '205/65 R16'),
(17, 'EL Pro 39.4 kWh', 17.50, 'Electric', 'Automatic', 0, 'Electric', 150, 310, 5.5, 6, '215/55 R17'),
(17, 'EL Pro L 39.4 kWh', 19.89, 'Electric', 'Automatic', 0, 'Electric', 150, 310, 5.5, 6, '215/55 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(17, 'Galaxy Grey', '#5C5C5C'), (17, 'Napoli Black', '#1C1C1C'), (17, 'Everest White', '#F8F8FF'),
(17, 'Artic Blue', '#4682B4'), (17, 'Infinity Blue', '#003366');

-- 18. Marazzo
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (2, 'Marazzo', 'MPV', 8, NULL, NULL, 13.55, 16.10, 190, 190, 45, 'Shark-inspired MPV with spacious 8-seat cabin. Smooth diesel engine with excellent ride comfort for family use.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(18, 'M2 8-Seater', 13.55, 'Diesel', 'Manual', 1497, 'Turbocharged', 123, 300, 17.3, 2, '215/65 R16'),
(18, 'M4 8-Seater', 14.10, 'Diesel', 'Manual', 1497, 'Turbocharged', 123, 300, 17.3, 2, '215/65 R16'),
(18, 'M6 8-Seater', 15.20, 'Diesel', 'Manual', 1497, 'Turbocharged', 123, 300, 17.3, 4, '215/65 R16'),
(18, 'M8 7-Seater', 16.10, 'Diesel', 'Manual', 1497, 'Turbocharged', 123, 300, 17.3, 4, '215/65 R16');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(18, 'Pearl White', '#F5F5F5'), (18, 'Maroon Red', '#800000'), (18, 'Silver', '#C0C0C0'),
(18, 'Black', '#1C1C1C');
-- ==================== JEEP CARS (brand_id = 3) ====================

-- 19. Compass
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (3, 'Compass', 'Premium SUV', 5, 4, NULL, 18.99, 33.23, 178, 438, 60, 'Premium American SUV with Jeep heritage. Available in 4x4 diesel with off-road capability and refined highway manners.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(19, 'Sport Petrol', 18.99, 'Petrol', 'Manual', 1368, 'Turbocharged', 163, 250, 14.0, 6, '215/65 R16'),
(19, 'Longitude Diesel', 23.50, 'Diesel', 'Manual', 1956, 'Turbocharged', 170, 350, 17.1, 6, '225/55 R18'),
(19, 'Limited Plus Diesel AT', 28.50, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 15.5, 6, '225/55 R18'),
(19, 'Model S Diesel AT 4x4', 33.23, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 15.5, 6, '225/55 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(19, 'Brilliant Black', '#0C0C0C'), (19, 'Minimal Grey', '#9E9E9E'), (19, 'Vocal White', '#FFFFFF'),
(19, 'Exotica Red', '#A91B0D'), (19, 'Galaxy Blue', '#1A237E');

-- 20. Meridian
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (3, 'Meridian', '3-Row SUV', 7, NULL, NULL, 29.90, 39.27, 203, 233, 60, 'Premium 7-seat SUV with genuine off-road capability. Luxurious interiors with panoramic sunroof and advanced tech.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(20, 'Limited (O) Diesel AT', 29.90, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.5, 6, '235/55 R18'),
(20, 'Limited Plus Diesel AT', 33.50, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.5, 6, '235/55 R18'),
(20, 'Overland Diesel AT 4x4', 36.90, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.0, 6, '235/55 R18'),
(20, 'Upland Diesel AT 4x4', 39.27, 'Diesel', 'Automatic', 1956, 'Turbocharged', 170, 350, 14.0, 6, '235/55 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(20, 'Brilliant Black', '#0C0C0C'), (20, 'Minimal Grey', '#9E9E9E'), (20, 'Vocal White', '#FFFFFF'),
(20, 'Techno Green', '#315C2B');

-- 21. Wrangler
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (3, 'Wrangler', 'Off-Road SUV', 5, NULL, NULL, 55.49, 60.49, 217, 548, 66, 'Legendary off-road icon. Rock-crawling capability with removable doors, roof, and fold-down windshield.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(21, 'Unlimited Petrol AT', 55.49, 'Petrol', 'Automatic', 1995, 'Turbocharged', 272, 400, 10.0, 4, '255/70 R18'),
(21, 'Rubicon Petrol AT', 60.49, 'Petrol', 'Automatic', 1995, 'Turbocharged', 272, 400, 10.0, 4, '255/70 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(21, 'Black', '#0C0C0C'), (21, 'Bright White', '#FFFFFF'), (21, 'Firecracker Red', '#CE2029'),
(21, 'Bikini Pearl', '#00CED1'), (21, 'Sarge Green', '#4B5320');

-- 22. Grand Cherokee
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (3, 'Grand Cherokee', 'Luxury SUV', 5, 5, NULL, 78.50, 85.99, 218, 1070, 68, 'Iconic luxury SUV with Quadra-Trac 4x4 system. Premium interiors with McIntosh audio and advanced driver aids.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(22, 'Limited Petrol AT', 78.50, 'Petrol', 'Automatic', 1995, 'Turbocharged', 272, 400, 8.5, 7, '265/60 R18'),
(22, 'Overland Petrol AT', 85.99, 'Petrol', 'Automatic', 1995, 'Turbocharged', 272, 400, 8.5, 7, '265/50 R20');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(22, 'Rocky Mountain Pearl', '#8B7D6B'), (22, 'Diamond Black', '#0C0C0C'), (22, 'Bright White', '#FFFFFF'),
(22, 'Velvet Red', '#750000');

-- ==================== CITROEN CARS (brand_id = 4) ====================

-- 23. C3
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (4, 'C3', 'Hatchback', 5, NULL, NULL, 5.99, 9.34, 180, 315, 30, 'Fun-to-drive French hatchback with SUV-inspired design. High ground clearance and unique European styling.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(23, 'Live 1.2 NA', 5.99, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 82, 115, 19.8, 3, '195/65 R15'),
(23, 'Feel 1.2 NA', 7.20, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 82, 115, 19.8, 3, '195/65 R15'),
(23, 'Feel Turbo', 8.50, 'Petrol', 'Manual', 1199, 'Turbocharged', 110, 190, 19.4, 6, '195/65 R15'),
(23, 'Shine Turbo AT', 9.34, 'Petrol', 'Automatic', 1199, 'Turbocharged', 110, 190, 18.0, 6, '195/65 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(23, 'Polar White', '#FFFFFF'), (23, 'Zesty Orange', '#FF5733'), (23, 'Platinum Grey', '#B5B5B5'),
(23, 'Steel Grey', '#71797E'), (23, 'Candy Red', '#DC143C');

-- 24. Aircross
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (4, 'Aircross', 'Compact SUV', 5, NULL, NULL, 9.99, 14.19, 190, 410, 45, 'Comfortable compact SUV with signature Citroen comfort. Progressive Hydraulic Cushion suspension for smooth rides.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(24, 'You 1.2 Turbo', 9.99, 'Petrol', 'Manual', 1199, 'Turbocharged', 110, 190, 18.7, 6, '205/65 R16'),
(24, 'Plus 1.2 Turbo', 11.50, 'Petrol', 'Manual', 1199, 'Turbocharged', 110, 190, 18.7, 6, '215/60 R17'),
(24, 'Plus 1.2 Turbo AT', 12.80, 'Petrol', 'Automatic', 1199, 'Turbocharged', 110, 190, 17.5, 6, '215/60 R17'),
(24, 'Max 1.2 Turbo AT', 14.19, 'Petrol', 'Automatic', 1199, 'Turbocharged', 110, 190, 17.5, 6, '215/60 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(24, 'Pearl White', '#F5F5F5'), (24, 'Cosmo Blue', '#1B2A49'), (24, 'Platinum Grey', '#B5B5B5'),
(24, 'Steel Grey', '#71797E'), (24, 'Perla Nera Black', '#0C0C0C');

-- 25. Basalt Coupe
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (4, 'Basalt Coupe', 'Coupe SUV', 5, NULL, NULL, 7.99, 13.83, 180, 470, 45, 'India''s most affordable coupe SUV with bold design. Sloping roofline with best-in-class boot space.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(25, 'You 1.2 NA', 7.99, 'Petrol', 'Manual', 1199, 'Naturally Aspirated', 82, 115, 18.5, 6, '205/65 R16'),
(25, 'Plus 1.2 Turbo', 10.50, 'Petrol', 'Manual', 1199, 'Turbocharged', 110, 190, 18.0, 6, '205/65 R16'),
(25, 'Plus 1.2 Turbo AT', 12.00, 'Petrol', 'Automatic', 1199, 'Turbocharged', 110, 190, 17.0, 6, '215/55 R17'),
(25, 'Max 1.2 Turbo AT', 13.83, 'Petrol', 'Automatic', 1199, 'Turbocharged', 110, 190, 17.0, 6, '215/55 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(25, 'Polar White', '#FFFFFF'), (25, 'Garnet Red', '#7B1818'), (25, 'Cosmo Blue', '#1B2A49'),
(25, 'Platinum Grey', '#B5B5B5'), (25, 'Perla Nera Black', '#0C0C0C');

-- 26. eC3
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (4, 'eC3', 'Electric Hatchback', 5, NULL, NULL, 11.50, 13.50, 170, 315, 0, 'Affordable electric hatchback for city commuting. 320 km range with practical design and low running cost.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(26, 'Feel 29.2 kWh', 11.50, 'Electric', 'Automatic', 0, 'Electric', 57, 143, 7.1, 3, '195/65 R15'),
(26, 'Shine 29.2 kWh', 13.50, 'Electric', 'Automatic', 0, 'Electric', 57, 143, 7.1, 6, '195/65 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(26, 'Polar White', '#FFFFFF'), (26, 'Zesty Orange', '#FF5733'), (26, 'Platinum Grey', '#B5B5B5'),
(26, 'Cosmo Blue', '#1B2A49');

-- 27. C5 Aircross
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (4, 'C5 Aircross', 'Mid-size SUV', 5, 5, NULL, 36.91, 41.99, 230, 580, 53, 'Premium French SUV with Advanced Comfort suspension. Plush interiors and segment-best ride quality.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(27, 'Feel Diesel AT', 36.91, 'Diesel', 'Automatic', 1997, 'Turbocharged', 177, 400, 14.0, 6, '235/55 R18'),
(27, 'Shine Diesel AT', 41.99, 'Diesel', 'Automatic', 1997, 'Turbocharged', 177, 400, 14.0, 6, '235/55 R18');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(27, 'Pearl White', '#F5F5F5'), (27, 'Cumulus Grey', '#B2BEB5'), (27, 'Perla Nera Black', '#0C0C0C'),
(27, 'Tijuca Blue', '#1B4F72');

-- ==================== SKODA CARS (brand_id = 5) ====================

-- 28. Kylaq
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (5, 'Kylaq', 'Compact SUV', 5, NULL, 5, 7.89, 14.40, 188, 446, 45, 'Skoda''s entry-level SUV for India. European build quality with TSI turbo engine and solid safety credentials.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(28, 'Classic 1.0 TSI MT', 7.89, 'Petrol', 'Manual', 999, 'Turbocharged', 115, 178, 19.7, 6, '205/60 R16'),
(28, 'Signature 1.0 TSI MT', 10.50, 'Petrol', 'Manual', 999, 'Turbocharged', 115, 178, 19.7, 6, '215/55 R17'),
(28, 'Signature+ 1.0 TSI AT', 12.50, 'Petrol', 'Automatic', 999, 'Turbocharged', 115, 178, 18.0, 6, '215/55 R17'),
(28, 'Prestige 1.0 TSI AT', 14.40, 'Petrol', 'Automatic', 999, 'Turbocharged', 115, 178, 18.0, 6, '215/55 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(28, 'Candy White', '#FDFDFD'), (28, 'Carbon Steel', '#4A4A4A'), (28, 'Tornado Red', '#B01B1B'),
(28, 'Brilliant Silver', '#C4C4C4'), (28, 'Lava Blue', '#034694');

-- 29. Slavia
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (5, 'Slavia', 'Mid-size Sedan', 5, NULL, NULL, 10.99, 18.49, 179, 521, 50, 'European sedan with sharp handling and spacious rear. Available with 1.0 and 1.5 TSI turbo engines.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(29, 'Active 1.0 TSI MT', 10.99, 'Petrol', 'Manual', 999, 'Turbocharged', 115, 178, 19.6, 6, '205/55 R16'),
(29, 'Ambition 1.0 TSI AT', 13.50, 'Petrol', 'Automatic', 999, 'Turbocharged', 115, 178, 18.0, 6, '205/55 R16'),
(29, 'Style 1.5 TSI AT', 16.50, 'Petrol', 'DCT', 1498, 'Turbocharged', 150, 250, 18.7, 6, '215/45 R17'),
(29, 'Sportline 1.5 TSI AT', 18.49, 'Petrol', 'DCT', 1498, 'Turbocharged', 150, 250, 18.7, 6, '215/45 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(29, 'Candy White', '#FDFDFD'), (29, 'Carbon Steel', '#4A4A4A'), (29, 'Tornado Red', '#B01B1B'),
(29, 'Brilliant Silver', '#C4C4C4'), (29, 'Lava Blue', '#034694');

-- 30. Kushaq
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (5, 'Kushaq', 'Mid-size SUV', 5, 5, NULL, 11.39, 19.49, 188, 385, 50, 'Made-in-India SUV with European genes. 5-star NCAP safety with powerful TSI engines and premium build.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(30, 'Active 1.0 TSI MT', 11.39, 'Petrol', 'Manual', 999, 'Turbocharged', 115, 178, 19.6, 6, '205/60 R16'),
(30, 'Ambition 1.0 TSI AT', 14.00, 'Petrol', 'Automatic', 999, 'Turbocharged', 115, 178, 18.0, 6, '215/55 R17'),
(30, 'Style 1.5 TSI DSG', 17.00, 'Petrol', 'DCT', 1498, 'Turbocharged', 150, 250, 18.0, 6, '215/55 R17'),
(30, 'Monte Carlo 1.5 TSI DSG', 19.49, 'Petrol', 'DCT', 1498, 'Turbocharged', 150, 250, 18.0, 6, '215/55 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(30, 'Candy White', '#FDFDFD'), (30, 'Carbon Steel', '#4A4A4A'), (30, 'Tornado Red', '#B01B1B'),
(30, 'Honey Orange', '#E87811'), (30, 'Brilliant Silver', '#C4C4C4'), (30, 'Lava Blue', '#034694');

-- 31. Kodiaq
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (5, 'Kodiaq', 'Full-size SUV', 7, 5, NULL, 39.99, 44.99, 190, 630, 58, 'Premium 7-seat SUV with European refinement. Powerful 2.0 TSI engine with DSG and all-in-one family capability.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(31, 'Style 2.0 TSI DSG', 39.99, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 12.0, 9, '235/50 R19'),
(31, 'L&K 2.0 TSI DSG', 42.50, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 12.0, 9, '235/50 R19'),
(31, 'Sportline 2.0 TSI DSG', 44.99, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 12.0, 9, '235/45 R20');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(31, 'Moon White', '#F5F5F0'), (31, 'Lava Blue', '#034694'), (31, 'Graphite Grey', '#4A4A4A'),
(31, 'Magic Black', '#0C0C0C');

-- 32. Octavia
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (5, 'Octavia', 'Premium Sedan', 5, 5, NULL, 27.40, 32.90, 155, 600, 50, 'Simply Clever premium sedan with class-leading space and refined 2.0 TSI performance. Perfect blend of luxury and practicality.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(32, 'Style 2.0 TSI DSG', 27.40, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 13.5, 8, '225/45 R18'),
(32, 'L&K 2.0 TSI DSG', 30.50, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 13.5, 8, '225/45 R18'),
(32, 'Sportline 2.0 TSI DSG', 32.90, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 13.5, 8, '225/40 R19');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(32, 'Candy White', '#FDFDFD'), (32, 'Lava Blue', '#034694'), (32, 'Magic Black', '#0C0C0C'),
(32, 'Brilliant Silver', '#C4C4C4'), (32, 'Race Blue', '#0039A6');

-- 33. Superb
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (5, 'Superb', 'Luxury Sedan', 5, 5, NULL, 35.99, 40.99, 154, 625, 66, 'Flagship luxury sedan with first-class rear legroom and executive comfort. Czech craftsmanship at its finest.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(33, 'Sportline 2.0 TSI DSG', 35.99, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 12.5, 8, '235/45 R18'),
(33, 'L&K 2.0 TSI DSG', 38.50, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 12.5, 8, '235/45 R18'),
(33, 'L&K Select 2.0 TSI DSG', 40.99, 'Petrol', 'DCT', 1984, 'Turbocharged', 190, 320, 12.5, 8, '235/40 R19');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(33, 'Moon White', '#F5F5F0'), (33, 'Lava Blue', '#034694'), (33, 'Magic Black', '#0C0C0C'),
(33, 'Magnetic Brown', '#654321'), (33, 'Race Blue', '#0039A6');
-- ==================== MARUTI CARS (brand_id = 6) ====================

-- 34. Dzire
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Dzire', 'Compact Sedan', 5, NULL, 5, 6.79, 10.14, 163, 382, 37, 'India''s best-selling sedan. New generation with 5-star BNCAP safety, Z-Series engine, and premium design.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(34, 'LXi', 6.79, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 82, 112, 24.8, 6, '185/65 R15'),
(34, 'VXi', 7.79, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 82, 112, 24.8, 6, '185/65 R15'),
(34, 'ZXi AGS', 9.14, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 82, 112, 24.1, 6, '185/65 R15'),
(34, 'ZXi+ AGS', 10.14, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 82, 112, 24.1, 6, '185/65 R15'),
(34, 'VXi CNG', 8.74, 'CNG', 'Manual', 1197, 'Naturally Aspirated', 70, 98, 33.7, 6, '185/65 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(34, 'Alluring Blue', '#1E3A5F'), (34, 'Arctic White', '#F8F8FF'), (34, 'Magma Grey', '#5C5C5C'),
(34, 'Splendid Silver', '#C0C0C0'), (34, 'Gallant Red', '#B22234'), (34, 'Nutmeg Brown', '#7B5B3A');

-- 35. Ertiga
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Ertiga', 'MPV', 7, 3, NULL, 8.69, 13.03, 185, 209, 45, 'Best-selling MPV with versatile 7-seat layout. Efficient petrol and CNG options with Maruti reliability.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(35, 'LXi', 8.69, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 105, 138, 20.5, 6, '185/65 R15'),
(35, 'VXi', 9.49, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 105, 138, 20.5, 6, '185/65 R15'),
(35, 'ZXi AT', 11.70, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 105, 138, 20.3, 6, '185/65 R15'),
(35, 'ZXi+ AT', 13.03, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 105, 138, 20.3, 6, '185/65 R15'),
(35, 'VXi CNG', 10.28, 'CNG', 'Manual', 1462, 'Naturally Aspirated', 92, 122, 26.1, 6, '185/65 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(35, 'Pearl Arctic White', '#F8F8FF'), (35, 'Magma Grey', '#5C5C5C'), (35, 'Splendid Silver', '#C0C0C0'),
(35, 'Auburn Red', '#712A2A'), (35, 'Dignity Brown', '#6B4423'), (35, 'Midnight Black', '#1C1C1C');

-- 36. Swift
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Swift', 'Hatchback', 5, NULL, NULL, 6.49, 9.64, 163, 265, 37, 'Iconic sporty hatchback. New Z-Series engine with improved efficiency and dynamic handling character.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(36, 'LXi', 6.49, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 82, 112, 24.8, 6, '185/65 R15'),
(36, 'VXi', 7.29, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 82, 112, 24.8, 6, '185/65 R15'),
(36, 'ZXi AGS', 8.64, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 82, 112, 24.0, 6, '185/65 R15'),
(36, 'ZXi+ AGS', 9.64, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 82, 112, 24.0, 6, '185/65 R15'),
(36, 'VXi CNG', 8.19, 'CNG', 'Manual', 1197, 'Naturally Aspirated', 70, 98, 32.8, 6, '185/65 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(36, 'Luster Blue', '#2C5F8A'), (36, 'Sizzling Red', '#CC0000'), (36, 'Arctic White', '#F8F8FF'),
(36, 'Magma Grey', '#5C5C5C'), (36, 'Midnight Black', '#1C1C1C'), (36, 'Pearl Metallic Lucent Orange', '#FF7036');

-- 37. Brezza
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Brezza', 'Compact SUV', 5, 4, NULL, 8.39, 14.14, 198, 328, 48, 'India''s most popular compact SUV. Smart Hybrid technology with rugged design and feature-rich cabin.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(37, 'LXi', 8.39, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 103, 137, 20.2, 6, '215/60 R16'),
(37, 'VXi', 9.56, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 103, 137, 20.2, 6, '215/60 R16'),
(37, 'ZXi AT', 12.00, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 103, 137, 19.8, 6, '215/60 R16'),
(37, 'ZXi+ AT', 14.14, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 103, 137, 19.8, 6, '215/60 R16'),
(37, 'VXi CNG', 10.14, 'CNG', 'Manual', 1462, 'Naturally Aspirated', 88, 122, 25.0, 6, '215/60 R16');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(37, 'Brave Khaki', '#8B7D3C'), (37, 'Sizzling Red', '#CC0000'), (37, 'Arctic White', '#F8F8FF'),
(37, 'Magma Grey', '#5C5C5C'), (37, 'Splendid Silver', '#C0C0C0'), (37, 'Pearl Midnight Black', '#1C1C1C');

-- 38. Baleno
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Baleno', 'Premium Hatchback', 5, 3, NULL, 6.66, 9.88, 170, 318, 37, 'Premium hatchback with advanced infotainment and Heads-Up Display. Smart Hybrid for excellent fuel economy.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(38, 'Sigma', 6.66, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 90, 113, 22.4, 2, '185/65 R15'),
(38, 'Delta', 7.60, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 90, 113, 22.4, 2, '185/65 R15'),
(38, 'Zeta AGS', 8.80, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 90, 113, 22.4, 6, '185/65 R15'),
(38, 'Alpha AGS', 9.88, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 90, 113, 22.4, 6, '185/65 R15'),
(38, 'Delta CNG', 8.49, 'CNG', 'Manual', 1197, 'Naturally Aspirated', 77, 98, 30.7, 2, '185/65 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(38, 'Nexa Blue', '#1A237E'), (38, 'Luxe Beige', '#C8B88A'), (38, 'Arctic White', '#F8F8FF'),
(38, 'Grandeur Grey', '#71797E'), (38, 'Opulent Red', '#8B0000'), (38, 'Midnight Black', '#1C1C1C');

-- 39. Victoris
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Victoris', 'Mid-size SUV', 5, NULL, NULL, 11.99, 17.49, 195, 370, 48, 'Bold mid-size SUV from Maruti Suzuki. Feature-loaded urban-friendly SUV with strong hybrid technology.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(39, 'Sigma 1.5 MT', 11.99, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 105, 138, 21.1, 6, '215/60 R16'),
(39, 'Delta 1.5 MT', 13.50, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 105, 138, 21.1, 6, '215/60 R16'),
(39, 'Zeta 1.5 AT', 15.50, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 105, 138, 20.5, 6, '215/55 R17'),
(39, 'Alpha 1.5 AT', 17.49, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 105, 138, 20.5, 6, '215/55 R17');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(39, 'Arctic White', '#F8F8FF'), (39, 'Magma Grey', '#5C5C5C'), (39, 'Splendid Silver', '#C0C0C0'),
(39, 'Midnight Black', '#1C1C1C'), (39, 'Celestial Blue', '#2E5090');

-- 40. Wagon R
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Wagon R', 'Tall Boy Hatchback', 5, 2, NULL, 5.54, 7.42, 165, 341, 32, 'India''s favorite tall-boy hatchback. Spacious cabin with excellent CNG efficiency for daily commuting.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(40, 'LXi 1.0', 5.54, 'Petrol', 'Manual', 998, 'Naturally Aspirated', 67, 89, 24.4, 2, '155/80 R13'),
(40, 'VXi 1.0', 5.95, 'Petrol', 'Manual', 998, 'Naturally Aspirated', 67, 89, 24.4, 2, '165/70 R14'),
(40, 'ZXi 1.2 AGS', 6.80, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 90, 113, 24.4, 3, '165/70 R14'),
(40, 'ZXi+ 1.2 AGS', 7.42, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 90, 113, 24.4, 3, '165/70 R14'),
(40, 'LXi CNG', 6.39, 'CNG', 'Manual', 998, 'Naturally Aspirated', 57, 82, 34.1, 2, '155/80 R13');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(40, 'Silky Silver', '#C0C0C0'), (40, 'Superior White', '#F5F5F5'), (40, 'Magma Grey', '#5C5C5C'),
(40, 'Midnight Black', '#1C1C1C'), (40, 'Gallant Red', '#B22234');

-- 41. Fronx
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Fronx', 'Coupe SUV', 5, NULL, NULL, 7.51, 13.04, 190, 308, 37, 'Sporty coupe-style SUV with swept-back design. Available with turbo BoosterJet engine for enthusiast driving.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(41, 'Sigma 1.2', 7.51, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 90, 113, 22.9, 6, '195/60 R16'),
(41, 'Delta 1.2', 8.50, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 90, 113, 22.9, 6, '195/60 R16'),
(41, 'Zeta 1.0 Turbo AT', 11.00, 'Petrol', 'Automatic', 998, 'Turbocharged', 100, 148, 20.0, 6, '195/55 R17'),
(41, 'Alpha 1.0 Turbo AT', 13.04, 'Petrol', 'Automatic', 998, 'Turbocharged', 100, 148, 20.0, 6, '195/55 R17'),
(41, 'Delta CNG', 9.30, 'CNG', 'Manual', 1197, 'Naturally Aspirated', 77, 98, 28.5, 6, '195/60 R16');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(41, 'Earthen Brown', '#7B5B3A'), (41, 'Nexa Blue', '#1A237E'), (41, 'Arctic White', '#F8F8FF'),
(41, 'Grandeur Grey', '#71797E'), (41, 'Opulent Red', '#8B0000'), (41, 'Midnight Black', '#1C1C1C');

-- 42. Alto
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Alto', 'Entry Hatchback', 5, NULL, NULL, 3.54, 5.37, 160, 177, 27, 'India''s most affordable car. Perfect for first-time buyers with unmatched fuel efficiency and low maintenance.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(42, 'Std', 3.54, 'Petrol', 'Manual', 796, 'Naturally Aspirated', 48, 69, 22.1, 2, '145/80 R12'),
(42, 'LXi', 4.40, 'Petrol', 'Manual', 796, 'Naturally Aspirated', 48, 69, 22.1, 2, '145/80 R12'),
(42, 'VXi AGS', 5.00, 'Petrol', 'AMT', 796, 'Naturally Aspirated', 48, 69, 22.1, 2, '155/65 R14'),
(42, 'VXi+ AGS', 5.37, 'Petrol', 'AMT', 796, 'Naturally Aspirated', 48, 69, 22.1, 2, '155/65 R14'),
(42, 'LXi CNG', 5.20, 'CNG', 'Manual', 796, 'Naturally Aspirated', 41, 60, 31.6, 2, '145/80 R12');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(42, 'Solid White', '#FFFFFF'), (42, 'Silky Silver', '#C0C0C0'), (42, 'Metallic Granite Grey', '#5C5C5C'),
(42, 'Sizzling Red', '#CC0000'), (42, 'Cerulean Blue', '#2A52BE');

-- 43. Eeco
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Eeco', 'Van/MPV', 7, NULL, NULL, 5.32, 6.58, 160, 0, 40, 'Versatile van for family and commercial use. Spacious cabin with 5 or 7 seats. Also available in CNG.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(43, '5 Seater', 5.32, 'Petrol', 'Manual', 1196, 'Naturally Aspirated', 73, 98, 16.1, 2, '155/70 R13'),
(43, '7 Seater', 5.65, 'Petrol', 'Manual', 1196, 'Naturally Aspirated', 73, 98, 16.1, 2, '155/70 R13'),
(43, '5 Seater CNG', 5.98, 'CNG', 'Manual', 1196, 'Naturally Aspirated', 62, 85, 20.9, 2, '155/70 R13'),
(43, '7 Seater CNG', 6.58, 'CNG', 'Manual', 1196, 'Naturally Aspirated', 62, 85, 20.9, 2, '155/70 R13');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(43, 'Superior White', '#F5F5F5'), (43, 'Silky Silver', '#C0C0C0'), (43, 'Pearl Midnight Black', '#1C1C1C');

-- 44. Grand Vitara
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Grand Vitara', 'Mid-size SUV', 5, 5, NULL, 11.00, 20.09, 210, 373, 45, 'Premium mid-size SUV with strong hybrid and AllGrip AWD. Best-in-class fuel efficiency with 5-star safety.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(44, 'Sigma 1.5 Smart Hybrid MT', 11.00, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 103, 137, 21.1, 6, '215/60 R16'),
(44, 'Delta 1.5 Smart Hybrid MT', 12.50, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 103, 137, 21.1, 6, '215/60 R16'),
(44, 'Zeta 1.5 Strong Hybrid eCVT', 16.00, 'Hybrid', 'CVT', 1462, 'Naturally Aspirated', 116, 122, 27.9, 6, '215/55 R17'),
(44, 'Alpha+ 1.5 Strong Hybrid eCVT', 20.09, 'Hybrid', 'CVT', 1462, 'Naturally Aspirated', 116, 122, 27.9, 6, '215/55 R17'),
(44, 'Zeta+ AllGrip MT', 15.50, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 103, 137, 20.4, 6, '215/60 R16');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(44, 'Arctic White', '#F8F8FF'), (44, 'Nexa Blue', '#1A237E'), (44, 'Chestnut Brown', '#6B4423'),
(44, 'Grandeur Grey', '#71797E'), (44, 'Celestial Blue', '#2E5090'), (44, 'Midnight Black', '#1C1C1C');

-- 45. XL6
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'XL6', 'Premium MPV', 6, NULL, NULL, 11.29, 14.55, 185, 209, 45, 'Premium 6-seat MPV with captain seats. Upmarket Ertiga sibling with Smart Hybrid technology.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(45, 'Zeta MT', 11.29, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 105, 138, 20.9, 6, '185/65 R15'),
(45, 'Alpha MT', 12.50, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 105, 138, 20.9, 6, '185/65 R15'),
(45, 'Alpha+ AT', 13.80, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 105, 138, 20.3, 6, '185/65 R15'),
(45, 'Alpha+ AT Dual Tone', 14.55, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 105, 138, 20.3, 6, '185/65 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(45, 'Nexa Blue', '#1A237E'), (45, 'Arctic White', '#F8F8FF'), (45, 'Magma Grey', '#5C5C5C'),
(45, 'Brave Khaki', '#8B7D3C'), (45, 'Midnight Black', '#1C1C1C');

-- 46. S Presso
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'S Presso', 'Micro SUV', 5, 1, NULL, 4.26, 6.12, 180, 270, 27, 'Entry SUV-style hatchback with tall stance. SUV-inspired design at hatchback pricing for first-time buyers.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(46, 'Std', 4.26, 'Petrol', 'Manual', 998, 'Naturally Aspirated', 67, 89, 25.3, 2, '165/70 R14'),
(46, 'LXi', 4.80, 'Petrol', 'Manual', 998, 'Naturally Aspirated', 67, 89, 25.3, 2, '165/70 R14'),
(46, 'VXi+ AGS', 5.50, 'Petrol', 'AMT', 998, 'Naturally Aspirated', 67, 89, 25.3, 2, '165/70 R14'),
(46, 'VXi+ CNG', 6.12, 'CNG', 'Manual', 998, 'Naturally Aspirated', 57, 82, 32.7, 2, '165/70 R14');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(46, 'Solid White', '#FFFFFF'), (46, 'Silky Silver', '#C0C0C0'), (46, 'Sizzling Red', '#CC0000'),
(46, 'Granite Grey', '#5C5C5C'), (46, 'Cerulean Blue', '#2A52BE');

-- 47. Ignis
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Ignis', 'Urban Crossover', 5, 3, NULL, 5.84, 8.29, 180, 260, 32, 'Quirky urban crossover with retro-modern design. High ground clearance and peppy engine for city driving.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(47, 'Sigma', 5.84, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 83, 113, 20.9, 2, '175/65 R15'),
(47, 'Delta', 6.60, 'Petrol', 'Manual', 1197, 'Naturally Aspirated', 83, 113, 20.9, 2, '175/65 R15'),
(47, 'Zeta AGS', 7.40, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 83, 113, 20.9, 2, '175/65 R15'),
(47, 'Alpha AGS', 8.29, 'Petrol', 'AMT', 1197, 'Naturally Aspirated', 83, 113, 20.9, 2, '175/65 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(47, 'Nexa Blue', '#1A237E'), (47, 'Lucent Orange', '#FF7036'), (47, 'Arctic White', '#F8F8FF'),
(47, 'Glistening Grey', '#71797E'), (47, 'Uptown Red with Silver', '#B22234');

-- 48. Celerio
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Celerio', 'Hatchback', 5, NULL, NULL, 5.37, 7.09, 160, 313, 32, 'Easy-to-drive hatchback with best-in-class mileage. Compact dimensions perfect for navigating tight city streets.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(48, 'LXi', 5.37, 'Petrol', 'Manual', 998, 'Naturally Aspirated', 67, 89, 25.2, 2, '155/65 R14'),
(48, 'VXi', 5.87, 'Petrol', 'Manual', 998, 'Naturally Aspirated', 67, 89, 25.2, 2, '165/70 R14'),
(48, 'ZXi AGS', 6.50, 'Petrol', 'AMT', 998, 'Naturally Aspirated', 67, 89, 25.2, 3, '165/70 R14'),
(48, 'ZXi+ AGS', 7.09, 'Petrol', 'AMT', 998, 'Naturally Aspirated', 67, 89, 25.2, 3, '165/70 R14'),
(48, 'VXi CNG', 6.74, 'CNG', 'Manual', 998, 'Naturally Aspirated', 57, 82, 35.6, 2, '155/65 R14');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(48, 'Arctic White', '#F8F8FF'), (48, 'Silky Silver', '#C0C0C0'), (48, 'Speedy Blue', '#2A52BE'),
(48, 'Glistening Grey', '#71797E'), (48, 'Caffeine Brown', '#6F4E37');

-- 49. Jimny
INSERT INTO cars (brand_id, model_name, body_type, seating_capacity, ncap_rating, bncap_rating, price_min, price_max, ground_clearance_mm, boot_space_litres, fuel_tank_capacity, description) VALUES (6, 'Jimny', 'Off-Road SUV', 4, 3, NULL, 12.74, 15.05, 210, 208, 40, 'Compact 4x4 off-roader with legendary Suzuki capability. Ladder-frame chassis with AllGrip Pro for serious off-roading.');

INSERT INTO variants (car_id, variant_name, price_lakh, fuel_type, transmission, engine_cc, engine_type, power_bhp, torque_nm, mileage_kmpl, num_airbags, tyre_size) VALUES
(49, 'Zeta MT', 12.74, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 105, 138, 16.9, 6, '195/80 R15'),
(49, 'Alpha MT', 13.50, 'Petrol', 'Manual', 1462, 'Naturally Aspirated', 105, 138, 16.9, 6, '195/80 R15'),
(49, 'Alpha AT', 14.30, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 105, 138, 16.0, 6, '195/80 R15'),
(49, 'Alpha AT Dual Tone', 15.05, 'Petrol', 'Automatic', 1462, 'Naturally Aspirated', 105, 138, 16.0, 6, '195/80 R15');

INSERT INTO colors (car_id, color_name, hex_code) VALUES
(49, 'Kinetic Yellow', '#FFD700'), (49, 'Sizzling Red', '#CC0000'), (49, 'Nexa Blue', '#1A237E'),
(49, 'Bluish Black', '#1C2331'), (49, 'Pearl Arctic White', '#F8F8FF'), (49, 'Granite Grey', '#5C5C5C');
