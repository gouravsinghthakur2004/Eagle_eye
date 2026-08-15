# EagleEye Architecture Blueprint Applied

This document records the architectural refactoring applied to the **EagleEye** Motorsports React Native application according to the approved **NaviQuest Blueprint Architecture**.

---

## 1. Final Folder Tree

```txt
EagleEye/
 ├── .env
 ├── .env.example
 ├── babel.config.js
 ├── tsconfig.json
 ├── EagleEye_Blueprint_Applied.md
 ├── App.tsx
 ├── index.js
 └── src/
      ├── api/
      │    ├── client.ts
      │    ├── endpoints.ts
      │    └── index.ts
      ├── services/
      │    ├── authService.ts
      │    ├── eventService.ts
      │    ├── bookingService.ts
      │    ├── profileService.ts
      │    ├── driverService.ts
      │    ├── organizationService.ts
      │    ├── resultService.ts
      │    └── index.ts
      ├── components/
      │    ├── common/
      │    │    ├── PrimaryButton.tsx
      │    │    ├── SecondaryButton.tsx
      │    │    ├── EventCard.tsx
      │    │    └── index.ts
      │    ├── forms/
      │    │    ├── InputField.tsx
      │    │    └── index.ts
      │    ├── layout/
      │    │    ├── Header.tsx
      │    │    ├── BottomTabBar.tsx
      │    │    ├── CustomDrawer.tsx
      │    │    ├── DrawerItem.tsx
      │    │    └── index.ts
      │    └── index.ts
      ├── screens/
      │    ├── auth/
      │    │    ├── LandingScreen.tsx
      │    │    ├── SignupScreen.tsx
      │    │    ├── OtpScreen.tsx
      │    │    ├── SetPasswordScreen.tsx
      │    │    ├── LoginScreen.tsx
      │    │    └── index.ts
      │    ├── home/
      │    │    ├── HomeScreen.tsx
      │    │    └── index.ts
      │    ├── events/
      │    │    ├── EventsScreen.tsx
      │    │    └── index.ts
      │    ├── drivers/
      │    │    ├── DriversScreen.tsx
      │    │    ├── DriverProfileScreen.tsx
      │    │    └── index.ts
      │    ├── organizations/
      │    │    ├── OrganizationsScreen.tsx
      │    │    └── index.ts
      │    ├── results/
      │    │    ├── ResultsScreen.tsx
      │    │    └── index.ts
      │    ├── notifications/
      │    │    ├── NotificationsScreen.tsx
      │    │    └── index.ts
      │    ├── settings/
      │    │    ├── SettingsScreen.tsx
      │    │    └── index.ts
      │    └── index.ts
      ├── navigation/
      │    ├── AppNavigator.tsx
      │    ├── AuthNavigator.tsx
      │    ├── MainNavigator.tsx
      │    └── index.ts
      ├── context/
      │    ├── NavigationContext.tsx
      │    └── index.ts
      ├── hooks/
      │    ├── useDebounce.ts
      │    └── index.ts
      ├── utils/
      │    └── index.ts
      ├── constants/
      │    └── index.ts
      ├── assets/
      │    └── index.ts
      ├── theme/
      │    ├── colors.ts
      │    └── index.ts
      └── features/
           ├── auth/
           │    └── index.ts
           ├── events/
           │    └── index.ts
           ├── bookings/
           │    └── index.ts
           └── profile/
                └── index.ts
```

---

## 2. Key File Locations

### API Architecture
- **Central Client Instance**: `src/api/client.ts`
- **Endpoint Definitions**: `src/api/endpoints.ts`
- **API Module Export**: `src/api/index.ts`

### Service Layer
- **Auth Service**: `src/services/authService.ts`
- **Event Service**: `src/services/eventService.ts`
- **Booking Service**: `src/services/bookingService.ts`
- **Profile Service**: `src/services/profileService.ts`
- **Driver Service**: `src/services/driverService.ts`
- **Organization Service**: `src/services/organizationService.ts`
- **Result Service**: `src/services/resultService.ts`
- **Services Barrel Export**: `src/services/index.ts`

### Navigation Organization
- **Top-Level Root Switcher**: `src/navigation/AppNavigator.tsx`
- **Authentication Flow Stack**: `src/navigation/AuthNavigator.tsx`
- **Main Dashboard & Layout Stack**: `src/navigation/MainNavigator.tsx`

---

## 3. Alias Configuration

### Babel Configuration (`babel.config.js`)
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
```

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "types": ["jest"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 4. How-To Guides

### How to Add a New Feature Module (e.g. `telemetry`)

1. **Add Endpoints**: Add API paths to `src/api/endpoints.ts`.
2. **Create Service**: Add `src/services/telemetryService.ts` to execute API requests using `api` from `@/api`.
3. **Export Service**: Re-export from `src/services/index.ts`.
4. **Create Screen Component**: Place your screen in `src/screens/telemetry/TelemetryScreen.tsx`.
5. **Create Feature Index**: Create `src/features/telemetry/index.ts` re-exporting its services and screens.
6. **Register Route**: Add the screen name to `ScreenName` in `src/context/NavigationContext.tsx` and map it in `src/navigation/MainNavigator.tsx`.

---

## 5. How to Change API Base URL for Production Deployment

1. **Environment File (`.env`)**: Update `API_BASE_URL` in `.env`:
   ```env
   API_BASE_URL=https://api.production.eagleeye-motorsports.com/v1
   ENV_NAME=production
   ```
2. **Central Client Fallback (`src/api/client.ts`)**: If needed, update default fallback URL in `API_BASE_URL` in `src/api/client.ts`.
