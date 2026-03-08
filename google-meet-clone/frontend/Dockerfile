# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package info and install deps
COPY package*.json ./
RUN npm install

# Copy the source code and build
COPY . .
RUN npm run build

# Production stage
# Use a lightweight Nginx server to serve the static built files
FROM nginx:alpine

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom nginx configuration to support React Router SPAs
# We create a simple inline conf that routes 404s back to index.html
RUN echo "server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files \$uri \$uri/ /index.html; \
    } \
    }" > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
