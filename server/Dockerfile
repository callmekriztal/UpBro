# Node.js Production Dockerfile for Server & Worker
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
