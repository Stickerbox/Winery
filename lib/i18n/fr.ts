import type { en } from "./en";

export const fr = {
  common: {
    delete: "Supprimer",
    share: "Partager",
    copied: "Copié !",
    rating: "Note",
    cancel: "Annuler",
  },
  dashboard: {
    welcome: "Bienvenue, {username}",
    sortNewest: "Récent",
    sortOldest: "Ancien",
    sortRatingHigh: "Note ↓",
    sortRatingLow: "Note ↑",
    searchPlaceholder: "Rechercher des vins...",
    searchTitle: "Rechercher",
    logoutTitle: "Déconnexion",
    addWineTitle: "Ajouter un vin",
  },
  wineForm: {
    takePhoto: "Prenez une photo de votre vin",
    analyzing: "Identification du vin...",
    nameLabel: "Nom",
    namePlaceholder: "ex. Château Margaux",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Notes de dégustation, millésime, etc.",
    ratingLabel: "Note",
    saving: "Ajout en cours...",
    save: "Sauvegarder dans la collection",
    ratingRequired: "Veuillez sélectionner une note",
    saveFailed: "Échec de l'ajout du vin",
  },
  wineModal: {
    tastingNotes: "Notes de dégustation",
    deleteConfirm: "Supprimer ce vin ?",
    deleteConfirmAction: "Oui, supprimer",
  },
  wineGrid: {
    emptyTitle: "Aucun vin ajouté pour l'instant.",
    emptySubtitle: "Cliquez sur le bouton + pour ajouter votre première bouteille.",
  },
  login: {
    description: "Entrez votre nom d'utilisateur pour accéder à votre collection de vins",
    usernamePlaceholder: "Nom d'utilisateur",
    submit: "Commencer à collecter",
  },
  share: {
    sharedBy: "Partagé par {username}",
    added: "Ajouté le {date}",
    viewCollection: "Voir votre collection",
    addToMine: "Ajouter à mes vins",
    loginToAdd: "Connectez-vous pour ajouter à vos vins",
  },
} satisfies typeof en;
