// sauvegarde.js — Garder la progression du joueur dans le navigateur.

const Sauvegarde = {
  CLE: 'towerBattle.sauvegarde',
  NIVEAU_MAX: 1000,
  donnees: null,

  parDefaut() {
    return {
      niveauAtteint: 1,
      etoiles: {}, // numéro du niveau -> meilleur score (1 à 3)
      parametres: { musique: 70, effets: 80, vitesse: 1, langue: 'fr' },
      argent: 0, // pour plus tard
      toursDebloquees: ['base'], // pour plus tard
    };
  },

  // Si le navigateur bloque le stockage, le jeu marche quand même, sans mémoire.
  charger() {
    let lu = null;
    try {
      lu = JSON.parse(localStorage.getItem(Sauvegarde.CLE));
    } catch (erreur) {
      lu = null;
    }
    Sauvegarde.donnees = Sauvegarde.nettoyer(lu);
  },

  // Remplace tout ce qui est absent ou abîmé par la valeur par défaut.
  nettoyer(lu) {
    const propre = Sauvegarde.parDefaut();
    if (!lu || typeof lu !== 'object') return propre;

    const niveau = Math.floor(Number(lu.niveauAtteint));
    if (niveau >= 1) propre.niveauAtteint = Math.min(niveau, Sauvegarde.NIVEAU_MAX);

    for (const [numero, etoiles] of Object.entries(lu.etoiles || {})) {
      if ([1, 2, 3].includes(etoiles)) propre.etoiles[numero] = etoiles;
    }

    const parametres = lu.parametres || {};
    const volume = (valeur, defaut) =>
      Number.isFinite(valeur) ? Math.min(100, Math.max(0, valeur)) : defaut;
    propre.parametres.musique = volume(parametres.musique, propre.parametres.musique);
    propre.parametres.effets = volume(parametres.effets, propre.parametres.effets);
    if ([1, 2].includes(parametres.vitesse)) propre.parametres.vitesse = parametres.vitesse;
    if (['fr', 'en'].includes(parametres.langue)) propre.parametres.langue = parametres.langue;

    if (Number.isFinite(lu.argent) && lu.argent >= 0) propre.argent = lu.argent;
    if (Array.isArray(lu.toursDebloquees) && lu.toursDebloquees.length > 0) {
      propre.toursDebloquees = lu.toursDebloquees;
    }
    return propre;
  },

  enregistrer() {
    try {
      localStorage.setItem(Sauvegarde.CLE, JSON.stringify(Sauvegarde.donnees));
    } catch (erreur) {
      // Stockage plein ou bloqué : on continue sans sauvegarder.
    }
  },

  effacer() {
    try {
      localStorage.removeItem(Sauvegarde.CLE);
    } catch (erreur) {
      // Stockage bloqué : il n'y a rien à effacer.
    }
    Sauvegarde.donnees = Sauvegarde.parDefaut();
  },

  // Débloque le niveau suivant et garde le meilleur nombre d'étoiles.
  enregistrerVictoire(numero, etoiles) {
    const { donnees } = Sauvegarde;
    donnees.niveauAtteint = Math.max(
      donnees.niveauAtteint,
      Math.min(numero + 1, Sauvegarde.NIVEAU_MAX),
    );
    donnees.etoiles[numero] = Math.max(donnees.etoiles[numero] || 0, etoiles);
    Sauvegarde.enregistrer();
  },

  changerParametre(nom, valeur) {
    Sauvegarde.donnees.parametres[nom] = valeur;
    Sauvegarde.enregistrer();
  },
};
