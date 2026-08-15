# Technical Build Flow & Architecture: Eagle Eye React Native App

This document presents the actual technical build flow, file responsibilities, native SDK configurations, and execution path for the **Eagle Eye** React Native application based strictly on the current codebase.

---

# 1. Actual Build Flow of This App

The build process transforms TypeScript/React Native code into native Android (`.apk` / `.aab`) and iOS (`.ipa`) packages.

### Step-by-Step Flow

1. **Developer Code Entry**: Developer writes UI components, screens, and navigation logic in TypeScript/React (`App.tsx`, `src/**/*.tsx`).
2. **TypeScript Compilation & Babel Transformation**: Babel (`@react-native/babel-preset`) converts modern TypeScript/JSX code into JavaScript compatible with the Hermes JavaScript engine.
3. **Metro Bundler Server**: Metro (`@react-native/metro-config`) bundles JavaScript files and static assets into a single bundle (`index.bundle`), serving it over HTTP (`http://localhost:8081`) during development or embedding it into the native app package for production.
4. **Native Platform Build Initiation**:
   - **Android**: `react-native run-android` triggers Gradle (`gradlew`).
   - **iOS**: `react-native run-ios` triggers Xcode (`xcodebuild`).
5. **Native Dependency Resolution**:
   - **Android**: Gradle reads `android/settings.gradle` & `android/app/build.gradle` to process C++/Kotlin/Java dependencies and autolink C++ TurboModules / Fabric components.
   - **iOS**: CocoaPods reads `ios/Podfile` to resolve and link native iOS Pods and C++ dependencies (`use_react_native!`, autolinking via `use_native_modules!`).
6. **Native Code Compilation**:
   - **Android**: Kotlin compiler compiles `MainActivity.kt` and `MainApplication.kt`, CMake/NDK builds native C++ code for Hermes/Fabric, and AAPT2 compiles resources into DEX/binary format.
   - **iOS**: Xcode compiles `AppDelegate.swift`, storyboard UI files, and native C++/Swift dependencies.
7. **Artifact Packaging**:
   - **Android**: Gradle packages compiled DEX, native libraries (`.so`), assets, and Hermes bytecode into `app-debug.apk` or `app-release.apk` / `app-release.aab`.
   - **iOS**: Xcode links compiled binaries, bundled JS, and resources into an `.app` bundle or signed `.ipa` archive.

### Architectural Build Flow Diagram

```
[ Developer Writes TSX Code ] 
       │
       ▼
[ Babel Transformation (@react-native/babel-preset) ]
       │
       ▼
[ Metro Bundler (metro.config.js -> index.bundle) ]
       │
       ├──────────────────────────────────────────┐
       ▼                                          ▼
[ Android Native Build ]                   [ iOS Native Build ]
  - Gradle (gradlew)                         - Xcode (xcodebuild)
  - settings.gradle                          - CocoaPods (ios/Podfile)
  - app/build.gradle                         - project.pbxproj
  - MainApplication.kt / MainActivity.kt      - AppDelegate.swift
  - Hermes Engine & Fabric C++               - Hermes Engine & Fabric C++
       │                                          │
       ▼                                          ▼
[ APK / AAB Executable ]                   [ IPA / Archive Bundle ]
```

---

# 2. Tools Actually Used in This Project

The following table details the core build tools and dependencies configured in this codebase:

