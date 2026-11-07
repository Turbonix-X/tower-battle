// menu.js — Les écrans et les boutons : titre, paramètres, crédits, pause, fin et barre du haut.

const VERSION_JEU = 'Alpha 1.5';

const Menu = {
  segments: {}, // un morceau de la barre des soldats par équipe
  ecranActuel: null,
  bulleActuelle: null,

  // "actions" contient ce que le moteur fait quand on appuie sur chaque bouton.
  installer(actions) {
    const brancher = (id, action) => {
      document.getElementById(id).addEventListener('click', action);
    };

    brancher('bouton-jouer', actions.jouer);
    brancher('bouton-niveaux', () => {
      CarteNiveaux.afficher(CarteNiveaux.pageDuNiveau(Sauvegarde.donnees.niveauAtteint));
      Menu.montrerEcran('ecran-niveaux');
    });
    brancher('bouton-parametres', () => Menu.montrerEcran('ecran-parametres'));
    brancher('bouton-credits', () => Menu.montrerEcran('ecran-credits'));
    for (const bouton of document.querySelectorAll('.bouton-retour')) {
      bouton.addEventListener('click', Menu.afficherTitre);
    }

    brancher('bouton-pause', actions.pause);
    brancher('bouton-recommencer', actions.recommencer);
    brancher('pause-reprendre', actions.pause);
    brancher('pause-recommencer', actions.recommencer);
    brancher('pause-menu', actions.menu);

    brancher('bouton-rejouer', actions.recommencer);
    brancher('bouton-suivant', actions.suivant);
    brancher('bouton-menu', actions.menu);

    CarteNiveaux.installer(actions.choisirNiveau);
    Menu.installerParametres();
    Menu.creerSegments();
    for (const element of document.querySelectorAll('.texte-version')) {
      element.textContent = VERSION_JEU;
    }
    Menu.appliquerParametres();
  },

  installerParametres() {
    for (const nom of ['musique', 'effets']) {
      document.getElementById(`reglage-${nom}`).addEventListener('input', (e) => {
        Sauvegarde.changerParametre(nom, Number(e.target.value));
      });
    }
    for (const bouton of document.querySelectorAll('[data-vitesse]')) {
      bouton.addEventListener('click', () => {
        Sauvegarde.changerParametre('vitesse', Number(bouton.dataset.vitesse));
        Menu.appliquerParametres();
      });
    }
    for (const bouton of document.querySelectorAll('[data-langue]')) {
      bouton.addEventListener('click', () => {
        Sauvegarde.changerParametre('langue', bouton.dataset.langue);
        Menu.appliquerParametres();
      });
    }

    const confirmation = document.getElementById('confirmation');
    const message = document.getElementById('message-sauvegarde');
    document.getElementById('bouton-effacer').addEventListener('click', () => {
      message.textContent = '';
      confirmation.hidden = false;
      document.getElementById('effacer-annuler').focus();
    });
    document.getElementById('effacer-annuler').addEventListener('click', () => {
      confirmation.hidden = true;
    });
    document.getElementById('effacer-oui').addEventListener('click', () => {
      Sauvegarde.effacer();
      confirmation.hidden = true;
      Menu.appliquerParametres();
      message.textContent = Textes.t('sauvegardeEffacee');
    });
  },

  // Met l'écran des paramètres et les textes d'accord avec la sauvegarde.
  appliquerParametres() {
    const { parametres } = Sauvegarde.donnees;
    document.getElementById('reglage-musique').value = parametres.musique;
    document.getElementById('reglage-effets').value = parametres.effets;
    for (const bouton of document.querySelectorAll('[data-vitesse]')) {
      const actif = Number(bouton.dataset.vitesse) === parametres.vitesse;
      bouton.classList.toggle('actif', actif);
      bouton.setAttribute('aria-pressed', actif);
    }
    for (const bouton of document.querySelectorAll('[data-langue]')) {
      const actif = bouton.dataset.langue === parametres.langue;
      bouton.classList.toggle('actif', actif);
      bouton.setAttribute('aria-pressed', actif);
    }
    Textes.appliquer(parametres.langue);
  },

  // Les transitions entre écrans viennent du CSS : il suffit de changer la classe "visible".
  montrerEcran(idEcran) {
    Menu.ecranActuel = idEcran;
    for (const ecran of document.querySelectorAll('.ecran')) {
      ecran.classList.toggle('visible', ecran.id === idEcran);
    }
  },

  // Échap ramène à l'écran titre depuis les sous-écrans du menu.
  retourDepuisSousEcran() {
    if (['ecran-niveaux', 'ecran-parametres', 'ecran-credits'].includes(Menu.ecranActuel)) {
      Menu.afficherTitre();
    }
  },

  afficherTitre() {
    document.getElementById('confirmation').hidden = true;
    document.getElementById('message-sauvegarde').textContent = '';
    Menu.afficherBulle(null);
    Menu.montrerEcran('ecran-titre');
  },

  afficherJeu(partie) {
    Menu.montrerEcran(null);
    const texte = partie.niveau.boss ? 'niveauBoss' : 'niveau';
    document.getElementById('info-niveau').textContent = Textes.t(texte, { n: partie.numero });
    Menu.afficherBulle(null);
  },

  afficherPause() {
    Menu.montrerEcran('ecran-pause');
  },

  afficherFin({ victoire, temps, etoiles, aUnSuivant }) {
    document.getElementById('fin-titre').textContent = Textes.t(victoire ? 'victoire' : 'defaite');
    document.getElementById('fin-temps').textContent = Textes.t('temps', {
      temps: Menu.formaterTemps(temps),
    });
    const score = document.getElementById('fin-etoiles');
    score.hidden = !victoire;
    score.textContent = victoire ? '★'.repeat(etoiles) + '☆'.repeat(3 - etoiles) : '';
    document.getElementById('bouton-suivant').hidden = !(victoire && aUnSuivant);
    Menu.afficherBulle(null);
    Menu.montrerEcran('ecran-fin');
  },

  afficherBulle(cle) {
    if (cle === Menu.bulleActuelle) return;
    Menu.bulleActuelle = cle;
    const bulle = document.getElementById('bulle-tutoriel');
    bulle.classList.toggle('visible', cle !== null);
    if (cle !== null) bulle.textContent = Textes.t(cle);
  },

  formaterTemps(secondes) {
    const total = Math.floor(secondes);
    return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, '0')} s`;
  },

  creerSegments() {
    const barre = document.getElementById('barre-parts');
    for (const nom of Object.keys(EQUIPES)) {
      if (nom === 'neutre') continue;
      const segment = document.createElement('div');
      segment.className = 'part';
      barre.append(segment);
      Menu.segments[nom] = segment;
    }
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
      segment.style.background = partie.palette[nom].couleur;
      segment.textContent = totaux[nom];
    }
  },
};
