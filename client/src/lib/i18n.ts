type Language = "da" | "en";

interface Translations {
  // User Profile Dialog
  profile: {
    title: string;
    description: string;
    name: string;
    email: string;
    save: string;
    cancel: string;
    saving: string;
    saved: string;
    error: string;
    notSpecified: string;
  };
  // Settings Dialog
  settings: {
    title: string;
    description: string;
    appearance: string;
    theme: string;
    themeDescription: string;
    notifications: string;
    emailNotifications: string;
    emailNotificationsDescription: string;
    pushNotifications: string;
    pushNotificationsDescription: string;
    language: string;
    languageDescription: string;
    languageDanish: string;
    languageEnglish: string;
    themeLight: string;
    themeDark: string;
  };
  // Mobile Menu
  menu: {
    title: string;
    description: string;
    profile: string;
    settings: string;
    logout: string;
  };
}

const translations: Record<Language, Translations> = {
  da: {
    profile: {
      title: "Min profil",
      description: "Vis og administrer din brugerprofil",
      name: "Navn",
      email: "E-mail",
      save: "Gem",
      cancel: "Annuller",
      saving: "Gemmer...",
      saved: "Profil opdateret",
      error: "Fejl ved opdatering af profil",
      notSpecified: "Ikke angivet",
    },
    settings: {
      title: "Indstillinger",
      description: "Administrer dine app-indstillinger",
      appearance: "Udseende",
      theme: "Tema",
      themeDescription: "Vælg mørkt eller lyst tema",
      notifications: "Notifikationer",
      emailNotifications: "E-mail notifikationer",
      emailNotificationsDescription: "Modtag notifikationer på e-mail",
      pushNotifications: "Push notifikationer",
      pushNotificationsDescription: "Modtag push notifikationer",
      language: "Sprog",
      languageDescription: "Vælg applikationens sprog",
      languageDanish: "Dansk",
      languageEnglish: "English",
      themeLight: "Lyst",
      themeDark: "Mørkt",
    },
    menu: {
      title: "Bruger-menu",
      description: "Administrer din profil og indstillinger",
      profile: "Min profil",
      settings: "Indstillinger",
      logout: "Log ud",
    },
  },
  en: {
    profile: {
      title: "My Profile",
      description: "View and manage your user profile",
      name: "Name",
      email: "Email",
      save: "Save",
      cancel: "Cancel",
      saving: "Saving...",
      saved: "Profile updated",
      error: "Error updating profile",
      notSpecified: "Not specified",
    },
    settings: {
      title: "Settings",
      description: "Manage your app settings",
      appearance: "Appearance",
      theme: "Theme",
      themeDescription: "Choose dark or light theme",
      notifications: "Notifications",
      emailNotifications: "Email notifications",
      emailNotificationsDescription: "Receive notifications via email",
      pushNotifications: "Push notifications",
      pushNotificationsDescription: "Receive push notifications",
      language: "Language",
      languageDescription: "Choose application language",
      languageDanish: "Dansk",
      languageEnglish: "English",
      themeLight: "Light",
      themeDark: "Dark",
    },
    menu: {
      title: "User Menu",
      description: "Manage your profile and settings",
      profile: "My Profile",
      settings: "Settings",
      logout: "Logout",
    },
  },
};

let currentLanguage: Language = "da";

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
}

export function getLanguage(): Language {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("language");
    if (stored === "da" || stored === "en") {
      return stored;
    }
  }
  return currentLanguage;
}

export function useI18n() {
  const lang = getLanguage();
  return translations[lang];
}

export type { Language };