| Tool | What It Is | Why This Project Uses It | Which File Shows Its Usage |
| :--- | :--- | :--- | :--- |
| **React Native** (`v0.86.2`) | Cross-platform mobile framework by Meta. | Serves as the primary framework to render mobile UI natively on Android & iOS using JavaScript/TypeScript. | [`EagleEye/package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json), [`EagleEye/App.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/App.tsx) |
| **React** (`v19.2.3`) | UI component framework. | Provides component state management (`useState`, `useContext`, `createContext`) and JSX syntax. | [`EagleEye/package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json), [`EagleEye/src/navigation/NavigationContext.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/navigation/NavigationContext.tsx) |
| **Node.js** (`>= 22.11.0`) | JavaScript runtime environment. | Runs Metro Bundler, package manager scripts, and CLI build tooling. | [`EagleEye/package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json) (engines clause) |
| **npm / package-lock.json** | Node Package Manager. | Manages project dependencies, version locking, and build execution scripts (`npm run android`). | [`EagleEye/package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json), [`EagleEye/package-lock.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package-lock.json) |
| **TypeScript** (`v5.8.3`) | Strongly typed superset of JavaScript. | Provides static typing, interface definitions, and auto-completion across screens and components. | [`EagleEye/tsconfig.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/tsconfig.json), [`EagleEye/package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json) |
| **Metro Bundler** (`v0.86.2`) | React Native JS bundler. | Bundles TypeScript/JavaScript code, resolves modules, and serves hot-reloading updates over WebSocket. | [`EagleEye/metro.config.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/metro.config.js) |
| **Babel** (`v7.25.2`) | JavaScript compiler/transpiler. | Transpiles modern JSX and TypeScript code into engine-compatible JavaScript. | [`EagleEye/babel.config.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/babel.config.js) |
| **Gradle** (`v9.3.1`) | Build automation tool for Android. | Compiles Kotlin/Java source code, links NDK C++ binaries, resolves dependencies, and builds APK/AAB binaries. | [`EagleEye/android/gradle/wrapper/gradle-wrapper.properties`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/gradle/wrapper/gradle-wrapper.properties), [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) |
| **Android SDK / NDK** (`v36` / `27.1.12297006`) | Native Android Development Toolkit. | Compiles the app for Android platform architectures (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`). | [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) |
| **Kotlin** (`v2.1.20`) | Native programming language for Android. | Powers native entry files `MainActivity.kt` and `MainApplication.kt`. | [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle), [`EagleEye/android/app/src/main/java/com/eagleeye/MainApplication.kt`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/src/main/java/com/eagleeye/MainApplication.kt) |
| **CocoaPods** | Dependency manager for iOS native libraries. | Integrates React Native framework pods and native iOS dependencies. | [`EagleEye/ios/Podfile`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/Podfile) |
| **Xcode / Swift** | iOS IDE and Native Swift language. | Compiles native iOS app, links Swift entry `AppDelegate.swift`, and packages the iOS application binary. | [`EagleEye/ios/EagleEye/AppDelegate.swift`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/EagleEye/AppDelegate.swift), [`EagleEye/ios/EagleEye.xcodeproj`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/EagleEye.xcodeproj) |
| **Hermes Engine** | High-performance JS engine optimized for React Native. | Executes JavaScript bundle with fast startup and low memory footprint (enabled by default). | [`EagleEye/android/gradle.properties`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/gradle.properties) |
| **Git** | Source code version control. | Tracks source changes and excludes node/native build artifacts. | [`EagleEye/.gitignore`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/.gitignore) |

---

# 3. Packages Actually Installed

The dependencies declared in [`EagleEye/package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json) are:

### Production Dependencies (`dependencies`)

| Package | Purpose in this app | Where it is used |
| :--- | :--- | :--- |
| **`react`** (`19.2.3`) | Core UI library providing components, context, and hook APIs. | Used throughout [`App.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/App.tsx), [`src/navigation/NavigationContext.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/navigation/NavigationContext.tsx), and all UI screens/components. |
| **`react-native`** (`0.86.2`) | Mobile framework providing core primitives (`View`, `Text`, `StyleSheet`, `TouchableOpacity`, `ScrollView`, `StatusBar`, `AppRegistry`). | Imported across all screens in [`src/screens/`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens) and components in [`src/components/`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/components). |
| **`react-native-safe-area-context`** (`^5.5.2`) | Handles safe area insets (notches, home indicators, status bars) dynamically across devices. | Encapsulates app root in [`App.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/App.tsx) (`SafeAreaProvider`) and screens e.g., [`HomeScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/HomeScreen.tsx) (`SafeAreaView`). |
| **`@react-native/new-app-screen`** (`0.86.2`) | Default template components and styling utilities provided by React Native CLI. | Declared dependency in [`package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json). |

### Development Dependencies (`devDependencies`)

| Package | Purpose in this app | Where it is used |
| :--- | :--- | :--- |
| **`typescript`** (`^5.8.3`) | Type checking compiler for `.ts` and `.tsx` source code. | Configured via [`tsconfig.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/tsconfig.json). |
| **`@react-native-community/cli`** (`20.1.0`) | React Native Command Line Interface. | Powers `npx react-native start`, `run-android`, and `run-ios` commands. |
| **`@react-native-community/cli-platform-android`** (`20.1.0`) | Android build platform plugin for React Native CLI. | Handles Android emulator launching and Gradle invocation. |
| **`@react-native-community/cli-platform-ios`** (`20.1.0`) | iOS build platform plugin for React Native CLI. | Handles iOS simulator launching and Xcode CLI invocation. |
| **`@babel/core`**, **`@babel/preset-env`**, **`@babel/runtime`** | JavaScript compilation pipeline. | Configured via [`babel.config.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/babel.config.js). |
| **`@react-native/babel-preset`** (`0.86.2`) | Babel preset tailored for React Native and Hermes. | Configured in [`babel.config.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/babel.config.js). |
| **`@react-native/metro-config`** (`0.86.2`) | Metro bundling default configuration. | Imported in [`metro.config.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/metro.config.js). |
| **`@react-native/typescript-config`** (`0.86.2`) | Base TypeScript configuration rules for React Native. | Extended in [`tsconfig.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/tsconfig.json). |
| **`eslint`** (`^8.19.0`) & **`@react-native/eslint-config`** | Code quality linter. | Configured via [`.eslintrc.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/.eslintrc.js). |
| **`prettier`** (`2.8.8`) | Code formatter. | Configured via [`.prettierrc.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/.prettierrc.js). |
| **`jest`** (`^29.6.3`), **`@react-native/jest-preset`**, **`react-test-renderer`** | Testing framework for unit tests. | Configured in [`jest.config.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/jest.config.js) and `__tests__/`. |

