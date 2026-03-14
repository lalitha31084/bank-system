FROM node:18

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies including typescript
RUN npm install

# Copy the rest of your code
COPY . .

# Install ts-node globally to run .ts files directly, or build them
RUN npm install -g ts-node typescript

EXPOSE 8080

# Start the app using ts-node since your main file is in src/
CMD [ "ts-node", "src/index.ts" ]