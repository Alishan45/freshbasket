#!/usr/bin/env bash
# FreshBasket Full-Stack React + Node.js Platform Launcher
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo "🌱 Starting FreshBasket Full-Stack React Platform"
echo "=========================================================="

# Check if client bundle exists, build if missing
if [ ! -d "client/dist" ]; then
  echo "📦 Building client production assets..."
  (cd client && npm run build)
fi

echo "🚀 Launching Node.js API & React Server on http://localhost:5000"
echo "👉 Storefront:         http://localhost:5000"
echo "👉 Admin Hub:          http://localhost:5000/admin"
echo "👉 Supplier Portal:    http://localhost:5000/supplier"
echo "👉 Order Tracking:     http://localhost:5000/track-order"
echo "👉 Health Check:       http://localhost:5000/api/health"
echo "=========================================================="
echo "Default Accounts:"
echo " • Customer:  customer@freshbasket.com  / Customer@123"
echo " • Admin:     admin@freshbasket.com     / Admin@123"
echo " • Supplier:  supplier@freshbasket.com  / Supplier@123"
echo "=========================================================="

node server/src/server.js