> **Note on Third-Party Libraries**: Libraries like `@react-navigation/native`, `axios`, `firebase`, `react-native-vector-icons`, or `AsyncStorage` are **not** present in `package.json`. The app uses custom, lightweight React Context state navigation (`NavigationContext.tsx`), native unicode emojis for icons, and in-memory mock data arrays.

---

# 4. SDK and Native Configuration

The exact native SDK configuration values extracted from project files are:

| Configuration Property | Value in Project | Source File Path |
| :--- | :--- | :--- |
| **`compileSdkVersion`** | `36` | [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) & [`EagleEye/android/app/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/build.gradle) |
| **`targetSdkVersion`** | `36` | [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) & [`EagleEye/android/app/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/build.gradle) |
| **`minSdkVersion`** | `24` (Android 7.0 Nougat) | [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) & [`EagleEye/android/app/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/build.gradle) |
| **`buildToolsVersion`** | `"36.0.0"` | [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) |
| **`ndkVersion`** | `"27.1.12297006"` | [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) |
| **`Kotlin version`** | `"2.1.20"` | [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) |
| **`Gradle version`** | `"9.3.1"` | [`EagleEye/android/gradle/wrapper/gradle-wrapper.properties`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/gradle/wrapper/gradle-wrapper.properties) |
| **`iOS deployment target`** | `15.1` | [`EagleEye/ios/EagleEye.xcodeproj/project.pbxproj`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/EagleEye.xcodeproj/project.pbxproj) |
| **`Android ApplicationId / Namespace`** | `"com.eagleeye"` | [`EagleEye/android/app/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/build.gradle) |
| **`New Architecture (Fabric/TurboModules)`** | `enabled` (`newArchEnabled=true`) | [`EagleEye/android/gradle.properties`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/gradle.properties) |
| **`JS Engine (Hermes)`** | `enabled` (`hermesEnabled=true`) | [`EagleEye/android/gradle.properties`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/gradle.properties) |

---

# 5. Android Build Internals

### Key Configuration Files Explained

1. **`android/build.gradle`**:
   - **Role**: Root-level project build script.
   - **Function**: Defines global project properties inside the `ext` block (`compileSdkVersion = 36`, `minSdkVersion = 24`, `targetSdkVersion = 36`, `buildToolsVersion = "36.0.0"`, `kotlinVersion = "2.1.20"`). Specifies buildscript repositories (`google()`, `mavenCentral()`) and classpath plugins for Android Gradle Plugin (`com.android.tools.build:gradle`), React Native Gradle Plugin (`com.facebook.react:react-native-gradle-plugin`), and Kotlin (`kotlin-gradle-plugin`).

2. **`android/app/build.gradle`**:
   - **Role**: Application module build script.
   - **Function**: Applies plugins (`com.android.application`, `org.jetbrains.kotlin.android`, `com.facebook.react`). Configures namespace `com.eagleeye`, `applicationId "com.eagleeye"`, signing configurations (`debug.keystore`), build types (`debug` and `release`), and autolinks native libraries via `autolinkLibrariesWithApp()`. Adds dependencies for `react-android` and `hermes-android`.

3. **`settings.gradle`**:
   - **Role**: Gradle settings file.
   - **Function**: Configures React Native settings extension (`com.facebook.react.settings`), includes the `:app` module, and links `@react-native/gradle-plugin` from `node_modules`.

