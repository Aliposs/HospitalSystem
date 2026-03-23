import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  flash: boolean;
  setUnreadCount: (count: number) => void;
  clearUnread: () => void;
  triggerFlash: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  flash: false,
  setUnreadCount: (count) => set({ unreadCount: count }),
  clearUnread: () => set({ unreadCount: 0 }),
  triggerFlash: () => {
    set({ flash: true });
    setTimeout(() => set({ flash: false }), 1000);
  },
}));
