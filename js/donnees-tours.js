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
// soldats              : les types de soldats qu'elle peut produire (voir donnees-soldats.js)
// debloqueAu           : le niveau à partir duquel elle apparaît dans le jeu
// tir                  : si la tour tire : quoi, sur quoi, à quelle portée (par niveau) et à quel rythme
// aura                 : si la tour soigne les tours alliées proches
// degatsCanon          : multiplie les PV perdus sous les boulets de canon

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
    soldats: ['fantassin', 'bouclier'],
    debloqueAu: 1,
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
    soldats: [],
    debloqueAu: 10,
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
    soldats: ['chevalier', 'fantassin'],
    debloqueAu: 15,
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
    soldats: ['coureur', 'eclaireur'],
    debloqueAu: 25,
  },
  // Tire des flèches sur les soldats ennemis à portée, même s'ils attaquent une autre tour.
  archers: {
    nom: 'typeArchers',
    description: 'descArchers',
    modele: 'archers',
    production: 0.4,
    orParSeconde: 0.1,
    soldatsParPv: 1,
    pvParSoldat: 1,
    multiplicateurPv: 1,
    capacite: 40,
    lignesParNiveau: [1, 2, 2],
    vitesseSoldats: 1,
    coutAmelioration: 6,
    soldats: ['fantassin'],
    debloqueAu: 30,
    tir: { projectile: 'fleche', portee: [170, 220, 270], secondes: 1, degats: 1, duree: 0.35 },
  },
  // Tire des boulets sur les tours ennemies à portée. Un boulet ne peut pas achever une tour.
  canon: {
    nom: 'typeCanon',
    description: 'descCanon',
    modele: 'canon',
    production: 0.4,
    orParSeconde: 0.1,
    soldatsParPv: 1,
    pvParSoldat: 1,
    multiplicateurPv: 1.1,
    capacite: 40,
    lignesParNiveau: [1, 2, 2],
    vitesseSoldats: 1,
    coutAmelioration: 7,
    soldats: ['fantassin'],
    debloqueAu: 45,
    tir: { projectile: 'boulet', portee: [230, 290, 350], secondes: 3.2, degats: 2, duree: 1.1 },
  },
  // Soigne les tours alliées proches, et envoie des soigneurs dans ses lignes.
  soin: {
    nom: 'typeSoin',
    description: 'descSoin',
    modele: 'soin',
    production: 0.6,
    orParSeconde: 0.1,
    soldatsParPv: 1,
    pvParSoldat: 1,
    multiplicateurPv: 0.9,
    capacite: 30,
    lignesParNiveau: [4, 4, 4],
    vitesseSoldats: 1,
    coutAmelioration: 6,
    soldats: ['soigneur'],
    debloqueAu: 60,
    aura: { portee: 210, pvParSeconde: 0.5 },
  },
  // Ressemble à une caserne neutre, et explose à la première attaque (voir tours.js).
  piege: {
    nom: 'typePiege',
    description: 'descPiege',
    modele: 'piege',
    apparence: 'caserne', // ce que voit le joueur dans la fiche d'info
    production: 1,
    orParSeconde: 0.1,
    soldatsParPv: 1,
    pvParSoldat: 1,
    multiplicateurPv: 1,
    capacite: 50,
    lignesParNiveau: [1, 2, 3],
    vitesseSoldats: 1,
    coutAmelioration: 5,
    soldats: ['fantassin'],
    debloqueAu: 75,
    victimesPiege: 8,
    rayonPiege: 170,
  },
  // Rare : énorme capacité et tous les soldats, mais les canons lui font deux fois plus mal.
  geante: {
    nom: 'typeGeante',
    description: 'descGeante',
    modele: 'geante',
    production: 1.5,
    orParSeconde: 0.2,
    soldatsParPv: 1,
    pvParSoldat: 1,
    multiplicateurPv: 1.6,
    capacite: 250,
    lignesParNiveau: [2, 3, 4],
    vitesseSoldats: 1,
    coutAmelioration: 8,
    soldats: ['fantassin', 'chevalier', 'coureur', 'bouclier', 'eclaireur'],
    debloqueAu: 120,
    degatsCanon: 2,
  },
};