4. **`gradle.properties`**:
   - **Role**: Environment properties for Gradle daemon and React Native feature flags.
   - **Function**: Sets JVM memory arguments (`org.gradle.jvmargs=-Xmx2048m`), enables AndroidX (`android.useAndroidX=true`), targets target CPU architectures (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`), enables New Architecture (`newArchEnabled=true`), and enables Hermes JS engine (`hermesEnabled=true`).

5. **`AndroidManifest.xml`**:
   - **Role**: Android OS app declaration manifest.
   - **Function**: Requests `android.permission.INTERNET`, defines the root application class `.MainApplication`, app icon (`@mipmap/ic_launcher`), app theme (`@style/AppTheme`), and declares `.MainActivity` with the `MAIN` action and `LAUNCHER` category intent filters.

6. **`MainActivity.kt`**:
   - **Role**: Native Android Activity entry point written in Kotlin.
   - **Function**: Extends `ReactActivity`. Overrides `getMainComponentName()` returning `"EagleEye"` to bind the native activity window with the JavaScript component registered in `index.js`. Uses `DefaultReactActivityDelegate` with `fabricEnabled`.

7. **`MainApplication.kt`**:
   - **Role**: Native Android Application class written in Kotlin.
   - **Function**: Extends `Application` and implements `ReactApplication`. Initializes the React Native runtime inside `onCreate()` via `loadReactNative(this)` and configures `ReactHost` with autolinked native packages from `PackageList(this).packages`.

### Step-by-Step Android Build Sequence

```
1. Gradle Execution (gradlew assembleDebug / assembleRelease)
   ↓
2. Evaluate settings.gradle & include :app and React Native Gradle Plugin
   ↓
3. Read android/build.gradle (Configure SDK 36, Kotlin 2.1.20, repositories)
   ↓
4. Read android/app/build.gradle (Set applicationId "com.eagleeye", autolink packages)
   ↓
5. Run React Native CLI bundle task (Bundle TS/JS code into Hermes Bytecode)
   ↓
6. Compile Kotlin code (MainActivity.kt, MainApplication.kt) & Java bytecode
   ↓
7. Compile Native C++ code (Fabric UI Manager, TurboModules, Hermes runtime) via NDK
   ↓
8. AAPT2 processes resources, AndroidManifest.xml, and layout drawables
   ↓
9. Package compiled DEX, Hermes bytecode, and .so native libraries into APK (app-debug.apk)
```

---

# 6. iOS Build Internals

### Key iOS Files Explained

1. **`ios/Podfile`**:
   - **Role**: CocoaPods dependency management manifest.
   - **Function**: Loads React Native Pod scripts (`react_native_pods.rb`), sets minimum iOS platform target (`platform :ios, min_ios_version_supported`), invokes `use_native_modules!` to autolink iOS native modules, executes `use_react_native!` to link core React Native static framework pods, and configures post-install build settings.

2. **`Info.plist`**:
   - **Role**: iOS application configuration property list.
   - **Function**: Defines bundle display name (`EagleEye`), bundle identifier (`$(PRODUCT_BUNDLE_IDENTIFIER)`), supported orientations, status bar settings, launch storyboard (`LaunchScreen`), and transport security rules (`NSAllowsLocalNetworking: true` for Metro bundler connection).

3. **`AppDelegate.swift`**:
   - **Role**: iOS application native entry point written in Swift.
   - **Function**: Marked with `@main`, extends `UIResponder` and `UIApplicationDelegate`. Instantiates `ReactNativeDelegate` and `RCTReactNativeFactory`, resolves the JS bundle URL via `RCTBundleURLProvider` (debug) or `main.jsbundle` (release), and launches the root component `"EagleEye"` into the window.

4. **`project.pbxproj`**:
   - **Role**: Xcode project build configuration database.
   - **Function**: Stores target definitions, build configurations (`Debug`/`Release`), compilation flags, header search paths, code signing settings, and sets `IPHONEOS_DEPLOYMENT_TARGET = 15.1`.

### Step-by-Step iOS Build Sequence

```
1. CocoaPods Pod Installation (pod install in ios/) -> Generates EagleEye.xcworkspace
   ↓
2. Trigger Xcode Build (xcodebuild or npx react-native run-ios)
   ↓
3. Execute "Bundle React Native code and images" build phase script
   ↓
4. Metro compiles TS/JS files into main.jsbundle
   ↓
5. Compile Swift source files (AppDelegate.swift) and static C++/Objective-C++ pods
   ↓
6. Link Native React Frameworks, Fabric Renderer, and Hermes engine
   ↓
7. Compile Asset Catalogs (Images.xcassets) & Storyboards (LaunchScreen.storyboard)
   ↓
8. Code sign binary with provisioning profiles and produce EagleEye.app / .ipa bundle
```

---

# 7. Source Code Architecture

### Project Folder Directory Structure

```
EagleEye/
├── App.tsx                     # App root wrapper & status bar configuration
├── index.js                    # React Native entry point (AppRegistry)
├── app.json                    # Application metadata (name: "EagleEye")
├── babel.config.js             # Babel transpiler preset configuration
├── metro.config.js             # Metro bundler configuration
├── tsconfig.json               # TypeScript compiler rules
├── android/                    # Android native project files
├── ios/                        # iOS native project files
└── src/                        # Main application source directory
    ├── theme/                  # Styling design system tokens
    │   └── colors.ts           # Central color palette & RGBA glassmorphic constants
    ├── navigation/             # Custom state-based navigation engine
    │   ├── NavigationContext.tsx # React Context provider, history stack & drawer state
    │   └── AppNavigator.tsx    # Screen switcher component & layout shell
    ├── components/             # Reusable UI presentation components
    │   ├── Header.tsx          # App header bar with drawer toggle & notifications count
    │   ├── BottomTabBar.tsx    # Bottom navigation tab bar with active screen indicators
    │   ├── CustomDrawer.tsx    # Slide-out navigation drawer panel with profile header
    │   ├── DrawerItem.tsx      # Interactive drawer navigation list item
    │   ├── EventCard.tsx       # Off-road event preview card component
    │   ├── InputField.tsx      # Form input field with icon and error handling
    │   ├── PrimaryButton.tsx   # Action button with brand color styling
    │   └── SecondaryButton.tsx # Outline/secondary action button component
    └── screens/                # Application screen views (13 screens)
        ├── LandingScreen.tsx         # Welcome screen with brand banner and CTA
        ├── SignupScreen.tsx          # Driver/User registration form
        ├── OtpScreen.tsx             # Verification PIN entry screen
        ├── SetPasswordScreen.tsx     # New password configuration screen
        ├── LoginScreen.tsx           # Authentication login screen
        ├── HomeScreen.tsx            # Main dashboard with featured banners & live events
        ├── EventsScreen.tsx          # List of off-road events and race schedules
        ├── DriversScreen.tsx         # Driver directory with filter & telemetry status
        ├── DriverProfileScreen.tsx   # Detailed driver stats, telemetry & bio
        ├── OrganizationsScreen.tsx   # Off-road racing teams & organization list
        ├── ResultsScreen.tsx         # Race leaderboard & telemetry standings
        ├── NotificationsScreen.tsx   # Activity alerts and telemetry updates
        └── SettingsScreen.tsx        # App settings, account preferences & logout
```

### Analysis of Requested Source Folders

- **`src/`**: Present. Root folder for all application logic, screens, components, theme, and navigation.
- **`src/screens/`**: Present. Contains all 13 application views. **Contains most of the application UI and feature logic**.
- **`src/components/`**: Present. Contains 8 reusable presentation components.
- **`src/navigation/`**: Present. Contains the custom navigation state engine (`NavigationContext.tsx`, `AppNavigator.tsx`). **Contains core routing logic**.
- **`src/theme/`**: Present. Contains design system tokens ([`src/theme/colors.ts`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/theme/colors.ts)).
- **`services/`, `hooks/`, `context/`, `utils/`, `assets/`**: *Not created as separate top-level directories in the current codebase*. State context is located inside [`src/navigation/NavigationContext.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/navigation/NavigationContext.tsx), and images/icons use remote HTTPS URLs or native unicode emojis.

