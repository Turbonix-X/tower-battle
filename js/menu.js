// menu.js — Les écrans et les boutons : accueil, pause, fin de partie et barre du haut.

const Menu = {
  segments: {}, // un morceau de la barre des soldats par équipe

  // "actions" contient ce que le moteur fait quand on appuie sur chaque bouton.
  installer(actions) {
    const brancher = (id, action) => {
      document.getElementById(id).addEventListener('click', action);
    };
    brancher('bouton-jouer', actions.jouer);
    brancher('bouton-rejouer', actions.jouer);
    brancher('bouton-recommencer', actions.recommencer);
    brancher('bouton-pause', actions.pause);
    brancher('bouton-menu', actions.menu);

    const barre = document.getElementById('barre-parts');
    for (const [nom, equipe] of Object.entries(EQUIPES)) {
      if (nom === 'neutre') continue;
      const segment = document.createElement('div');
      segment.className = 'part';
      segment.style.background = equipe.couleur;
      barre.append(segment);
      Menu.segments[nom] = segment;
    }
  },

  // Affiche un seul écran à la fois (ou aucun, pendant la partie).
  montrerEcran(idEcran) {
    for (const ecran of document.querySelectorAll('.ecran')) {
      ecran.hidden = ecran.id !== idEcran;
    }
  },

  afficherMenu() {
    Menu.montrerEcran('ecran-menu');
  },

  afficherJeu() {
    Menu.montrerEcran(null);
    document.getElementById('bouton-pause').textContent = 'Pause';
  },

  afficherPause() {
    Menu.montrerEcran('ecran-pause');
    document.getElementById('bouton-pause').textContent = 'Reprendre';
  },

  afficherFin(victoire, temps) {
    document.getElementById('fin-titre').textContent = victoire ? 'Victoire !' : 'Défaite';
    document.getElementById('fin-temps').textContent = `Temps : ${Menu.formaterTemps(temps)}`;
    Menu.montrerEcran('ecran-fin');
  },

  formaterTemps(secondes) {
    const total = Math.floor(secondes);
    return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, '0')} s`;
  },

  // Compte les soldats de chaque équipe : dans ses tours et en route.
  compterSoldats(partie) {
    const totaux = {};
    for (const nom of Object.keys(Menu.segments)) totaux[nom] = 0;
    for (const tour of partie.tours) {
      if (tour.equipe in totaux) totaux[tour.equipe] += tour.soldats;
    }
    for (const soldat of partie.soldats) {
      if (soldat.equipe in totaux) totaux[soldat.equipe] += 1;
    }
    return totaux;
  },

  // Seules les équipes présentes dans la partie apparaissent dans la barre.
  mettreAJourParts(partie) {
    const totaux = Menu.compterSoldats(partie);
    const presentes = new Set(partie.ordis.map((ordi) => ordi.equipe)).add(EQUIPE_JOUEUR);
    for (const [nom, segment] of Object.entries(Menu.segments)) {
      segment.hidden = !presentes.has(nom);
      segment.style.flexGrow = totaux[nom];
      segment.textContent = totaux[nom];
    }
  },
};
