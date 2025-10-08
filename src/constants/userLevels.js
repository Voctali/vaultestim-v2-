export const USER_LEVELS = [
  {
    level: 1,
    name: "Débutant",
    minCards: 0,
    maxCards: 49,
    color: "#8B5CF6",
    badge: "🥉"
  },
  {
    level: 2,
    name: "Collectionneur",
    minCards: 50,
    maxCards: 149,
    color: "#06B6D4",
    badge: "🥈"
  },
  {
    level: 3,
    name: "Expert",
    minCards: 150,
    maxCards: 299,
    color: "#10B981",
    badge: "🥇"
  },
  {
    level: 4,
    name: "Maître",
    minCards: 300,
    maxCards: 499,
    color: "#F59E0B",
    badge: "⭐"
  },
  {
    level: 5,
    name: "Champion",
    minCards: 500,
    maxCards: 999,
    color: "#EF4444",
    badge: "🏆"
  },
  {
    level: 6,
    name: "Légendaire",
    minCards: 1000,
    maxCards: Infinity,
    color: "#EC4899",
    badge: "👑"
  }
]

export const getUserLevel = (cardCount) => {
  return USER_LEVELS.find(level =>
    cardCount >= level.minCards && cardCount <= level.maxCards
  ) || USER_LEVELS[0]
}