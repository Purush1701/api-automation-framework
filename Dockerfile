FROM cypress/included:latest

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  python3 \
  make \
  && rm -rf /var/lib/apt/lists/*

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy Cypress configuration files
COPY cypress.config.*.js cypress.common.js ./

# Copy the rest of the application code
COPY . .

# Verify files
RUN ls -la /app

# Set environment variable for configuration file
ARG ENV_NAME=staging
ENV CYPRESS_CONFIG_FILE cypress.config.${ENV_NAME}.js

# Run Cypress tests
CMD ["npx", "cypress", "run", "--config-file", "$CYPRESS_CONFIG_FILE"]
