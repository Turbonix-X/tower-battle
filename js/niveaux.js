// niveaux.js — La description de chaque niveau : carte, tours de départ et équipes présentes.

const Niveaux = {
  LISTE: [
    {
      largeur: 1000,
      hauteur: 640,
      ordis: [{ equipe: 'rouge', force: 3 }],
      tours: [
        { x: 100, y: 320, equipe: 'bleu', soldats: 10, pv: 20 },
        { x: 900, y: 320, equipe: 'rouge', soldats: 10, pv: 20 },

        { x: 270, y: 140, equipe: 'neutre', soldats: 3, pv: 5 },
        { x: 270, y: 520, equipe: 'neutre', soldats: 3, pv: 5 },
        { x: 730, y: 140, equipe: 'neutre', soldats: 3, pv: 5 },
        { x: 730, y: 520, equipe: 'neutre', soldats: 3, pv: 5 },
        { x: 420, y: 320, equipe: 'neutre', soldats: 6, pv: 8 },
        { x: 580, y: 320, equipe: 'neutre', soldats: 6, pv: 8 },
        { x: 500, y: 130, equipe: 'neutre', soldats: 10, pv: 12 },
        { x: 500, y: 530, equipe: 'neutre', soldats: 10, pv: 12 },
      ],
    },
  ],

  creerPartie(numero) {
    const niveau = Niveaux.LISTE[numero];
    return {
      largeur: niveau.largeur,
      hauteur: niveau.hauteur,
      tours: niveau.tours.map((tour) => Tours.creer(tour)),
      ordis: niveau.ordis.map((ordi) => Ordi.creer(ordi)),
      temps: 0, // la durée de la partie, en secondes, sans les pauses
      lignes: [],
      soldats: [],
      combats: [], // les animations de combat en cours
      trace: null, // la ligne en train d'être tracée
      coupe: null, // le trait en train de couper des lignes
    };
  },
};
