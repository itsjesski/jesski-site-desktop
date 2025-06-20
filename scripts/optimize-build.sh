#!/bin/bash

# Digital Ocean Build Optimization Script
# This script optimizes the build process for faster deployment

echo "🚀 Starting optimized build process..."

# Set build environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export GENERATE_SOURCEMAP=false
export DISABLE_ESLINT_PLUGIN=true

# Clear any existing build artifacts
echo "🧹 Cleaning previous builds..."
rm -rf dist/ build/ .next/ out/

# Install dependencies with optimizations
echo "📦 Installing dependencies..."
npm ci --only=production --silent --no-audit --no-fund --prefer-offline

# Build the application
echo "🔨 Building application..."
npm run build

# Optimize build output
echo "⚡ Optimizing build output..."

# Remove source maps if they exist
find dist/ -name "*.map" -type f -delete 2>/dev/null || true

# Compress large files
if command -v gzip &> /dev/null; then
    find dist/ -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -9 -k {} \;
    echo "✅ Compressed static assets"
fi

# Display build size information
if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    echo "📊 Build size: $BUILD_SIZE"
    
    # List largest files
    echo "📁 Largest build files:"
    find dist/ -type f -exec du -h {} \; | sort -rh | head -5
fi

echo "✅ Build optimization complete!"
echo "🚀 Ready for deployment to Digital Ocean"
