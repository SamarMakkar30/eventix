FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite exposes VITE_* environment variables at build time.
# For local Docker development, the frontend talks to the API Gateway on port 8080.
# For Kubernetes, pass the public Gateway URL as a build argument.
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve@14.2.4

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
