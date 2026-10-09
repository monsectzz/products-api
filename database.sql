CREATE DATABASE IF NOT EXISTS products_db;
USE products_db;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  description TEXT NOT NULL,
  brand VARCHAR(100) NULL,
  img VARCHAR(500) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO products (name, price, stock, description, brand, img) VALUES
('Teclado mecánico', 899.90, 25, 'Teclado mecánico retroiluminado', 'Logitech', NULL),
('Mouse inalámbrico', 349.00, 40, 'Mouse ergonómico 2.4GHz', 'Logitech', NULL);
