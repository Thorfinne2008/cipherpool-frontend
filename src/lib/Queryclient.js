import { QueryClient } from "@tanstack/react-query";

/* ═══════════════════════════════════════════════════════════════
   QUERY CLIENT  —  CipherPool v6
   Stratégie de cache :
   ▸ données statiques   (tournois, leaderboard) → stale 5 min
   ▸ données dynamiques  (wallet, profil)        → stale 30 sec
   ▸ données realtime    (room, chat)            → stale 10 sec
   ═══════════════════════════════════════════════════════════════ */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Re-fetch en background si données périmées
      staleTime:          1000 * 60 * 2,   // 2 min par défaut
      gcTime:             1000 * 60 * 10,  // garde en cache 10 min
      refetchOnWindowFocus: true,
      refetchOnReconnect:   true,
      retry: (failureCount, error) => {
        // Ne pas retry sur 403/404
        if (error?.status === 403 || error?.status === 404) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

// ── Query Keys centralisés (évite les typos) ────────────────
export const QK = {
  profile:      (userId)  => ["profile", userId],
  wallet:       (userId)  => ["wallet", userId],
  stats:        (userId)  => ["stats", userId],
  tournaments:  (filter)  => ["tournaments", filter || "all"],
  tournament:   (id)      => ["tournament", id],
  leaderboard:  (period)  => ["leaderboard", period],
  news:         ()        => ["news"],
  teams:        ()        => ["teams"],
  team:         (id)      => ["team", id],
  achievements: (userId)  => ["achievements", userId],
  dailyClaim:   (userId)  => ["dailyClaim", userId],
  adminMsgs:    ()        => ["adminMessages"],
  unread:       (userId)  => ["unread", userId],
  roomMembers:  (tourId)  => ["roomMembers", tourId],
  chatMessages: (tourId)  => ["chatMessages", tourId],
  matchResults: ()        => ["matchResults"],
  supportTickets:()       => ["supportTickets"],
};