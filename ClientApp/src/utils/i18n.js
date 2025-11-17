const DEFAULT_LANG = localStorage.getItem('erp_lang') || 'en';
let current = DEFAULT_LANG;

const TRANSLATIONS = {
  en: {
    account: 'Account',
    profile: 'Profile',
    changePassword: 'Change password',
    logout: 'Logout',
    preferences: 'Preferences',
    username: 'Username',
    role: 'Role',
    changePasswordTitle: 'Change Password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    save: 'Save',
    cancel: 'Cancel',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark'
  },
  es: {
    account: 'Cuenta',
    profile: 'Perfil',
    changePassword: 'Cambiar contraseña',
    logout: 'Cerrar sesión',
    preferences: 'Preferencias',
    username: 'Usuario',
    role: 'Rol',
    changePasswordTitle: 'Cambiar Contraseña',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    save: 'Guardar',
    cancel: 'Cancelar',
    theme: 'Tema',
    language: 'Idioma',
    light: 'Claro',
    dark: 'Oscuro'
  }
};

export function t(key) {
  return TRANSLATIONS[current]?.[key] ?? TRANSLATIONS['en'][key] ?? key;
}

export function getLanguage() {
  return current;
}

export function setLanguage(lang) {
  current = lang;
  localStorage.setItem('erp_lang', lang);
}

export default { t, getLanguage, setLanguage };
