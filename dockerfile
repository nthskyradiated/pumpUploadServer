# Stage 1: Build
FROM node:current-slim as build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy source code and build
COPY . .
RUN pnpm add -g typescript
RUN pnpm build

# Stage 2: Runtime
FROM node:current-slim

# Set working directory
WORKDIR /usr/src/app

# Copy only runtime dependencies and built files
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/pnpm-lock.yaml ./

# Install only production dependencies
RUN npm install -g pnpm && pnpm install --prod

# Expose port and set the entrypoint
EXPOSE 3000
CMD ["node", "dist/index.js"]
