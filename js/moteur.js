// moteur.js — Le cœur du jeu : lance la partie, fait tourner la boucle de jeu et dessine la carte.

const Moteur = {
  DT_MAX: 0.1, // évite un grand saut quand on revient sur un onglet en arrière-plan
  NIVEAU_DEMO: 61, // la bataille affichée derrière le menu
  DUREE_MAX_DEMO: 120,
  EVENEMENTS_MAX: 400,
  canvas: null,
  ctx: null,
  partie: null,
  etat: 'menu', // 'menu', 'enJeu', 'pause' ou 'fin'
  tempsPrecedent: 0,

  demarrer() {
    Sauvegarde.charger();
    Moteur.canvas = document.getElementById('jeu');
    Moteur.ctx = Moteur.canvas.getContext('2d');

    Vue.installer();
    if (!Scene3D.installer(document.getElementById('scene3d'))) {
      Menu.afficherErreur3D();
      return;
    }

    Moteur.partie = Moteur.creerDemo();
    window.addEventListener('resize', Moteur.redimensionner);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !e.repeat) Moteur.touchEchap();
    });
    // Les gestes ne comptent que pendant que la partie tourne.
    Lignes.installerControles(Moteur.canvas, Vue, () =>
      Moteur.etat === 'enJeu' ? Moteur.partie : null,
    );
    InterfaceTours.installer(Vue, () => (Moteur.etat === 'enJeu' ? Moteur.partie : null));
    Menu.installer({
      jouer: () => Moteur.nouvellePartie(Sauvegarde.donnees.niveauAtteint),
      choisirNiveau: Moteur.nouvellePartie,
      recommencer: () => Moteur.nouvellePartie(Moteur.partie.numero),
      suivant: () => Moteur.nouvellePartie(Moteur.partie.numero + 1),
      pause: Moteur.basculerPause,
      menu: Moteur.allerAuMenu,
    });
    Moteur.allerAuMenu();

    requestAnimationFrame((temps) => {
      Moteur.tempsPrecedent = temps;
      Moteur.boucle(temps);
    });
  },

  nouvellePartie(numero) {
    InterfaceTours.fermerTout();
    Moteur.partie = Niveaux.creerPartie(numero);
    Moteur.etat = 'enJeu';
    Menu.afficherJeu(Moteur.partie);
    Moteur.redimensionner();
  },

  allerAuMenu() {
    InterfaceTours.fermerTout();
    Moteur.partie = Moteur.creerDemo();
    Moteur.etat = 'menu';
    Menu.afficherTitre();
    Moteur.redimensionner();
  },

  // Derrière le menu, une vraie bataille se joue toute seule, sans toucher à la sauvegarde.
  creerDemo() {
    const partie = Niveaux.creerPartie(Moteur.NIVEAU_DEMO);
    partie.ordis.push(Ordi.creer({ equipe: EQUIPE_JOUEUR, force: 6 }));
    return partie;
  },

  mettreAJourDemo(dt) {
    const partie = Moteur.partie;
    Moteur.avancer(partie, dt);
    const equipes = new Set(partie.tours.map((tour) => tour.equipe));
    equipes.delete('neutre');
    if (equipes.size <= 1 || partie.temps > Moteur.DUREE_MAX_DEMO) {
      Moteur.partie = Moteur.creerDemo();
    }
  },

  // Échap met en pause, et reprend si le mini menu est déjà ouvert.
  touchEchap() {
    if (InterfaceTours.tourRoue) InterfaceTours.fermerRoue();
    else if (Moteur.etat === 'enJeu' || Moteur.etat === 'pause') Moteur.basculerPause();
    else if (Moteur.etat === 'menu') Menu.retourDepuisSousEcran();
  },

  basculerPause() {
    if (Moteur.etat === 'enJeu') {
      Moteur.etat = 'pause';
      Moteur.partie.trace = null;
      Moteur.partie.coupe = null;
      InterfaceTours.fermerTout();
      Menu.afficherPause();
    } else if (Moteur.etat === 'pause') {
      Moteur.etat = 'enJeu';
      Menu.montrerEcran(null);
    }
  },

  // Gagné quand il ne reste aucune tour ennemie, perdu quand le joueur n'a plus de tours.
  verifierFin() {
    const { tours, ordis, temps, niveau, numero } = Moteur.partie;
    const victoire = !tours.some((tour) => ordis.some((ordi) => ordi.equipe === tour.equipe));
    const defaite = !tours.some((tour) => tour.equipe === EQUIPE_JOUEUR);
    if (!victoire && !defaite) return;

    Moteur.etat = 'fin';
    Moteur.partie.trace = null;
    Moteur.partie.coupe = null;

    const etoiles = victoire ? Niveaux.etoiles(niveau, temps) : 0;
    const pieces = victoire ? Niveaux.piecesGagnees(niveau, etoiles) : 0;
    if (victoire) Sauvegarde.enregistrerVictoire(numero, etoiles, pieces);
    InterfaceTours.fermerTout();
    Scene3D.finDePartie(victoire);
    const afficherFin = () =>
      Menu.afficherFin({ victoire, temps, etoiles, pieces, aUnSuivant: numero < Niveaux.NOMBRE });

    // Si cette victoire débloque quelque chose, on le présente avant l'écran de fin.
    const nouveautes = victoire ? Deblocages.nouveaux() : [];
    if (nouveautes.length > 0) Menu.afficherDeblocages(nouveautes, afficherFin);
    else afficherFin();
  },

  redimensionner() {
    const { canvas, ctx, partie } = Moteur;
    const cadre = canvas.getBoundingClientRect();
    const pixels = window.devicePixelRatio || 1;
    canvas.width = Math.round(cadre.width * pixels);
    canvas.height = Math.round(cadre.height * pixels);
    ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
    Scene3D.redimensionner(cadre.width, cadre.height);
    Vue.ajuster(partie.largeur, partie.hauteur, cadre.width, cadre.height);
  },

  boucle(temps) {
    const dt = Math.min((temps - Moteur.tempsPrecedent) / 1000, Moteur.DT_MAX);
    Moteur.tempsPrecedent = temps;
    // La vitesse x2 joue simplement deux fois plus de temps à chaque image.
    if (Moteur.etat === 'enJeu') Moteur.mettreAJour(dt * Sauvegarde.donnees.parametres.vitesse);
    if (Moteur.etat === 'menu') Moteur.mettreAJourDemo(dt);
    Moteur.dessiner(dt);
    Vignettes.animer(dt);
    requestAnimationFrame(Moteur.boucle);
  },

  // Les règles du jeu, sans la vérification de fin de partie.
  avancer(partie, dt) {
    partie.temps += dt;
    Ordi.mettreAJour(partie, dt);
    for (const tour of partie.tours) Tours.mettreAJour(partie, tour, dt);
    Lignes.mettreAJour(partie, dt);
    Tirs.mettreAJour(partie, dt);
    Soldats.mettreAJour(partie, dt);
    if (partie.evenements.length > Moteur.EVENEMENTS_MAX) partie.evenements.length = 0;
  },

  mettreAJour(dt) {
    const partie = Moteur.partie;
    Tutoriel.mettreAJour(partie, dt);
    Moteur.avancer(partie, dt);
    Moteur.verifierFin();
  },

  dessiner(dt) {
    const { ctx, canvas, partie, etat } = Moteur;
    const pixels = window.devicePixelRatio || 1;

    Scene3D.dessiner(partie, dt, etat);
    ctx.clearRect(0, 0, canvas.width / pixels, canvas.height / pixels);
    if (etat === 'menu') return;

    // Ce qui reste écrit à plat par-dessus la 3D : compteurs, gestes et main du tutoriel.
    Lignes.dessinerGeste(ctx, partie, Vue);
    const { trace } = partie;
    const parProfondeur = [...partie.tours].sort((a, b) => Moteur.profondeur(a) - Moteur.profondeur(b));
    for (const tour of parProfondeur) {
      const visee = trace && trace.aBouge && (trace.cible === tour || trace.depart === tour);
      Tours.dessinerEtiquette(ctx, tour, Vue, visee);
    }
    Tutoriel.dessiner(ctx, partie, Vue);
    Menu.mettreAJourParts(partie);
    InterfaceTours.mettreAJour(partie);
  },

  // Les étiquettes du fond sont dessinées d'abord, celles du devant restent au-dessus.
  profondeur(tour) {
    return Vue.tournee ? -tour.x : tour.y;
  },
};

Moteur.demarrer();
