# Use nginx alpine for lightweight container
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy SSL certificates (if they exist)
COPY ssl /etc/nginx/ssl

# Expose port
EXPOSE 80