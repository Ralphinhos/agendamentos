# Simple development Dockerfile for Vite + React + Tailwind
FROM node:20-alpine
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy sources
COPY . .

EXPOSE 8080

# Run dev server (HMR enabled)
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","8080"]
