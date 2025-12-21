
# Mini-Mercearia (Promoções + Take-away)

API em Node.js + Express + MongoDB (Mongoose).
- 3 promoções ativas
- Pratos do dia (almoço/jantar) & grelhados
- Encomendas com slots e gestão de stock
- Admin/staff com JWT

## Como correr
1) Copiar .env:
   cp .env.example .env

2) Instalar deps:
   npm install

3) (Opcional) editar MONGO_URI no .env  
   - Local: mongodb://localhost:27017/mini_mercearia  
   - Atlas: a tua connection string

4) Semear dados:
   npm run seed

5) Iniciar API:
   npm run dev   # http://localhost:4000

## Endpoints
- GET /promotions
- GET /dailydishes?date=YYYY-MM-DD
- GET /products?category=grill&available=true
- POST /orders
- (JWT) POST /products, POST /promotions, POST /dailydishes, GET /orders, PATCH /orders/:id/status

## Admin
POST /auth/bootstrap-admin {"email","password"}
POST /auth/login {"email","password"} → token JWT


## Extra — Favoritos (Wishlist)
- Cliente pode marcar produtos como favoritos (❤) e filtrar "Só favoritos".
- Guardado na BD em `User.favorites`.
- Endpoints:
  - `GET /favorites` (auth)
  - `POST /favorites/:productId` (auth)
  - `DELETE /favorites/:productId` (auth)
