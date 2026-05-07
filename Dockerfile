# Use an official Bun runtime as a parent image
FROM oven/bun:1-debian AS base

# Set the working directory to /app
WORKDIR /app

# Install build dependencies for native modules in a single layer
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Dependencies installation stage
FROM base AS deps

# Copy only package files for better caching
COPY package.json bun.lock* ./

# Install app dependencies
RUN bun install

# Copy the rest of the application code to the container
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Copy only necessary files from deps stage
COPY --from=deps /app/dist ./dist
COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules

# Start the app
CMD ["bun", "dist/index.js"]
