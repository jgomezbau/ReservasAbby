FROM node:18-alpine as build

WORKDIR /app

COPY package.json .
COPY package-lock.json* .

RUN npm install

COPY . .

RUN npm run build

# Etapa de producción
FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html

# Configuración para que todas las rutas redireccionen a index.html (para React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]