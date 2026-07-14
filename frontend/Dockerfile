FROM node:22-alpine

WORKDIR /app

ARG BACKEND_URL=http://backend:8000
ARG NEXT_PUBLIC_API_BASE_URL=
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]
