# Docker Deployment for Tekup CRM Web

## Byg og kør med Docker

1. Byg Docker image:
   ```sh
   docker build -t tekup-crm-web .
   ```
2. Start med docker-compose:
   ```sh
   docker-compose up -d
   ```
3. Applikationen kører nu på http://localhost:3000

## Miljøvariabler
Se `.env.example` for nødvendige variabler.

## Produktionstips
- Brug `NODE_ENV=production` for optimal performance
- Tilføj reverse proxy (nginx) for HTTPS og caching
- Tilføj evt. database/redis services i docker-compose
