# Stage 1: Install dependencies and build the application
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create a minimal image for production
FROM node:20-alpine as production

# Set working directory
WORKDIR /app

# Set environment variable
ENV NODE_ENV=production

# Copy only the necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Install only production dependencies
RUN npm ci --only=production

# Start the application
CMD ["node", "dist/main"]