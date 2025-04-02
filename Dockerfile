# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory to /app
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the container
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install app dependencies
RUN pnpm install

# Copy the rest of the application code to the container
COPY . .

# Building the app
RUN pnpm build

# Expose port 3000 for the app to listen on
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]
