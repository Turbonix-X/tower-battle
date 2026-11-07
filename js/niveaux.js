// niveaux.js — La description de chaque niveau : carte, tours de départ et équipes présentes.
// Les 10 premiers sont faits à la main et servent de tutoriel. Les autres viennent du générateur.

const NIVEAUX_TUTORIEL = [
  // 1. Tracer une ligne et capturer.
  {
    ordis: [{ equipe: 'rouge', force: 1, attenteInitiale: 40 }],
    tempsEtoiles: { trois: 35, deux: 70 },
    tours: [
      { x: 150, y: 330, equipe: 'bleu', soldats: 10, pv: 20 },
      { x: 480, y: 330, equipe: 'neutre', soldats: 2, pv: 3 },
      { x: 830, y: 330, equipe: 'rouge', soldats: 1, pv: 4 },
    ],
    tutoriel: [
      { action: 'ligne', de: 0, vers: 1, texte: 'tut1a' },
      { action: 'capture', tour: 1, texte: 'tut1b' },
      { action: 'capture', tour: 2, texte: 'tut1c' },
    ],
  },
  // 2. Les deux valeurs d'une tour : soldats et PV.
  {
    ordis: [{ equipe: 'rouge', force: 1, attenteInitiale: 30 }],
    tempsEtoiles: { trois: 45, deux: 90 },
    tours: [
      { x: 140, y: 330, equipe: 'bleu', soldats: 10, pv: 20 },
      { x: 420, y: 190, equipe: 'neutre', soldats: 3, pv: 5 },
      { x: 420, y: 480, equipe: 'neutre', soldats: 3, pv: 5 },
      { x: 840, y: 330, equipe: 'rouge', soldats: 3, pv: 6 },
    ],
    tutoriel: [
      { action: 'temps', duree: 5, texte: 'tut2a' },
      { action: 'capture', tour: 1, texte: 'tut2b', main: { de: 0, vers: 1 } },
      { action: 'capture', tour: 3, texte: 'tut2c' },
    ],
  },
  // 3. L'ennemi produit aussi des soldats.
  {
    ordis: [{ equipe: 'rouge', force: 1, attenteInitiale: 20 }],
    tempsEtoiles: { trois: 45, deux: 90 },
    tours: [
      { x: 150, y: 200, equipe: 'bleu', soldats: 12, pv: 20 },
      { x: 150, y: 470, equipe: 'neutre', soldats: 3, pv: 4 },
      { x: 500, y: 330, equipe: 'neutre', soldats: 4, pv: 5 },
      { x: 850, y: 330, equipe: 'rouge', soldats: 4, pv: 8 },
    ],
    tutoriel: [{ action: 'capture', tour: 3, texte: 'tut3a', main: { de: 0, vers: 3 } }],
  },
  // 4. Le niveau d'une tour.
  {
    ordis: [{ equipe: 'rouge', force: 1, attenteInitiale: 25 }],
    tempsEtoiles: { trois: 55, deux: 100 },
    tours: [
      { x: 150, y: 330, equipe: 'bleu', soldats: 5, pv: 20 },
      { x: 480, y: 170, equipe: 'neutre', soldats: 3, pv: 5 },
      { x: 480, y: 490, equipe: 'neutre', soldats: 3, pv: 5 },
      { x: 840, y: 330, equipe: 'rouge', soldats: 4, pv: 8 },
    ],
    tutoriel: [
      { action: 'soldats', tour: 0, nombre: 10, texte: 'tut4a' },
      { action: 'capture', tour: 3, texte: 'tut4b' },
    ],
  },
  // 5. Deux lignes en même temps.
  {
    ordis: [{ equipe: 'rouge', force: 1, attenteInitiale: 25 }],
    tempsEtoiles: { trois: 50, deux: 95 },
    tours: [
      { x: 150, y: 330, equipe: 'bleu', soldats: 15, pv: 20 },
      { x: 430, y: 170, equipe: 'neutre', soldats: 4, pv: 5 },
      { x: 430, y: 490, equipe: 'neutre', soldats: 4, pv: 5 },
      { x: 850, y: 330, equipe: 'rouge', soldats: 5, pv: 8 },
    ],
    tutoriel: [
      { action: 'ligne', de: 0, vers: 1, texte: 'tut5a' },
      { action: 'ligne', de: 0, vers: 2, texte: 'tut5b' },
      { action: 'capture', tour: 3, texte: 'tut5c' },
    ],
  },
  // 6. Couper une ligne.
  {
    ordis: [{ equipe: 'rouge', force: 2, attenteInitiale: 25 }],
    tempsEtoiles: { trois: 55, deux: 100 },
    tours: [
      { x: 150, y: 330, equipe: 'bleu', soldats: 12, pv: 20 },
      { x: 480, y: 170, equipe: 'neutre', soldats: 15, pv: 15 },
      { x: 480, y: 490, equipe: 'neutre', soldats: 3, pv: 5 },
      { x: 850, y: 330, equipe: 'rouge', soldats: 5, pv: 8 },
    ],
    tutoriel: [
      { action: 'ligne', de: 0, vers: 1, texte: 'tut6a' },
      { action: 'coupe', de: 0, vers: 1, texte: 'tut6b' },
      { action: 'capture', tour: 3, texte: 'tut6c' },
    ],
  },
  // 7. Les renforts.
  {
    ordis: [{ equipe: 'rouge', force: 2, attenteInitiale: 12 }],
    tempsEtoiles: { trois: 60, deux: 110 },
    tours: [
      { x: 170, y: 170, equipe: 'bleu', soldats: 25, pv: 20 },
      { x: 170, y: 490, equipe: 'bleu', soldats: 2, pv: 12 },
      { x: 500, y: 330, equipe: 'neutre', soldats: 5, pv: 6 },
      { x: 850, y: 330, equipe: 'rouge', soldats: 8, pv: 10 },
    ],
    tutoriel: [
      { action: 'ligne', de: 0, vers: 1, texte: 'tut7a' },
      { action: 'capture', tour: 3, texte: 'tut7b' },
    ],
  },
  // 8. Compter double. On y croise aussi une forteresse et un campement.
  {
    ordis: [{ equipe: 'rouge', force: 2, attenteInitiale: 15 }],
    tempsEtoiles: { trois: 50, deux: 95 },
    tours: [
      { x: 150, y: 330, equipe: 'bleu', soldats: 32, pv: 20 },
      { x: 480, y: 170, equipe: 'neutre', soldats: 8, pv: 6, type: 'forteresse' },
      { x: 480, y: 490, equipe: 'neutre', soldats: 8, pv: 6, type: 'campement' },
      { x: 850, y: 330, equipe: 'rouge', soldats: 8, pv: 10 },
    ],
    tutoriel: [{ action: 'capture', tour: 3, texte: 'tut8a', main: { de: 0, vers: 3 } }],
  },
  // 9. Le combat sur une ligne.
  {
    // Un défenseur riposte quand on l'attaque : c'est ce qui crée le combat sur la ligne.
    ordis: [{ equipe: 'rouge', force: 4, personnalite: 'defenseur', attenteInitiale: 8 }],
    tempsEtoiles: { trois: 60, deux: 110 },
    tours: [
      { x: 170, y: 330, equipe: 'bleu', soldats: 30, pv: 20 },
      { x: 500, y: 150, equipe: 'neutre', soldats: 5, pv: 6 },
      { x: 500, y: 510, equipe: 'neutre', soldats: 5, pv: 6 },
      { x: 830, y: 330, equipe: 'rouge', soldats: 8, pv: 10 },
    ],
    tutoriel: [{ action: 'capture', tour: 3, texte: 'tut9a', main: { de: 0, vers: 3 } }],
  },
  // 10. Deux ennemis, l'or et les améliorations : l'examen final du tutoriel.
  {
    ordis: [
      { equipe: 'rouge', force: 3, attenteInitiale: 8 },
      { equipe: 'jaune', force: 3, attenteInitiale: 8 },
    ],
    orDepart: 20,
    tempsEtoiles: { trois: 75, deux: 135 },
    tours: [
      { x: 140, y: 330, equipe: 'bleu', soldats: 15, pv: 20 },
      { x: 860, y: 150, equipe: 'rouge', soldats: 8, pv: 12 },
      { x: 860, y: 510, equipe: 'jaune', soldats: 8, pv: 12 },
      { x: 340, y: 170, equipe: 'neutre', soldats: 4, pv: 5, type: 'mine' },
      { x: 340, y: 490, equipe: 'neutre', soldats: 4, pv: 5 },
      { x: 560, y: 330, equipe: 'neutre', soldats: 8, pv: 8 },
      { x: 620, y: 130, equipe: 'neutre', soldats: 5, pv: 6 },
      { x: 620, y: 530, equipe: 'neutre', soldats: 5, pv: 6 },
    ],
    tutoriel: [
      { action: 'amelioration', tour: 0, texte: 'tut10b', dureeMax: 20 },
      { action: 'capture', tour: 3, texte: 'tut10c', main: { de: 0, vers: 3 }, dureeMax: 20 },
      { action: 'temps', duree: 8, texte: 'tut10a' },
    ],
  },
];