---

# 8. Entry Point and Execution Flow

The exact step-by-step execution path of the application is:

```
EagleEye/index.js
       │
       ▼ (AppRegistry.registerComponent('EagleEye', () => App))
EagleEye/App.tsx
       │
       ▼ (Renders <SafeAreaProvider>, <StatusBar>, <NavigationProvider>)
EagleEye/src/navigation/NavigationContext.tsx
       │
       ▼ (Provides history stack [ 'Landing' ], active screen, navigate(), drawer state)
EagleEye/src/navigation/AppNavigator.tsx
       │
       ├─────────────────────────────────────────┐
       ▼ (Evaluates currentScreen state switch)  ▼
EagleEye/src/screens/*.tsx                 EagleEye/src/components/*.tsx
  - LandingScreen.tsx                       - Header.tsx
  - LoginScreen.tsx                         - BottomTabBar.tsx
  - HomeScreen.tsx                          - CustomDrawer.tsx
  - DriversScreen.tsx                       - EventCard.tsx
  - DriverProfileScreen.tsx...              - PrimaryButton.tsx...
```

### Flow Breakdown

1. **`EagleEye/index.js`**: React Native entry point. Calls `AppRegistry.registerComponent('EagleEye', () => App)` to register the root component with the native host (`MainActivity.kt` on Android, `AppDelegate.swift` on iOS).
2. **`EagleEye/App.tsx`**: Sets up global providers: `SafeAreaProvider` for edge-to-edge handling, dark status bar (`StatusBar`), and `NavigationProvider`.
3. **`EagleEye/src/navigation/NavigationContext.tsx`**: Initializes the navigation state stack `history` array (defaulting to `['Landing']`), drawer state (`isDrawerOpen`), and exposes `navigate()`, `goBack()`, and `toggleDrawer()`.
4. **`EagleEye/src/navigation/AppNavigator.tsx`**: Evaluates `currentScreen` from context and conditionally renders the corresponding screen component inside a flex layout container along with fixed `<BottomTabBar />` and `<CustomDrawer />`.
5. **`EagleEye/src/screens/*.tsx`**: Renders screen view UI, handling user interactions (e.g. tapping "Explore Events" calls `navigate('Events')`).
6. **`EagleEye/src/components/*.tsx`**: Reusable components (`Header`, `BottomTabBar`, `CustomDrawer`, `EventCard`) render UI elements and dispatch navigation state updates.

