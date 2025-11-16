# Use nginx alpine for lightweight container
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Test nginx configuration
RUN nginx -t

# Copy SSL certificates (if they exist)
COPY ssl /etc/nginx/ssl

# Expose port
EXPOSE 80