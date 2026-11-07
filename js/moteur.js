// moteur.js — Le cœur du jeu : lance la partie, fait tourner la boucle de jeu et dessine la carte.

// La vue fait la conversion entre la carte (taille fixe) et l'écran (taille variable).
// Sur un écran en hauteur, la carte est tournée pour le remplir, avec le joueur en bas.
const Vue = {
  echelle: 1,
  decalageX: 0,
  decalageY: 0,
  tournee: false,
  largeurCarte: 0,
  hauteurCarte: 0,

  ajuster(largeurCarte, hauteurCarte, largeurEcran, hauteurEcran) {
    Vue.largeurCarte = largeurCarte;
    Vue.hauteurCarte = hauteurCarte;
    Vue.tournee = hauteurEcran > largeurEcran;
    const largeurVue = Vue.tournee ? hauteurCarte : largeurCarte;
    const hauteurVue = Vue.tournee ? largeurCarte : hauteurCarte;
    Vue.echelle = Math.min(largeurEcran / largeurVue, hauteurEcran / hauteurVue);
    Vue.decalageX = (largeurEcran - largeurVue * Vue.echelle) / 2;
    Vue.decalageY = (hauteurEcran - hauteurVue * Vue.echelle) / 2;
  },

  versEcran(x, y) {
    return Vue.tournee
      ? {
          x: Vue.decalageX + y * Vue.echelle,
          y: Vue.decalageY + (Vue.largeurCarte - x) * Vue.echelle,
        }
      : { x: Vue.decalageX + x * Vue.echelle, y: Vue.decalageY + y * Vue.echelle };
  },

  versMonde(ecranX, ecranY) {
    const a = (ecranX - Vue.decalageX) / Vue.echelle;
    const b = (ecranY - Vue.decalageY) / Vue.echelle;
    return Vue.tournee ? { x: Vue.largeurCarte - b, y: a } : { x: a, y: b };
  },
};

const Moteur = {
  DT_MAX: 0.1, // évite un grand saut quand on revient sur un onglet en arrière-plan
  canvas: null,
  ctx: null,
  partie: null,
  etat: 'menu', // 'menu', 'enJeu', 'pause' ou 'fin'
  tempsPrecedent: 0,

  demarrer() {
    Moteur.canvas = document.getElementById('jeu');
    Moteur.ctx = Moteur.canvas.getContext('2d');
    Moteur.partie = Niveaux.creerPartie(0);

    Moteur.redimensionner();
    window.addEventListener('resize', Moteur.redimensionner);
    // Les gestes ne comptent que pendant que la partie tourne.
    Lignes.installerControles(Moteur.canvas, Vue, () =>
      Moteur.etat === 'enJeu' ? Moteur.partie : null,
    );
    Menu.installer({
      jouer: Moteur.nouvellePartie,
      recommencer: Moteur.nouvellePartie,
      pause: Moteur.basculerPause,
      menu: Moteur.allerAuMenu,
    });
    Moteur.allerAuMenu();

    requestAnimationFrame((temps) => {
      Moteur.tempsPrecedent = temps;
      Moteur.boucle(temps);
    });
  },

  nouvellePartie() {
    Moteur.partie = Niveaux.creerPartie(0);
    Moteur.etat = 'enJeu';
    Moteur.redimensionner();
    Menu.afficherJeu();
  },

  allerAuMenu() {
    Moteur.partie = Niveaux.creerPartie(0); // la carte reste visible derrière le menu
    Moteur.etat = 'menu';
    Menu.afficherMenu();
  },

  basculerPause() {
    if (Moteur.etat === 'enJeu') {
      Moteur.etat = 'pause';
      Moteur.partie.trace = null;
      Moteur.partie.coupe = null;
      Menu.afficherPause();
    } else if (Moteur.etat === 'pause') {
      Moteur.etat = 'enJeu';
      Menu.afficherJeu();
    }
  },

  verifierFin() {
    const { tours, ordis, temps } = Moteur.partie;
    const victoire = !tours.some((tour) => ordis.some((ordi) => ordi.equipe === tour.equipe));
    const defaite = !tours.some((tour) => tour.equipe === EQUIPE_JOUEUR);
    if (!victoire && !defaite) return;

    Moteur.etat = 'fin';
    Moteur.partie.trace = null;
    Moteur.partie.coupe = null;
    Menu.afficherFin(victoire, temps);
  },

  redimensionner() {
    const { canvas, ctx, partie } = Moteur;
    const cadre = canvas.getBoundingClientRect();
    const pixels = window.devicePixelRatio || 1;
    canvas.width = Math.round(cadre.width * pixels);
    canvas.height = Math.round(cadre.height * pixels);
    ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
    Vue.ajuster(partie.largeur, partie.hauteur, cadre.width, cadre.height);
  },

  boucle(temps) {
    const dt = Math.min((temps - Moteur.tempsPrecedent) / 1000, Moteur.DT_MAX);
    Moteur.tempsPrecedent = temps;
    if (Moteur.etat === 'enJeu') Moteur.mettreAJour(dt);
    Moteur.dessiner();
    Menu.mettreAJourParts(Moteur.partie);
    requestAnimationFrame(Moteur.boucle);
  },

  mettreAJour(dt) {
    const partie = Moteur.partie;
    partie.temps += dt;
    Ordi.mettreAJour(partie, dt);
    for (const tour of partie.tours) Tours.mettreAJour(tour, dt);
    Lignes.mettreAJour(partie, dt);
    Soldats.mettreAJour(partie, dt);
    Moteur.verifierFin();
  },

  dessiner() {
    const { ctx, canvas, partie } = Moteur;
    const pixels = window.devicePixelRatio || 1;

    ctx.fillStyle = '#1d3b27';
    ctx.fillRect(0, 0, canvas.width / pixels, canvas.height / pixels);
    Moteur.dessinerCarte();

    Lignes.dessiner(ctx, partie, Vue);
    Soldats.dessiner(ctx, partie, Vue);
    Soldats.dessinerCombats(ctx, partie, Vue);
    Lignes.dessinerGeste(ctx, partie, Vue);
    for (const tour of partie.tours) {
      const visee = partie.trace && (partie.trace.cible === tour || partie.trace.depart === tour);
      Tours.dessiner(ctx, tour, Vue, visee);
    }
  },

  dessinerCarte() {
    const { ctx, partie } = Moteur;
    const a = Vue.versEcran(0, 0);
    const b = Vue.versEcran(partie.largeur, partie.hauteur);
    const gauche = Math.min(a.x, b.x);
    const haut = Math.min(a.y, b.y);
    const largeur = Math.abs(b.x - a.x);
    const hauteur = Math.abs(b.y - a.y);

    ctx.fillStyle = '#2f5d3a';
    ctx.fillRect(gauche, haut, largeur, hauteur);

    // Un quadrillage discret pour donner du relief au terrain.
    const pas = 80 * Vue.echelle;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = gauche + pas; x < gauche + largeur; x += pas) {
      ctx.moveTo(x, haut);
      ctx.lineTo(x, haut + hauteur);
    }
    for (let y = haut + pas; y < haut + hauteur; y += pas) {
      ctx.moveTo(gauche, y);
      ctx.lineTo(gauche + largeur, y);
    }
    ctx.stroke();
  },
};

Moteur.demarrer();
