# Development Dockerfile for Vite + React + Tailwind using Bun
FROM oven/bun:1

WORKDIR /app

# Install dependencies
# Copy package.json and the lockfile
COPY package.json bun.lock ./
# Use --frozen-lockfile to ensure we use the exact versions from the lockfile
RUN bun install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Expose the port Vite runs on
EXPOSE 8080

# Run the development server
# The --host flag is required to expose the server to the host machine
CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "8080"]
