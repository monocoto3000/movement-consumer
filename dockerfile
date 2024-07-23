# Usa una imagen base oficial de Node.js
FROM node:20.11.1-slim

# Establece el directorio de trabajo en el contenedor
WORKDIR movement.consumer

# Copia el package.json y package-lock.json (si existe) primero para aprovechar el cache de Docker
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código del proyecto al contenedor
COPY . .

# Compila el código TypeScript
RUN npm run build

COPY . .

# Expone el puerto en el que tu aplicación se ejecuta
EXPOSE 3038

# Comando para ejecutar la aplicación
CMD ["npm", "run", "start"]
