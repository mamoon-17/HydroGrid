#!/bin/bash
git pull origin main
npm install
npm run build
cp .env ./dist/.env
pm2 reload main