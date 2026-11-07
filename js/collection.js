// collection.js — L'écran « Collection » : tous les types de tours et de soldats, et leurs statistiques.

const Collection = {
  onglet: 'tour',

  installer() {
    for (const bouton of document.querySelectorAll('[data-onglet-collection]')) {
      bouton.addEventListener('click', () => {
        Collection.onglet = bouton.dataset.ongletCollection;
        Collection.afficher();
      });
    }
  },

  // Les statistiques à afficher pour une entrée, sous la forme [clé du texte, valeur].
  statistiques({ genre, fiche }) {
    if (genre === 'soldat') {
      return [
        ['statVitesse', `×${fiche.vitesse}`],
        ['statForce', fiche.combat ? String(fiche.force) : '—'],
        ['statFleches', String(fiche.vieFleches)],
        ['statCout', `×${fiche.coutEnvoi}`],
      ];
    }
    const stats = [
      ['statProduction', `${fiche.production} /s`],
      ['statOr', `${fiche.orParSeconde} /s`],
      ['statCapacite', String(fiche.capacite)],
      ['statDefense', String(fiche.soldatsParPv / fiche.pvParSoldat)],
      ['statLignes', fiche.lignesParNiveau.join(' / ')],
    ];
    if (fiche.tir) stats.push(['statPortee', fiche.tir.portee.join(' / ')]);
    if (fiche.aura) stats.push(['statPortee', String(fiche.aura.portee)]);
    return stats;
  },

  creerCarte(entree) {
    const debloque = entree.niveau <= Sauvegarde.donnees.niveauAtteint;
    const carte = document.createElement('article');
    carte.className = debloque ? 'carte-type' : 'carte-type carte-verrouillee';

    const image = document.createElement('img');
    image.alt = '';
    image.src = Vignettes.image(entree);
    carte.append(image);

    const nom = document.createElement('h3');
    nom.textContent = Textes.t(entree.fiche.nom);
    carte.append(nom);

    if (!debloque) {
      const cadenas = document.createElement('p');
      cadenas.className = 'cadenas';
      cadenas.textContent = `🔒 ${Textes.t('niveau', { n: entree.niveau })}`;
      carte.append(cadenas);
      return carte;
    }

    const description = document.createElement('p');
    description.textContent = Textes.t(entree.fiche.description);
    carte.append(description);

    const liste = document.createElement('dl');
    for (const [cle, valeur] of Collection.statistiques(entree)) {
      const ligne = document.createElement('div');
      const titre = document.createElement('dt');
      titre.textContent = Textes.t(cle);
      const donnee = document.createElement('dd');
      donnee.textContent = valeur;
      ligne.append(titre, donnee);
      liste.append(ligne);
    }
    carte.append(liste);
    return carte;
  },

  afficher() {
    for (const bouton of document.querySelectorAll('[data-onglet-collection]')) {
      const actif = bouton.dataset.ongletCollection === Collection.onglet;
      bouton.classList.toggle('actif', actif);
      bouton.setAttribute('aria-pressed', actif);
    }
    const entrees = Deblocages.liste().filter((e) => e.genre === Collection.onglet);
    const debloques = entrees.filter((e) => e.niveau <= Sauvegarde.donnees.niveauAtteint).length;
    document.getElementById('compte-collection').textContent = `${debloques} / ${entrees.length}`;
    document.getElementById('grille-collection').replaceChildren(...entrees.map(Collection.creerCarte));
    Menu.numeroter(document.getElementById('ecran-collection')); // les cartes arrivent l'une après l'autre
  },
};