---

# 9. API and Data Flow

1. **API Client (`Axios` / `Fetch`)**:
   - The application currently operates with **in-memory data architecture**. Neither `Axios` nor `fetch()` calls to external REST/GraphQL endpoints are implemented in the current codebase.
2. **Base URL / Environment Config**:
   - No external `.env` file or API Base URL configuration exists in the codebase.
3. **Data Management & Mock Services**:
   - Data is stored as typed static array constants directly inside screen files and components.
   - *Example*: [`HomeScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/HomeScreen.tsx) defines `FEATURED_BANNERS` and `UPCOMING_EVENTS`. [`DriverProfileScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/DriverProfileScreen.tsx) defines driver telemetry metrics (speed, rank, vehicle, stage times).
4. **Storage Files**:
   - No persistent local storage package (e.g. `@react-native-async-storage/async-storage`) is installed. State lives in React Component memory during the active session.
5. **Authentication Flow**:
   - Auth screens (`Landing` -> `Signup` -> `Otp` -> `SetPassword` -> `Login` -> `Home`) simulate authentication by validating form fields locally via component state and invoking `navigate('Home')` upon completion.

---

# 10. Styling System

1. **Styling Paradigm**:
   - Uses React Native's native **`StyleSheet.create()`** API.
   - Tailwind CSS, NativeWind, and `styled-components` are **not** used in this project.
2. **Central Theme Tokens**:
   - All color definitions, dark mode palette, surface backgrounds, glowing primary accents, border colors, and glassmorphic translucent RGBA values are centrally exported from [`EagleEye/src/theme/colors.ts`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/theme/colors.ts).
3. **Design Aesthetic Implementation**:
   - Dark theme background (`#0B0B0B`), primary orange accent (`#FF6B00`), glowing highlights (`rgba(255, 107, 0, 0.25)`), glassmorphism cards (`rgba(26, 26, 26, 0.85)`), and surface borders (`#2A2A2A`).

```typescript
// Sample theme usage from src/theme/colors.ts
export const COLORS = {
  primary: '#FF6B00',
  primaryGlow: 'rgba(255, 107, 0, 0.25)',
  background: '#0B0B0B',
  surface: '#1A1A1A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  glassBg: 'rgba(26, 26, 26, 0.85)',
};
```

---

# 11. Commands Used to Build This App

