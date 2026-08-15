# Workspace Architecture Rules

## Layer-Based Architecture (Approach 1)
This project follows **Approach 1 (Layer-Based Architecture)** for React Native:

### Folder Structure Convention:
- `src/api/` - API client (Axios/Fetch), endpoints, and remote data fetching services.
- `src/components/` - Reusable UI components divided into:
  - `common/` - Pure UI components (Buttons, Inputs, Cards, Badges, Modals).
  - `layout/` - Layout components (Header, BottomTabBar, CustomDrawer).
- `src/hooks/` - Custom React hooks for business logic and state.
- `src/navigation/` - React Navigation stack, tab definitions, contexts, and navigation types.
- `src/screens/` - Screen views organized by domain subfolders:
  - `auth/` - Authentication screens (Landing, Login, Signup, Otp, SetPassword).
  - `home/` - Dashboard screens (Home).
  - `events/` - Event management screens (Events).
  - `drivers/` - Driver screens (Drivers, DriverProfile).
  - `organizations/` - Organization screens.
  - `notifications/` - Notification screens.
  - `results/` - Leaderboard & Results screens.
  - `settings/` - User & App settings screens.
- `src/store/` - Global state management (Zustand, Redux Toolkit, or React Context).
- `src/theme/` - Design system (colors, typography, spacing, shadows).
- `src/types/` - Shared TypeScript definitions, models, and interfaces.
- `src/utils/` - Shared helper functions, formatters, and validation logic.
- `assets/` - Static app assets (fonts, images, icons).
