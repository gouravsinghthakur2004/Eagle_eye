# Eagle Eye

A React Native mobile application for Event Management, Driver & Navigator tracking, and Fleet monitoring.

## Features & Stack
- **Framework**: React Native (`0.86.2`), React (`19.2.3`), TypeScript
- **State & Context**: Custom Context API, Async Storage
- **Native Platforms**: Android & iOS
- **Cloud CI/CD**: GitHub Actions workflow for automated iOS `.ipa` builds

## Automated iOS Cloud Builds
This repository includes a GitHub Actions workflow at `.github/workflows/ios-build.yml` which automatically compiles iOS builds (`.ipa`) on macOS cloud runners.

## Getting Started
```bash
# 1. Install dependencies
cd EagleEye
npm install

# 2. Start Metro bundler
npm run start

# 3. Run Android
npm run android

# 4. Run iOS (macOS required)
npm run ios
```
