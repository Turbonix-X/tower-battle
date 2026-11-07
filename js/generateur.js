// generateur.js — Fabrique les niveaux à partir de leur numéro.
// La même graine donne toujours les mêmes tirages : le niveau 57 est toujours le même.

const Generateur = {
  TENTATIVES_MAX: 60,
  DISTANCE_MIN_TOURS: 140, // assez pour ne pas chevaucher les compteurs
  DISTANCE_MIN_ENNEMIS: 380,
  MARGE_COTE: 80,
  MARGE_HAUT: 105, // les compteurs dépassent au-dessus des tours
  MARGE_BAS: 60,
  EQUIPES_ENNEMIES: ['rouge', 'jaune', 'vert', 'orange', 'violet'],
  PERSONNALITES: ['agressif', 'defenseur', 'ruse'],

  // Un générateur aléatoire à graine (mulberry32).
  aleatoire(graine) {
    let etat = graine >>> 0;
    return () => {
      etat = (etat + 0x6d2b79f5) >>> 0;
      let t = etat;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  entre(tirage, min, max) {
    return min + Math.floor(tirage() * (max - min + 1));
  },

  estBoss(numero) {
    return numero % 50 === 0;
  },

  // Tout ce qui fait monter la difficulté, doucement, selon le numéro.
  reglages(numero) {
    const avancee = (numero - 1) / 999; // de 0 (niveau 1) à 1 (niveau 1000)
    const boss = Generateur.estBoss(numero);
    return {
      boss,
      avancee,
      nbTours: 8 + Math.round(14 * Math.sqrt(avancee)) + (boss ? 2 : 0),
      largeur: Math.round(1000 + 350 * avancee),
      hauteur: Math.round(640 + 230 * avancee),
      soldatsJoueur: 15 + Math.round(15 * avancee),
      toursJoueur: numero >= 300 ? 2 : 1,
      soldatsEnnemi: 6 + Math.round(24 * avancee),
      toursParEnnemi: numero >= 500 ? 2 : 1,
      soldatsNeutres: [2 + Math.round(6 * avancee), 8 + Math.round(20 * avancee)],
      pvNeutres: [3 + Math.round(5 * avancee), 8 + Math.round(16 * avancee)],
      pvDepart: 20 + Math.round(20 * avancee),
      forceBase: 1 + 9 * Math.pow(avancee, 0.6) + (boss ? 1 : 0),
      nbEnnemis: boss ? 1 : Generateur.nombreEnnemis(numero),

      // Réglages vides pour plus tard.
      decor: null,
      obstacles: [],
      typesDeTours: ['base'],
      brouillard: null,
    };
  },

  nombreEnnemis(numero) {
    if (numero >= 850) return 5;
    if (numero >= 600) return 4;
    if (numero >= 250) return 3;
    if (numero >= 60) return 2;
    return 1;
  },

  // Essaie plusieurs graines jusqu'à obtenir un niveau jouable.
  creer(numero) {
    const reglages = Generateur.reglages(numero);
    let niveau = null;
    for (let essai = 0; essai < Generateur.TENTATIVES_MAX; essai++) {
      const tirage = Generateur.aleatoire(Math.imul(numero, 7919) + Math.imul(essai, 104729));
      niveau = Generateur.construire(numero, reglages, tirage);
      if (niveau && Generateur.verifier(niveau, reglages).length === 0) return niveau;
    }
    throw new Error(`Niveau ${numero} impossible à générer`);
  },

  construire(numero, reglages, tirage) {
    const places = Generateur.placerTours(reglages, tirage);
    if (!places) return null;

    const ordis = Generateur.choisirOrdis(reglages, tirage);
    const { joueur, ennemis, neutres } = places;
    const tours = [];

    for (const position of joueur) {
      tours.push({
        ...position,
        equipe: EQUIPE_JOUEUR,
        soldats: reglages.soldatsJoueur,
        pv: reglages.pvDepart,
      });
    }

    ennemis.forEach((groupe, indice) => {
      for (const position of groupe) {
        tours.push({
          ...position,
          equipe: ordis[indice].equipe,
          soldats: reglages.soldatsEnnemi,
          pv: reglages.pvDepart,
        });
      }
    });

    for (const position of neutres) {
      tours.push({
        ...position,
        equipe: 'neutre',
        soldats: Generateur.entre(tirage, ...reglages.soldatsNeutres),
        pv: Generateur.entre(tirage, ...reglages.pvNeutres),
      });
    }

    if (reglages.boss) Generateur.renforcerBoss(tours, ordis, reglages);

    return {
      numero,
      boss: reglages.boss,
      largeur: reglages.largeur,
      hauteur: reglages.hauteur,
      ordis,
      tours,
      tempsEtoiles: Generateur.tempsEtoiles(reglages),
      decor: reglages.decor,
      obstacles: reglages.obstacles,
      typesDeTours: reglages.typesDeTours,
      brouillard: reglages.brouillard,
    };
  },

  // Le boss : une tour couronnée, bien plus solide, qui produit plus vite.
  renforcerBoss(tours, ordis, reglages) {
    const tourBoss = tours.find((tour) => tour.equipe === ordis[0].equipe);
    tourBoss.boss = true;
    tourBoss.production = 1.5;
    tourBoss.soldats = 15 + Math.round(85 * reglages.avancee);
    tourBoss.pv = 40 + Math.round(100 * reglages.avancee);
  },

  choisirOrdis(reglages, tirage) {
    const equipes = [...Generateur.EQUIPES_ENNEMIES.slice(1)];
    const ordis = [];
    for (let i = 0; i < reglages.nbEnnemis; i++) {
      // La première équipe ennemie est toujours rouge.
      const equipe =
        i === 0 ? 'rouge' : equipes.splice(Generateur.entre(tirage, 0, equipes.length - 1), 1)[0];
      const ecart = Generateur.entre(tirage, -1, 1) * 0.6;
      const force = Math.round(reglages.forceBase + ecart);
      ordis.push({
        equipe,
        force: Math.min(10, Math.max(1, force)),
        personnalite: Generateur.PERSONNALITES[Generateur.entre(tirage, 0, 2)],
      });
    }
    return ordis;
  },

  // Le joueur à gauche, les ennemis loin de lui, et les tours neutres dans la place restante.
  placerTours(reglages, tirage) {
    const { largeur, hauteur } = reglages;
    const haut = Generateur.MARGE_HAUT;
    const bas = hauteur - Generateur.MARGE_BAS;
    const gauche = Generateur.MARGE_COTE;
    const droite = largeur - Generateur.MARGE_COTE;
    const toutes = [];

    const estLibre = (x, y) =>
      toutes.every((t) => Math.hypot(t.x - x, t.y - y) >= Generateur.DISTANCE_MIN_TOURS);
    const point = (minX, maxX) => ({
      x: minX + tirage() * (maxX - minX),
      y: haut + tirage() * (bas - haut),
    });

    // Cherche au hasard une place libre qui respecte une condition.
    const placer = (minX, maxX, condition = () => true) => {
      for (let i = 0; i < 80; i++) {
        const p = point(minX, maxX);
        if (estLibre(p.x, p.y) && condition(p)) {
          const position = { x: Math.round(p.x), y: Math.round(p.y) };
          toutes.push(position);
          return position;
        }
      }
      return null;
    };

    const zoneJoueur = gauche + (droite - gauche) * 0.2;
    const joueur = [];
    for (let i = 0; i < reglages.toursJoueur; i++) {
      const position = placer(gauche, zoneJoueur);
      if (!position) return null;
      joueur.push(position);
    }

    const loinDuJoueur = (p) =>
      joueur.every((j) => Math.hypot(j.x - p.x, j.y - p.y) >= Generateur.DISTANCE_MIN_ENNEMIS);

    const ennemis = [];
    for (let e = 0; e < reglages.nbEnnemis; e++) {
      const groupe = [];
      for (let i = 0; i < reglages.toursParEnnemi; i++) {
        const position = placer(gauche + (droite - gauche) * 0.4, droite, loinDuJoueur);
        if (!position) return null;
        groupe.push(position);
      }
      ennemis.push(groupe);
    }

    const neutres = [];
    const nbNeutres = reglages.nbTours - toutes.length;
    for (let i = 0; i < nbNeutres; i++) {
      const position = placer(gauche, droite);
      if (!position) return null;
      neutres.push(position);
    }
    return { joueur, ennemis, neutres };
  },

  tempsEtoiles(reglages) {
    const base = 30 + reglages.nbTours * 4 + reglages.nbEnnemis * 12 + (reglages.boss ? 60 : 0);
    return { trois: base, deux: Math.round(base * 1.8) };
  },

  // Renvoie la liste des problèmes du niveau (vide si tout va bien).
  verifier(niveau, reglages) {
    const problemes = [];
    const { tours, ordis, largeur, hauteur } = niveau;

    for (let i = 0; i < tours.length; i++) {
      const a = tours[i];
      if (a.x < 0 || a.y < 0 || a.x > largeur || a.y > hauteur) problemes.push('hors de la carte');
      for (let j = i + 1; j < tours.length; j++) {
        const distance = Math.hypot(a.x - tours[j].x, a.y - tours[j].y);
        if (distance < Generateur.DISTANCE_MIN_TOURS - 1) problemes.push('tours trop proches');
      }
    }

    const duJoueur = tours.filter((t) => t.equipe === EQUIPE_JOUEUR);
    const neutres = tours.filter((t) => t.equipe === 'neutre');
    if (duJoueur.length === 0) problemes.push('pas de tour pour le joueur');
    for (const ordi of ordis) {
      if (!tours.some((t) => t.equipe === ordi.equipe)) problemes.push('ordi sans tour');
    }

    // Pas d'ennemi collé au joueur dès le départ.
    const ennemies = tours.filter((t) => t.equipe !== EQUIPE_JOUEUR && t.equipe !== 'neutre');
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    for (const ennemie of ennemies) {
      if (duJoueur.some((j) => distance(j, ennemie) < Generateur.DISTANCE_MIN_ENNEMIS - 1)) {
        problemes.push('ennemi trop proche');
      }
    }

    // Le joueur doit pouvoir prendre une tour neutre proche, plus près de lui que des ennemis.
    const pouvoirDepart = reglages.soldatsJoueur / Lignes.COUT_ATTAQUE;
    const atteignable = neutres.some((neutre) => {
      const pourJoueur = Math.min(...duJoueur.map((j) => distance(j, neutre)));
      const pourEnnemi = Math.min(...ennemies.map((e) => distance(e, neutre)));
      return pourJoueur < pourEnnemi && neutre.soldats + neutre.pv <= pouvoirDepart;
    });
    if (!atteignable) problemes.push('aucune tour neutre à portée du joueur');

    return problemes;
  },
};