The build and development commands configured in [`EagleEye/package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json) are:

### Development Commands

- **`npm install`**:
  - *Function*: Reads `package.json` and installs dependencies into `node_modules/` directory, creating or updating `package-lock.json`.
- **`npx react-native start`** (or **`npm start`**):
  - *Function*: Starts the Metro Bundler server on port `8081`. Compiles TypeScript/JavaScript code on demand and streams updates to connected emulators or devices.
- **`npx react-native run-android`** (or **`npm run android`**):
  - *Function*: Triggers the React Native CLI to launch an Android virtual device (AVD) or target connected USB device, run `./gradlew installDebug` from `android/`, install `app-debug.apk`, and launch `com.eagleeye`.
- **`npx react-native run-ios`** (or **`npm run ios`**):
  - *Function*: Invokes Xcode CLI tooling to boot an iOS Simulator, compile native Swift/C++ dependencies via CocoaPods, build `EagleEye.app`, install it on the simulator, and start Metro.

### Production Build Commands

- **`cd android && gradlew assembleRelease`** (or **`./gradlew assembleRelease`**):
  - *Function*: Bundles JS into Hermes bytecode, compiles Kotlin code, and generates a standalone production Android APK binary at `android/app/build/outputs/apk/release/app-release.apk`.
- **`cd android && gradlew bundleRelease`** (or **`./gradlew bundleRelease`**):
  - *Function*: Generates an Android App Bundle (AAB) at `android/app/build/outputs/bundle/release/app-release.aab` ready for Google Play Store upload.

---

# 12. Output Files

The build artifacts generated by Android Gradle and iOS Xcode builds are output to the following locations:

| Target Package | Output File Path | Description |
| :--- | :--- | :--- |
| **Android Debug APK** | `EagleEye/android/app/build/outputs/apk/debug/app-debug.apk` | Unsigned APK generated by `npx react-native run-android` for local development testing. |
| **Android Release APK** | `EagleEye/android/app/build/outputs/apk/release/app-release.apk` | Production APK binary generated by `gradlew assembleRelease`. |
| **Android Release AAB** | `EagleEye/android/app/build/outputs/bundle/release/app-release.aab` | Production Android App Bundle generated by `gradlew bundleRelease` for Google Play Store. |
| **iOS DerivedData / App** | `EagleEye/ios/build/` or `~/Library/Developer/Xcode/DerivedData/EagleEye-...` | Unsigned/signed `.app` simulator build output generated by Xcode. |
| **iOS Release IPA Package** | Output path specified during Xcode Archive export e.g. `build/EagleEye.ipa` | Signed iOS application archive package for App Store or TestFlight distribution. |

---

# 13. File Responsibility Map

The table below maps 24 critical files in this project to their exact technical responsibilities:

| File Path | Technical Responsibility |
| :--- | :--- |
| [`EagleEye/package.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/package.json) | Declares project metadata, npm scripts (`start`, `android`, `ios`), dependencies, and Node engine constraints (`>= 22.11.0`). |
| [`EagleEye/index.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/index.js) | Main JS entry point; calls `AppRegistry.registerComponent('EagleEye', () => App)`. |
| [`EagleEye/App.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/App.tsx) | Root application component; wraps app in `SafeAreaProvider`, `StatusBar`, and `NavigationProvider`. |
| [`EagleEye/app.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/app.json) | Stores app display name (`"EagleEye"`) referenced by native registration calls. |
| [`EagleEye/metro.config.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/metro.config.js) | Configures Metro bundler options and module resolution for React Native CLI. |
| [`EagleEye/babel.config.js`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/babel.config.js) | Configures Babel transformation using `@react-native/babel-preset`. |
| [`EagleEye/tsconfig.json`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/tsconfig.json) | Defines TypeScript compiler options, type references, and file inclusion patterns. |
| [`EagleEye/src/theme/colors.ts`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/theme/colors.ts) | Central design system tokens defining colors, glow effects, glassmorphic RGBA styles, and surface borders. |
| [`EagleEye/src/navigation/NavigationContext.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/navigation/NavigationContext.tsx) | React Context navigation state provider managing navigation history stack, current screen, and drawer state. |
| [`EagleEye/src/navigation/AppNavigator.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/navigation/AppNavigator.tsx) | Root navigator component that switches active screen components and houses bottom tabs and drawer. |
| [`EagleEye/src/components/Header.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/components/Header.tsx) | Custom header bar with title, back button, drawer toggle, and notification badge counter. |
| [`EagleEye/src/components/BottomTabBar.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/components/BottomTabBar.tsx) | Bottom tab navigation bar rendering active tab highlights and triggering screen switches. |
| [`EagleEye/src/components/CustomDrawer.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/components/CustomDrawer.tsx) | Slide-out drawer menu with driver profile header, quick navigation items, and sign-out button. |
| [`EagleEye/src/components/EventCard.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/components/EventCard.tsx) | Reusable card component for displaying off-road racing events and status badges. |
| [`EagleEye/src/components/InputField.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/components/InputField.tsx) | Text input component with label, icon, focus state, and validation error messages. |
| [`EagleEye/src/components/PrimaryButton.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/components/PrimaryButton.tsx) | Styled primary orange action button with touch feedback. |
| [`EagleEye/src/screens/LandingScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/LandingScreen.tsx) | Initial onboarding screen featuring app branding and login/signup action triggers. |
| [`EagleEye/src/screens/LoginScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/LoginScreen.tsx) | Login authentication screen with input validation and navigation to Home dashboard. |
| [`EagleEye/src/screens/HomeScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/HomeScreen.tsx) | Main dashboard featuring featured race banners carousel, live telemetry highlights, and upcoming events. |
| [`EagleEye/src/screens/DriversScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/DriversScreen.tsx) | Off-road driver directory with search bar, category filters, and driver stats cards. |
| [`EagleEye/src/screens/DriverProfileScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/DriverProfileScreen.tsx) | Detailed driver profile page showing live speed, telemetry gauges, stage times, and bio. |
| [`EagleEye/android/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) | Root Android Gradle script configuring SDK 36, Kotlin 2.1.20, buildTools, and NDK versions. |
| [`EagleEye/android/app/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/build.gradle) | App module Gradle script defining applicationId `com.eagleeye`, signing configs, and autolinked packages. |
| [`EagleEye/android/app/src/main/AndroidManifest.xml`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/src/main/AndroidManifest.xml) | Android manifest file declaring permissions, `MainApplication`, and launcher `MainActivity`. |
| [`EagleEye/android/app/src/main/java/com/eagleeye/MainApplication.kt`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/src/main/java/com/eagleeye/MainApplication.kt) | Kotlin Application class initializing React Native runtime (`loadReactNative`) and autolinked packages. |
| [`EagleEye/ios/Podfile`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/Podfile) | iOS CocoaPods manifest defining target `'EagleEye'` and linking React Native native Pods. |
| [`EagleEye/ios/EagleEye/AppDelegate.swift`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/EagleEye/AppDelegate.swift) | Swift entry point setting up `RCTReactNativeFactory` and launching React Native root component. |

---

# 14. Most Important Files for Development

When developing features in this project day-to-day, the top files edited are:

1. **[`EagleEye/src/navigation/NavigationContext.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/navigation/NavigationContext.tsx)**:
   - *Why*: Controls app routing, screen history stack, drawer visibility, and global navigation helper functions (`navigate`, `goBack`). Any new screen added to the app must be registered here in the `ScreenName` type.
