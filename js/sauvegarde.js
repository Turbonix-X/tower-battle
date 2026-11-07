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
      pieces: 0, // gagnées à la fin des niveaux, à dépenser dans la boutique
      deblocagesVus: [], // les types dont le joueur a déjà vu l'écran de présentation
      skinsAchetes: { tours: ['classique'], soldats: ['classique'] },
      skinTour: 'classique',
      skinSoldat: 'classique',
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

    // "argent" est l'ancien nom des pièces, dans les sauvegardes d'avant la version 1.6.
    const pieces = lu.pieces ?? lu.argent;
    if (Number.isFinite(pieces) && pieces >= 0) propre.pieces = pieces;

    // Une sauvegarde d'avant la version 1.7 n'a pas cette liste : ce qui est déjà
    // accessible compte comme vu, pour ne pas présenter d'un coup tout ce qui existe.
    if (Array.isArray(lu.deblocagesVus)) {
      propre.deblocagesVus = lu.deblocagesVus.filter((cle) => typeof cle === 'string');
    } else {
      propre.deblocagesVus = Deblocages.liste()
        .filter((e) => e.niveau <= propre.niveauAtteint)
        .map(Deblocages.cle);
    }

    const achetes = lu.skinsAchetes || {};
    const garder = (liste, skins) =>
      Array.isArray(liste) ? liste.filter((nom) => nom in skins && nom !== 'classique') : [];
    propre.skinsAchetes.tours.push(...garder(achetes.tours, SKINS_TOURS));
    propre.skinsAchetes.soldats.push(...garder(achetes.soldats, SKINS_SOLDATS));
    if (propre.skinsAchetes.tours.includes(lu.skinTour)) propre.skinTour = lu.skinTour;
    if (propre.skinsAchetes.soldats.includes(lu.skinSoldat)) propre.skinSoldat = lu.skinSoldat;
    return propre;
  },

  // La boutique : "genre" vaut 'tours' ou 'soldats'. Renvoie true si l'achat a réussi.
  acheterSkin(genre, nom, prix) {
    const { donnees } = Sauvegarde;
    if (donnees.pieces < prix || donnees.skinsAchetes[genre].includes(nom)) return false;
    donnees.pieces -= prix;
    donnees.skinsAchetes[genre].push(nom);
    Sauvegarde.equiperSkin(genre, nom);
    return true;
  },

  equiperSkin(genre, nom) {
    if (!Sauvegarde.donnees.skinsAchetes[genre].includes(nom)) return;
    if (genre === 'tours') Sauvegarde.donnees.skinTour = nom;
    else Sauvegarde.donnees.skinSoldat = nom;
    Sauvegarde.enregistrer();
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

  // Débloque le niveau suivant, garde le meilleur nombre d'étoiles et ajoute les pièces gagnées.
  enregistrerVictoire(numero, etoiles, pieces) {
    const { donnees } = Sauvegarde;
    donnees.pieces += pieces;
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
