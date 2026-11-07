// donnees-skins.js — Les skins de la boutique. Pour en ajouter un, il suffit d'ajouter une fiche ici.
// Un skin ne change que l'apparence, jamais les règles. Il s'applique seulement aux tours et soldats du joueur.
//
// SKINS_TOURS : remplace les couleurs des matériaux des tours (voir COULEURS_3D dans modeles3d.js).
// SKINS_SOLDATS : remplace la couleur de l'armure et du casque.

const SKINS_TOURS = {
  classique: { nom: 'skinClassique', prix: 0, couleurs: {} },
  sable: {
    nom: 'skinSable',
    prix: 150,
    couleurs: { pierre: '#e0c58f', pierreSombre: '#b5935a', bois: '#a06b35' },
  },
  ombre: {
    nom: 'skinOmbre',
    prix: 300,
    couleurs: { pierre: '#5d6170', pierreSombre: '#363944', bois: '#2d2a33', boisSombre: '#1f1d24' },
  },
  glace: {
    nom: 'skinGlace',
    prix: 500,
    couleurs: { pierre: '#c7ecf7', pierreSombre: '#86c4dc', bois: '#6fa8c4', boisSombre: '#4d86a3' },
  },
  royal: {
    nom: 'skinRoyal',
    prix: 900,
    couleurs: { pierre: '#f3eee2', pierreSombre: '#d8a73a', bois: '#b8842a', boisSombre: '#8f6420' },
  },
};

const SKINS_SOLDATS = {
  classique: { nom: 'skinClassique', prix: 0, armure: '#d9d9d9' },
  bronze: { nom: 'skinBronze', prix: 120, armure: '#c0813f' },
  ombre: { nom: 'skinOmbre', prix: 280, armure: '#3a3d48' },
  dore: { nom: 'skinDore', prix: 700, armure: '#ffcf33' },
};
