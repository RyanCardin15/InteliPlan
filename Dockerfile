FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Remove development dependencies 
RUN npm prune --production

# Create and set permissions for the feature plans directory
RUN mkdir -p ./feature-plans && chown -R node:node ./feature-plans

# Use non-root user for security
USER node

# Set environment variables
ENV NODE_ENV=production

# Expose MCP server port if needed
# EXPOSE 8080

# Start the MCP server
CMD ["node", "dist/index.js"] 