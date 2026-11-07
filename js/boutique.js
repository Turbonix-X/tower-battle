// boutique.js — L'écran « Boutique » : dépenser ses pièces pour des skins de tours et de soldats.

const Boutique = {
  // Le modèle montré sur la carte de chaque skin.
  APERCUS: { tours: { genre: 'tour', type: 'caserne' }, soldats: { genre: 'soldat', type: 'chevalier' } },

  creerCarte(genre, nom, fiche) {
    const { skinsAchetes, skinTour, skinSoldat } = Sauvegarde.donnees;
    const possede = skinsAchetes[genre].includes(nom);
    const equipe = (genre === 'tours' ? skinTour : skinSoldat) === nom;

    const carte = document.createElement('article');
    carte.className = equipe ? 'carte-skin carte-equipee' : 'carte-skin';

    const image = document.createElement('img');
    image.alt = '';
    image.src = Vignettes.image({ ...Boutique.APERCUS[genre], skin: nom });
    const titre = document.createElement('h3');
    titre.textContent = Textes.t(fiche.nom);

    const bouton = document.createElement('button');
    bouton.type = 'button';
    if (equipe) {
      bouton.textContent = Textes.t('skinEquipe');
      bouton.disabled = true;
    } else if (possede) {
      bouton.textContent = Textes.t('skinEquiper');
      bouton.addEventListener('click', () => {
        Sauvegarde.equiperSkin(genre, nom);
        Boutique.afficher();
      });
    } else {
      bouton.textContent = `🪙 ${fiche.prix}`;
      bouton.className = 'bouton-principal';
      bouton.disabled = Sauvegarde.donnees.pieces < fiche.prix;
      bouton.addEventListener('click', () => {
        Sauvegarde.acheterSkin(genre, nom, fiche.prix);
        Boutique.afficher();
        Menu.afficherPieces();
      });
    }

    carte.append(image, titre, bouton);
    return carte;
  },

  afficher() {
    document.getElementById('pieces-boutique').textContent = Sauvegarde.donnees.pieces;
    const remplir = (id, genre, skins) => {
      document
        .getElementById(id)
        .replaceChildren(...Object.entries(skins).map(([nom, fiche]) => Boutique.creerCarte(genre, nom, fiche)));
    };
    remplir('skins-tours', 'tours', SKINS_TOURS);
    remplir('skins-soldats', 'soldats', SKINS_SOLDATS);
  },
};
