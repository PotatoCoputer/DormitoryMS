# ── Backend Dockerfile ──
# Stage เดียว เพราะ Node.js ไม่ต้อง build
FROM node:20-alpine

# ตั้ง working directory ในกล่อง
WORKDIR /app

# Copy package.json ก่อน (ทำให้ layer cache ทำงานได้เร็วขึ้น)
COPY package*.json ./

# ติดตั้ง dependencies เฉพาะ production
RUN npm install --omit=dev

# Copy โค้ดทั้งหมด
COPY . .

# เปิด port 5000
EXPOSE 5000

# รัน server
CMD ["node", "src/index.js"]