const Niveaux = {
  NOMBRE: 1000,
  PAR_PAGE: 50,
  PIECES_PAR_ETOILE: 10,
  OR_DE_DEPART: 5, // assez pour un premier point d'amélioration sur une caserne
  cache: new Map(),

  obtenir(numero) {
    if (!Niveaux.cache.has(numero)) {
      const niveau =
        numero <= NIVEAUX_TUTORIEL.length
          ? { numero, boss: false, largeur: 1000, hauteur: 640, ...NIVEAUX_TUTORIEL[numero - 1] }
          : Generateur.creer(numero);
      Niveaux.cache.set(numero, niveau);
    }
    return Niveaux.cache.get(numero);
  },

  etoiles(niveau, temps) {
    if (temps <= niveau.tempsEtoiles.trois) return 3;
    if (temps <= niveau.tempsEtoiles.deux) return 2;
    return 1;
  },

  // Les pièces gagnées à la fin d'un niveau : 10 par étoile, le double pour un boss.
  piecesGagnees(niveau, etoiles) {
    return etoiles * Niveaux.PIECES_PAR_ETOILE * (niveau.boss ? 2 : 1);
  },

  creerPartie(numero) {
    const niveau = Niveaux.obtenir(numero);

    // Les couleurs de la partie : chaque ordi est plus ou moins intense selon sa force.
    const palette = {};
    for (const nom of Object.keys(EQUIPES)) palette[nom] = couleursEquipe(nom);
    for (const ordi of niveau.ordis) palette[ordi.equipe] = couleursEquipe(ordi.equipe, ordi.force);

    return {
      numero,
      niveau,
      largeur: niveau.largeur,
      hauteur: niveau.hauteur,
      palette,
      tours: niveau.tours.map((tour) => Tours.creer(tour)),
      ordis: niveau.ordis.map((ordi) => Ordi.creer(ordi)),
      tutoriel: Tutoriel.creer(niveau),
      temps: 0, // la durée de la partie, en secondes, sans les pauses
      or: { [EQUIPE_JOUEUR]: niveau.orDepart ?? Niveaux.OR_DE_DEPART }, // disparaît à la fin du niveau
      lignes: [],
      soldats: [],
      evenements: [], // ce qui vient de se passer, pour les effets 3D
      trace: null, // la ligne en train d'être tracée
      coupe: null, // le trait en train de couper des lignes
    };
  },
};
