FROM node:20-slim

# Prisma needs OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (faster rebuilds)
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

# Copy the rest of the code
COPY . .

EXPOSE 3000

# Creates tables, adds sample data, then starts the server
CMD ["npm", "run", "docker:start"]
