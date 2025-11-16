# Use nginx alpine for lightweight container
FROM nginx:alpine

# Copy static files to nginx html directory
COPY index.html script.js styles.css /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]