2. **[`EagleEye/src/navigation/AppNavigator.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/navigation/AppNavigator.tsx)**:
   - *Why*: Maps screen names to JSX components inside the `renderScreen()` switch statement and embeds persistent UI components (`BottomTabBar`, `CustomDrawer`).
3. **[`EagleEye/src/screens/HomeScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/HomeScreen.tsx)**:
   - *Why*: Represents the main application dashboard, controlling featured banners, upcoming events lists, search input, and quick navigation.
4. **[`EagleEye/src/screens/DriversScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/DriversScreen.tsx)** & **[`DriverProfileScreen.tsx`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/screens/DriverProfileScreen.tsx)**:
   - *Why*: Implements core off-road driver directory filtering, search interactions, and detailed telemetry view displays.
5. **[`EagleEye/src/theme/colors.ts`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/theme/colors.ts)**:
   - *Why*: Controls the central color system. Any UI styling update across cards, buttons, status indicators, or glassmorphic backgrounds relies on constants in this file.
6. **[`EagleEye/src/components/*`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/src/components)**:
   - *Why*: Modifying UI components (`Header.tsx`, `EventCard.tsx`, `CustomDrawer.tsx`, `InputField.tsx`) updates design patterns across multiple screens simultaneously.

---

# 15. Current Project Build Status

Based on an audit of the files present in the repository:

### Android Configuration Status: COMPLETE ✅
- **Gradle Scripts**: Root [`build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/build.gradle) and [`app/build.gradle`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/build.gradle) are fully configured with modern Android SDK 36, Kotlin 2.1.20, and NDK 27.1.12297006.
- **Gradle Wrapper**: Wrapper scripts (`gradlew`, `gradlew.bat`) and [`gradle-wrapper.properties`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/gradle/wrapper/gradle-wrapper.properties) with Gradle `9.3.1` are present.
- **Native Source Files**: [`MainActivity.kt`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/src/main/java/com/eagleeye/MainActivity.kt) and [`MainApplication.kt`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/src/main/java/com/eagleeye/MainApplication.kt) are properly implemented in Kotlin.
- **Manifest & Keystore**: [`AndroidManifest.xml`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/android/app/src/main/AndroidManifest.xml) and development keystore (`debug.keystore`) exist in place.

### iOS Configuration Status: SETUP COMPLETE (Requires macOS Pod Install) ⚠️
- **Source Configuration**: Native Swift entry [`AppDelegate.swift`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/EagleEye/AppDelegate.swift), metadata manifest [`Info.plist`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/EagleEye/Info.plist), Xcode project [`project.pbxproj`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/EagleEye.xcodeproj/project.pbxproj), and dependency specification [`Podfile`](file:///c:/Users/goura/Downloads/eagle_eye/EagleEye/ios/Podfile) are fully present.
- **Required Action for iOS Build**: Running an iOS build requires a macOS environment with Xcode installed. Prior to building, the command `cd ios && pod install` must be executed to generate the native `Pods/` folder and `EagleEye.xcworkspace`.
