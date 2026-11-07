// donnees-soldats.js — La fiche de chaque type de soldat. Pour ajouter un type, il suffit d'ajouter une fiche ici.
//
// nom, description : les clés des textes (voir textes.js)
// icone            : le petit dessin affiché dans le menu rond
// vitesse          : multiplie la vitesse de marche
// force            : ce qu'il vaut au combat (un fantassin vaut 1)
// degatsPv         : les PV qu'il retire à une tour vide (multipliés selon le type de la tour)
// vieFleches       : le nombre de flèches qu'il encaisse avant de tomber
// coutEnvoi        : multiplie ce que coûte son envoi sur un adversaire
// combat           : false s'il ne se bat pas (il traverse les combats sans s'arrêter)
// soin             : les PV qu'il rend à la tour alliée où il arrive
// debloqueAu       : le niveau à partir duquel il apparaît dans le jeu

const TYPES_DE_SOLDATS = {
  fantassin: {
    nom: 'soldatFantassin',
    description: 'descFantassin',
    icone: '⚔️',
    vitesse: 1,
    force: 1,
    degatsPv: 1,
    vieFleches: 1,
    coutEnvoi: 1,
    combat: true,
    debloqueAu: 1,
  },
  chevalier: {
    nom: 'soldatChevalier',
    description: 'descChevalier',
    icone: '🐴',
    vitesse: 0.6,
    force: 2,
    degatsPv: 2,
    vieFleches: 2,
    coutEnvoi: 2,
    combat: true,
    debloqueAu: 15,
  },
  coureur: {
    nom: 'soldatCoureur',
    description: 'descCoureur',
    icone: '🏃',
    vitesse: 1.6,
    force: 0.5,
    degatsPv: 1,
    vieFleches: 1,
    coutEnvoi: 0.6,
    combat: true,
    debloqueAu: 25,
  },
  bouclier: {
    nom: 'soldatBouclier',
    description: 'descBouclier',
    icone: '🛡️',
    vitesse: 0.8,
    force: 1,
    degatsPv: 1,
    vieFleches: 5,
    coutEnvoi: 1.5,
    combat: true,
    debloqueAu: 35,
  },
  eclaireur: {
    nom: 'soldatEclaireur',
    description: 'descEclaireur',
    icone: '🔭',
    vitesse: 1.8,
    force: 0,
    degatsPv: 0,
    vieFleches: 1,
    coutEnvoi: 0.5,
    combat: false,
    debloqueAu: 52,
  },
  // Le soigneur est envoyé par la tour soin : il ne se bat pas et soigne la tour où il arrive.
  soigneur: {
    nom: 'soldatSoigneur',
    description: 'descSoigneur',
    icone: '💚',
    vitesse: 1,
    force: 0,
    degatsPv: 0,
    vieFleches: 1,
    coutEnvoi: 1,
    combat: false,
    soin: 1.5,
    debloqueAu: 60,
  },
};
