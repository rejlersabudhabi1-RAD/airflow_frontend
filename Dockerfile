# ========================================================================
# Production-Grade Multi-Stage Dockerfile for React Frontend
# ========================================================================
# Purpose: Build optimized React app with Nginx for production
# Security: Non-root user, minimal attack surface
# Performance: Multi-stage build, optimized layers, minimal image size
# ========================================================================

# ========================================================================
# STAGE 1: Builder - Build React application
# ========================================================================
FROM node:20-alpine AS builder

# Metadata
LABEL maintainer="AIFlow DevOps Team"
LABEL version="1.0"
LABEL description="AIFlow Frontend - Production Ready"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci --silent && \
    npm cache clean --force

# Copy application source
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# ========================================================================
# STAGE 2: Production - Serve with Nginx
# ========================================================================
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S -D -H -u 1001 -h /usr/share/nginx/html -s /sbin/nologin -G nginx-app -g nginx-app nginx-app && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Switch to non-root user
USER nginx-app

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
