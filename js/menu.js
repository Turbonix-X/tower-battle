// menu.js — Les écrans et les boutons : titre, paramètres, crédits, pause, fin et barre du haut.

const VERSION_JEU = 'Alpha 1.7';

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
    brancher('bouton-collection', () => {
      Collection.afficher();
      Menu.montrerEcran('ecran-collection');
    });
    brancher('bouton-boutique', () => {
      Boutique.afficher();
      Menu.montrerEcran('ecran-boutique');
    });
    brancher('deblocage-continuer', Menu.deblocageSuivant);
    Collection.installer();
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
      Menu.afficherPieces();
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
    const sousEcrans = ['ecran-niveaux', 'ecran-parametres', 'ecran-credits', 'ecran-collection', 'ecran-boutique'];
    if (sousEcrans.includes(Menu.ecranActuel)) {
      Menu.afficherTitre();
    }
  },

  afficherTitre() {
    document.body.classList.add('mode-menu');
    document.getElementById('confirmation').hidden = true;
    document.getElementById('message-sauvegarde').textContent = '';
    Menu.afficherBulle(null);
    Menu.afficherPieces();
    Menu.montrerEcran('ecran-titre');
  },

  afficherPieces() {
    document.getElementById('pieces-titre').textContent = Sauvegarde.donnees.pieces;
  },

  afficherJeu(partie) {
    document.body.classList.remove('mode-menu');
    Menu.montrerEcran(null);
    const texte = partie.niveau.boss ? 'niveauBoss' : 'niveau';
    document.getElementById('info-niveau').textContent = Textes.t(texte, { n: partie.numero });
    Menu.afficherBulle(null);
  },

  afficherPause() {
    Menu.montrerEcran('ecran-pause');
  },

  afficherFin({ victoire, temps, etoiles, pieces, aUnSuivant }) {
    document.getElementById('fin-titre').textContent = Textes.t(victoire ? 'victoire' : 'defaite');
    document.getElementById('ecran-fin').classList.toggle('fin-defaite', !victoire);
    document.getElementById('fin-temps').textContent = Textes.t('temps', {
      temps: Menu.formaterTemps(temps),
    });

    const score = document.getElementById('fin-etoiles');
    score.hidden = !victoire;
    score.replaceChildren();
    for (let i = 0; i < 3 && victoire; i++) {
      const etoile = document.createElement('span');
      etoile.textContent = i < etoiles ? '★' : '☆';
      etoile.className = i < etoiles ? 'etoile etoile-gagnee' : 'etoile';
      etoile.style.animationDelay = `${0.35 + i * 0.22}s`;
      score.append(etoile);
    }

    const gain = document.getElementById('fin-pieces');
    gain.hidden = !victoire;
    gain.textContent = victoire ? Textes.t('piecesGagnees', { n: pieces }) : '';

    document.getElementById('bouton-suivant').hidden = !(victoire && aUnSuivant);
    Menu.afficherBulle(null);
    Menu.montrerEcran('ecran-fin');
  },

  // Présente les nouveautés une par une, puis continue avec "ensuite".
  afficherDeblocages(entrees, ensuite) {
    Menu.deblocagesAVoir = [...entrees];
    Menu.apresDeblocages = ensuite;
    Deblocages.marquerVus(entrees);
    Menu.afficherBulle(null);
    Menu.deblocageSuivant();
  },

  deblocageSuivant() {
    const entree = Menu.deblocagesAVoir.shift();
    if (!entree) {
      Vignettes.arreter();
      Menu.apresDeblocages();
      return;
    }
    document.getElementById('deblocage-genre').textContent = Textes.t(
      entree.genre === 'tour' ? 'nouvelleTour' : 'nouveauSoldat',
    );
    document.getElementById('deblocage-nom').textContent = Textes.t(entree.fiche.nom);
    document.getElementById('deblocage-description').textContent = Textes.t(entree.fiche.description);
    document.getElementById('deblocage-apprendre').textContent = Textes.t('apprendreAuProchainNiveau');
    Vignettes.faireTourner(entree);
    Menu.montrerEcran('ecran-deblocage');
    // Rejoue l'animation d'arrivée pour chaque nouveauté.
    const contenu = document.getElementById('deblocage-contenu');
    contenu.classList.remove('arrivee');
    void contenu.offsetWidth;
    contenu.classList.add('arrivee');
  },

  afficherBulle(cle) {
    if (cle === Menu.bulleActuelle) return;
    Menu.bulleActuelle = cle;
    const bulle = document.getElementById('bulle-tutoriel');
    bulle.classList.toggle('visible', cle !== null);
    if (cle !== null) bulle.textContent = Textes.t(cle);
  },

  // Sans 3D, le jeu ne peut pas s'afficher : on le dit clairement.
  afficherErreur3D() {
    Textes.appliquer(Sauvegarde.donnees.parametres.langue);
    document.body.classList.add('mode-menu');
    document.getElementById('erreur-3d').hidden = false;
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

  // La barre du haut : la part de soldats des équipes présentes, et l'or du joueur.
  mettreAJourParts(partie) {
    const totaux = Menu.compterSoldats(partie);
    const presentes = new Set(partie.ordis.map((ordi) => ordi.equipe)).add(EQUIPE_JOUEUR);
    for (const [nom, segment] of Object.entries(Menu.segments)) {
      segment.hidden = !presentes.has(nom);
      segment.style.flexGrow = totaux[nom];
      segment.style.background = partie.palette[nom].couleur;
      segment.textContent = totaux[nom];
    }

    const or = String(Math.floor(partie.or[EQUIPE_JOUEUR] || 0));
    const affichage = document.getElementById('or-partie');
    if (affichage.textContent !== or) affichage.textContent = or;
  },
};
