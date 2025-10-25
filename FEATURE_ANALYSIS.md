# 🕵️‍♂️ Feature Analysis: Rendetalje Mobile App

**Last Updated:** October 25, 2025  
**Branch:** `claude/implement-momentary-feature-011CUSDGPgNNv8NS6psNVgfx`  
**Commit:** `05b259b` (feat(mobile): Implement all core feature screens)

---

## 📜 Overview

This document provides a technical deep-dive into the five core features implemented in the Rendetalje mobile application. All features are built with a **modern, offline-first architecture** using Expo, React Native, TanStack Query for server state, and Zustand for global client state.

---

## 1. 📸 Photo Capture & Management (`/camera/[jobId].tsx`)

### Purpose

Allows technicians to take "before" and "after" photos for a specific job, attach them to the job record, and view them in a gallery. This feature is critical for quality assurance and client documentation.

### Technical Implementation

- **UI Components:**

  - `Camera` from `expo-camera` for the live viewfinder.
  - `Image` from `expo-image` for displaying captured photos.
  - Custom components for the shutter button, flash toggle, and gallery view.
  - Haptic feedback (`*Haptics.impactAsync*`) on user interactions for a native feel.

- **State Management:**

  - `useState` for managing camera type (front/back), flash mode, and captured photos.
  - `useLocalSearchParams` from `expo-router` to get the `jobId` from the URL.

- **Core Logic:**
  1.  **Permissions:** Requests camera and media library permissions on component mount using `Camera.requestCameraPermissionsAsync()`.
  2.  **Take Picture:** The `takePicture()` function calls `cameraRef.current.takePictureAsync()`, which returns a local URI for the captured image.
  3.  **Image to Base64:** The image is read from the file system using `FileSystem.readAsStringAsync(uri, { encoding: 'base64' })`. This is necessary for JSON-based API transport.
  4.  **Offline Queueing:** Instead of calling the API directly, the photo data (base64 string, jobId, type) is added to a sync queue via a custom `offlineStorage.addToSyncQueue()` service. This service persists the queue to `AsyncStorage`.
      - **Queue Item:** `{ endpoint: '/photos/upload', payload: { ... } }`
  5.  **API Upload:** A background process periodically attempts to send items from the sync queue to the backend.

### Key Libraries & APIs

- `expo-camera`: Core camera functionality.
- `expo-image-picker`: For selecting photos from the device's gallery.
- `expo-file-system`: To read the captured image into a base64 string.
- `expo-haptics`: For tactile feedback.
- `offlineStorage` (custom service): Manages the queue of pending API requests.

---

## 2. ⏱️ Time Tracking (`/time-tracking/[jobId].tsx`)

### Purpose

Provides a simple start/stop timer for technicians to log hours against a job. It also displays a history of time entries for the current job.

### Technical Implementation

- **UI Components:**

  - A large, prominent display for the running timer (formatted HH:MM:SS).
  - "Start Timer" / "Stop Timer" button with conditional rendering.
  - A `FlatList` to display previous time entries for the job.

- **State Management:**

  - `useQuery` from `@tanstack/react-query` to fetch existing time entries (`timeTrackingApi.getTimeEntries`).
  - `useMutation` from `@tanstack/react-query` to handle `startTimer` and `stopTimer` actions.
  - `useState` to manage the timer's active state and the elapsed time (updated via a `setInterval`).

- **Core Logic:**
  1.  **Data Fetching:** On load, `useQuery` fetches all time entries for the `jobId`.
  2.  **Timer Logic:**
      - When the "Start" button is pressed, a `useMutation` is triggered.
      - The mutation's action is queued in the `offlineStorage` service.
      - The UI immediately reflects the "running" state, starting a `setInterval` to update the elapsed time display every second.
  3.  **Offline First:** If the device is offline, the `startTimer` and `stopTimer` mutations add their respective API calls to the sync queue. The UI state is updated optimistically, assuming the API call will eventually succeed.
  4.  **Data Sync:** When the app comes back online, the `offlineStorage` service sends the queued requests, and the server state is eventually consistent with the client.

### Key Libraries & APIs

- `@tanstack/react-query`: For managing server state (fetching and updating time entries).
- `offlineStorage` (custom service): For queueing start/stop timer actions.
- `date-fns`: For robust date and time formatting.

---

## 3. 🗺️ GPS Map & Routing (`/map/route.tsx`)

