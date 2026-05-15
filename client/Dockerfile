# ── Frontend Dockerfile (2-stage build) ──

# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build เป็น static files (dist/)
# VITE_API_URL ชี้ไปที่ /api เพื่อให้ Nginx proxy ต่อ
RUN VITE_API_URL=/api npm run build

# Stage 2: Serve ด้วย Nginx (เบา เร็ว production-grade)
FROM nginx:alpine

# Copy ไฟล์ที่ build แล้วไปไว้ใน Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# ใช้ config ของเราแทนค่า default
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
