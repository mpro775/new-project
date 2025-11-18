import { create } from 'zustand';
import { toast } from 'react-hot-toast';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
  read: boolean;
}

// Notification store interface
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

// Notification store actions
interface NotificationActions {
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  clearReadNotifications: () => void;

  // Quick actions
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;

  // Computed properties
  getUnreadNotifications: () => Notification[];
  getReadNotifications: () => Notification[];
  getAllNotifications: () => Notification[];
  getUnreadCount: () => number;
}

// Combined store type
type NotificationStore = NotificationState & NotificationActions;

// Notification store implementation
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,

  // Actions
  addNotification: (notificationData) => {
    const notification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
      duration: 5000,
      ...notificationData,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Show toast notification
    const toastFn = (() => {
      switch (notification.type) {
        case 'success':
          return toast.success;
        case 'error':
          return toast.error;
        case 'warning':
          return toast;
        case 'info':
        default:
          return toast;
      }
    })();

    toastFn(notification.message, {
      duration: notification.duration || 4000,
    });

    // Auto-mark as read after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().markAsRead(notification.id);
      }, notification.duration);
    }
  },

  removeNotification: (id: string) => {
    set((state) => {
      const notificationIndex = state.notifications.findIndex(n => n.id === id);
      if (notificationIndex === -1) return state;

      const notification = state.notifications[notificationIndex];
      const newNotifications = state.notifications.filter(n => n.id !== id);
      const wasUnread = notification && !notification.read;

      return {
        notifications: newNotifications,
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  markAsRead: (id: string) => {
    set((state) => {
      const notificationIndex = state.notifications.findIndex(n => n.id === id);
      if (notificationIndex === -1) return state;

      const notification = state.notifications[notificationIndex];
      if (!notification || notification.read) return state;

      const updatedNotifications = [...state.notifications];
      updatedNotifications[notificationIndex] = {
        ...notification,
        read: true,
        id: notification.id,
        type: notification.type,
        message: notification.message
      };

      return {
        notifications: updatedNotifications,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  clearReadNotifications: () => {
    set((state) => ({
      notifications: state.notifications.filter(n => !n.read),
      unreadCount: state.notifications.filter(n => !n.read).length,
    }));
  },

  // Quick actions
  showSuccess: (message: string, title?: string) => {
    get().addNotification({
      type: 'success',
      title: title || '',
      message,
    });
  },

  showError: (message: string, title?: string) => {
    get().addNotification({
      type: 'error',
      title: title || '',
      message,
    });
  },

  showWarning: (message: string, title?: string) => {
    get().addNotification({
      type: 'warning',
      title: title || '',
      message,
    });
  },

  showInfo: (message: string, title?: string) => {
    get().addNotification({
      type: 'info',
      title: title || '',
      message,
    });
  },

  // Computed properties
  getUnreadNotifications: () => get().notifications.filter(n => !n.read),
  getReadNotifications: () => get().notifications.filter(n => n.read),
  getAllNotifications: () => get().notifications,
  getUnreadCount: () => get().unreadCount,
}));