### Purpose

Displays the technician's current location and the locations of all assigned jobs on a map. It can also calculate and display an optimized route between jobs.

### Technical Implementation

- **UI Components:**

  - `MapView` from `react-native-maps` as the core component.
  - `Marker` components to show job locations and the user's current position.
  - `Polyline` to draw the optimized route on the map.

- **State Management:**

  - `useLocation` (custom hook) to get the user's current GPS coordinates using `expo-location`.
  - `useQuery` to fetch the list of jobs with their coordinates.

- **Core Logic:**
  1.  **Location Permissions:** The `useLocation` hook handles requesting foreground location permissions (`Location.requestForegroundPermissionsAsync`).
  2.  **Map Display:** The `MapView` is centered on the user's location or a default region.
  3.  **Markers:** The jobs fetched from the API are mapped to `<Marker>` components, displaying their location on the map.
  4.  **Route Optimization:** A "Optimize Route" button triggers an API call that returns a series of coordinates (a polyline). This polyline is then rendered on the map using the `<Polyline>` component.

### Key Libraries & APIs

- `react-native-maps`: The core mapping library. Configured to use Google Maps on both iOS and Android.
- `expo-location`: To get the device's current GPS coordinates.
- `/jobs/optimized-route` (API endpoint): The backend endpoint that calculates the best route.

---

## 4. 📄 Job Details (`/job/[id].tsx`)

### Purpose

A comprehensive screen showing all details for a single job, including customer information, job status, and associated tasks. It serves as the central hub for a technician's work on a specific job.

### Technical Implementation

- **UI Components:**

  - Custom components for status banners (e.g., "In Progress", "Completed").
  - Buttons with icons for quick actions like "Call Customer" or "Get Directions".
  - A structured layout to present customer details, job notes, and task lists.

- **State Management:**

  - `useQuery` to fetch all details for the specific `jobId`.
  - `useMutation` to update the job's status (e.g., from "Scheduled" to "In Progress").

- **Core Logic:**
  1.  **Data Fetching:** Fetches all job data using `useQuery({ queryKey: ['job', id], queryFn: ... })`.
  2.  **Quick Actions:**
      - "Call Customer": Uses the `Linking.openURL('tel:${phoneNumber}')` API to open the native phone dialer.
      - "Get Directions": Uses `Linking.openURL()` to open the default maps application (Google Maps or Apple Maps) with the job's address.
  3.  **Status Updates:** Changing the job status triggers a `useMutation`, which optimistically updates the UI and sends the change to the backend. Like other features, this is integrated with the offline queue.

### Key Libraries & APIs

- `@tanstack/react-query`: For fetching and updating job data.
- `react-native-linking`: To integrate with other native apps like the phone and maps.

---

## 5. 👤 Profile & Settings (`/(tabs)/profile.tsx`)

### Purpose

Allows the user to manage their profile, application settings, and data.

### Technical Implementation

- **UI Components:**

  - A `ScrollView` containing various settings sections.
  - A `Switch` component for toggling biometric authentication.
  - Buttons for actions like "Log Out", "Clear Cache", and "Force Sync".

- **State Management:**

  - `useAuth` (custom hook/Zustand store): Manages the user's authentication state, including the JWT token and profile information.
  - `useBiometrics` (custom hook): A wrapper around `expo-local-authentication` to manage biometric login.

- **Core Logic:**
  1.  **Authentication:** The `useAuth` hook provides the user's data and a `logout` function.
  2.  **Biometric Toggle:** The switch uses the `useBiometrics` hook to enable or disable fingerprint/Face ID login for the next session.
  3.  **Data Management:**
      - **"Clear Cache":** This button clears the TanStack Query cache (`queryClient.clear()`) and could also clear other local storage.
      - **"Force Sync":** This manually triggers the `offlineStorage.syncAll()` function, immediately attempting to send all queued API requests to the backend. This is useful for debugging or forcing an update after being offline.
  4.  **Logout:** Calls the `logout` function from the `useAuth` hook, which clears the user's token from secure storage and navigates back to the login screen.

### Key Libraries & APIs

- `zustand`: For the `useAuth` global state store.
- `expo-local-authentication`: For biometric login capabilities.
- `offlineStorage` (custom service): For the "Force Sync" functionality.
- `@tanstack/react-query`: For cache management ("Clear Cache").
