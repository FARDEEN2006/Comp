# Second-Hand Component Marketplace Backend

Spring Boot backend (embedded Apache Tomcat) with MySQL.

## Quick Start

1. Create database in MySQL:
   - `CREATE DATABASE secondhand_marketplace;`

2. Set environment variables (PowerShell):
   - `$env:DB_HOST="localhost"`
   - `$env:DB_PORT="3306"`
   - `$env:DB_NAME="secondhand_marketplace"`
   - `$env:DB_USER="root"`
   - `$env:DB_PASSWORD="your_mysql_password"`

3. Run the app:
   - `mvn spring-boot:run`

4. Health check:
   - `GET http://localhost:8080/health`

## Main APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products?search=`
- `GET /api/products/{id}`
- `GET /api/my-listings/{sellerId}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `PUT /api/users/{id}`
- `PUT /api/users/{id}/password`
