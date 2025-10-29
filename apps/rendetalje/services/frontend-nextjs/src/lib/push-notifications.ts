/**
 * Push Notification Service for RenOS PWA
 * Handles subscription and notification management
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("Notifications not supported");
  }

  const permission = await Notification.requestPermission();
  console.log("[Push] Permission:", permission);
  return permission;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Workers not supported");
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[ServiceWorker] Registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[ServiceWorker] Registration failed:", error);
    throw error;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription> {
  try {
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log("[Push] Subscribed:", subscription.endpoint);
    return subscription;
  } catch (error) {
    console.error("[Push] Subscription failed:", error);
    throw error;
  }
}

/**
 * Send subscription to backend
 */
export async function sendSubscriptionToBackend(
  subscription: PushSubscription,
  userId: string
): Promise<void> {
  try {
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription");
    }

    console.log("[Push] Subscription saved to backend");
  } catch (error) {
    console.error("[Push] Failed to save subscription:", error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log("[Push] Unsubscribed");

      // Notify backend
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });
    }
  } catch (error) {
    console.error("[Push] Unsubscribe failed:", error);
    throw error;
  }
}

/**
 * Complete setup: register SW, request permission, subscribe
 */
export async function setupPushNotifications(
  userId: string
): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error("Push notifications not supported");
  }

  // Request permission
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  // Register service worker
  const registration = await registerServiceWorker();

  // Wait for SW to be ready
  await navigator.serviceWorker.ready;

  // Subscribe to push
  const subscription = await subscribeToPush(registration);

  // Send to backend
  await sendSubscriptionToBackend(subscription, userId);

  return subscription;
}

/**
 * Check current subscription status
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("[Push] Failed to get subscription:", error);
    return null;
  }
}
