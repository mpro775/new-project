import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// UI store interface
interface UiState {
  // Theme & Layout
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  sidebarOpen: boolean;
  drawerOpen: boolean;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Modals & Dialogs
  activeModal: string | null;
  modalProps: Record<string, unknown>;

  // Page states
  currentPage: string;
  breadcrumbs: Array<{ label: string; path?: string }>;

  // Form states
  formSubmitting: Record<string, boolean>;

  // App settings
  appTitle: string;
  appVersion: string;
}

// UI store actions
interface UiActions {
  // Theme actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Language actions
  setLanguage: (language: 'ar' | 'en') => void;
  syncLanguageWithI18n: () => void;

  // Sidebar/Drawer actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string | null) => void;
  startLoading: (message?: string) => void;
  stopLoading: () => void;

  // Modal actions
  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  setModalProps: (props: Record<string, unknown>) => void;

  // Page actions
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; path?: string }>) => void;
  addBreadcrumb: (breadcrumb: { label: string; path?: string }) => void;
  clearBreadcrumbs: () => void;

  // Form actions
  setFormSubmitting: (formId: string, submitting: boolean) => void;
  isFormSubmitting: (formId: string) => boolean;

  // App actions
  setAppTitle: (title: string) => void;
  setAppVersion: (version: string) => void;
}

// Combined store type
type UiStore = UiState & UiActions;

// UI store implementation
export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      language: 'ar',
      sidebarOpen: true,
      drawerOpen: false,

      globalLoading: false,
      loadingMessage: null,

      activeModal: null,
      modalProps: {},

      currentPage: '',
      breadcrumbs: [],

      formSubmitting: {},

      appTitle: 'زيتونة SaaS',
      appVersion: '1.0.0',

      // Actions
      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        // Update document theme
        document.documentElement.setAttribute('data-theme', theme);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      setLanguage: (language: 'ar' | 'en') => {
        set({ language });
        // Update document language
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      },

      syncLanguageWithI18n: () => {
        // This will be called when i18n language changes
        // The language is already persisted, so we just need to sync the store
        const currentLang = localStorage.getItem('i18nextLng') as 'ar' | 'en' || 'ar';
        set({ language: currentLang });
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      toggleSidebar: () => {
        const currentState = get().sidebarOpen;
        set({ sidebarOpen: !currentState });
      },

      setDrawerOpen: (open: boolean) => {
        set({ drawerOpen: open });
      },

      toggleDrawer: () => {
        const currentState = get().drawerOpen;
        set({ drawerOpen: !currentState });
      },

      setGlobalLoading: (loading: boolean, message: string | null = null) => {
        set({ globalLoading: loading, loadingMessage: message });
      },

      startLoading: (message?: string) => {
        set({ globalLoading: true, loadingMessage: message || null });
      },

      stopLoading: () => {
        set({ globalLoading: false, loadingMessage: null });
      },

      openModal: (modalId: string, props: Record<string, unknown> = {}) => {
        set({ activeModal: modalId, modalProps: props });
      },

      closeModal: () => {
        set({ activeModal: null, modalProps: {} });
      },

      setModalProps: (props: Record<string, unknown>) => {
        set({ modalProps: props });
      },

      setCurrentPage: (page: string) => {
        set({ currentPage: page });
      },

      setBreadcrumbs: (breadcrumbs: Array<{ label: string; path?: string }>) => {
        set({ breadcrumbs });
      },

      addBreadcrumb: (breadcrumb: { label: string; path?: string }) => {
        const currentBreadcrumbs = get().breadcrumbs;
        set({ breadcrumbs: [...currentBreadcrumbs, breadcrumb] });
      },

      clearBreadcrumbs: () => {
        set({ breadcrumbs: [] });
      },

      setFormSubmitting: (formId: string, submitting: boolean) => {
        const currentForms = get().formSubmitting;
        set({
          formSubmitting: {
            ...currentForms,
            [formId]: submitting,
          },
        });
      },

      isFormSubmitting: (formId: string) => {
        return get().formSubmitting[formId] || false;
      },

      setAppTitle: (title: string) => {
        set({ appTitle: title });
        document.title = title;
      },

      setAppVersion: (version: string) => {
        set({ appVersion: version });
      },
    }),
    {
      name: 'ui-storage', // Key for localStorage
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
