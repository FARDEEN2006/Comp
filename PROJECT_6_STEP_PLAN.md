# Second-Hand Component Marketplace: 6-Step Fast Execution Plan

## Step 1: Backend Setup (Done)
- Spring Boot backend created with embedded Apache Tomcat.
- Layers implemented: controller, service, repository, entity, DTO, exception handling.
- Health endpoint: `GET /health`.

## Step 2: MySQL Setup + Connection (Done)
- Database created: `secondhand_marketplace`.
- Backend connected with env vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Tables auto-created: `users`, `products`.

## Step 3: API Implementation + Validation (Done)
- Auth APIs:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Product APIs:
  - `GET /api/products?search=`
  - `GET /api/products/{id}`
  - `GET /api/my-listings/{sellerId}`
  - `POST /api/products`
  - `PUT /api/products/{id}`
  - `DELETE /api/products/{id}`
- User settings APIs:
  - `PUT /api/users/{id}`
  - `PUT /api/users/{id}/password`

## Step 4: Frontend Connected to Backend (Done)
- Login and register pages call real auth APIs.
- Home page loads products from backend.
- Product details page reads product by ID from backend.
- My Listings page loads logged-in user's products.
- Add Product form submits to backend.
- Settings page updates profile/password via backend.
- User session is stored in browser localStorage.

## Step 5: Deploy to Render (Next)
1. Push project to GitHub.
2. Create external MySQL service (Aiven/Railway/PlanetScale).
3. Set backend env vars on Render:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`
4. Deploy backend service from `backend`.
5. Deploy frontend as static site.
6. Update frontend `API_BASE` to Render backend URL.

## Step 6: Final QA + Demo (Next)
- Test full flow:
  1. Register
  2. Login
  3. Add product
  4. View home and product details
  5. My listings delete/edit path
  6. Update settings
- Verify responsive UI (mobile + desktop).
