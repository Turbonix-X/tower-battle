// donnees-tours.js — La fiche de chaque type de tour. Pour ajouter un type, il suffit d'ajouter une fiche ici.
//
// nom, description     : les clés des textes (voir textes.js)
// modele               : le dessin 3D à utiliser (voir modeles3d.js)
// production           : soldats produits par seconde
// orParSeconde         : or de partie produit par seconde
// soldatsParPv         : combien de soldats ennemis il faut pour retirer "pvParSoldat" PV
// pvParSoldat          : combien de PV retire chaque groupe de "soldatsParPv" soldats
// multiplicateurPv     : multiplie les PV de départ donnés par le niveau
// capacite             : nombre maximum de soldats dans la tour
// lignesParNiveau      : nombre de lignes en même temps aux niveaux 1, 2 et 3
// vitesseSoldats       : multiplie la vitesse de marche des soldats de la tour
// coutAmelioration     : prix du premier point d'amélioration, en or de partie

const TYPES_DE_TOURS = {
  caserne: {
    nom: 'typeCaserne',
    description: 'descCaserne',
    modele: 'caserne',
    production: 1,
    orParSeconde: 0.1,
    soldatsParPv: 1,
    pvParSoldat: 1,
    multiplicateurPv: 1,
    capacite: 50,
    lignesParNiveau: [1, 2, 3],
    vitesseSoldats: 1,
    coutAmelioration: 5,
  },
  forteresse: {
    nom: 'typeForteresse',
    description: 'descForteresse',
    modele: 'forteresse',
    production: 0.5,
    orParSeconde: 0.1,
    soldatsParPv: 2,
    pvParSoldat: 1,
    multiplicateurPv: 1.5,
    capacite: 70,
    lignesParNiveau: [1, 2, 3],
    vitesseSoldats: 1,
    coutAmelioration: 6,
  },
  campement: {
    nom: 'typeCampement',
    description: 'descCampement',
    modele: 'campement',
    production: 1,
    orParSeconde: 0.1,
    soldatsParPv: 1,
    pvParSoldat: 2,
    multiplicateurPv: 0.8,
    capacite: 35,
    lignesParNiveau: [1, 2, 3],
    vitesseSoldats: 2,
    coutAmelioration: 4,
  },
  // La mine n'attaque pas et ne produit pas de soldats. Elle peut en recevoir pour se défendre.
  mine: {
    nom: 'typeMine',
    description: 'descMine',
    modele: 'mine',
    production: 0,
    orParSeconde: 1,
    soldatsParPv: 1,
    pvParSoldat: 1,
    multiplicateurPv: 0.8,
    capacite: 20,
    lignesParNiveau: [0, 0, 0],
    vitesseSoldats: 1,
    coutAmelioration: 8,
  },
};
