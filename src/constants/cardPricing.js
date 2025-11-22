/**
 * Constantes liées aux prix des cartes
 */

/**
 * Prix d'achat par défaut pour une carte (en euros)
 * Basé sur le calcul : 6€ (prix moyen d'un booster) / 10 cartes = 0.60€/carte
 *
 * Utilisé pour estimer la valeur d'achat des cartes qui n'ont pas de prix d'achat renseigné,
 * afin de calculer la plus-value potentielle de la collection.
 */
export const DEFAULT_CARD_PURCHASE_PRICE = 0.60
