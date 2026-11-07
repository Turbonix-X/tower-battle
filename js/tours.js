// tours.js — Les règles des tours : équipe, compteur de soldats, production et or.
// Les valeurs de chaque type sont dans donnees-tours.js. Le dessin 3D est dans modeles3d.js.

// "produit" : est-ce que les tours de cette équipe produisent avec le temps ?
// "teinte" : la couleur de base d'une équipe d'ordi, dont l'intensité dépend de sa force.
const EQUIPES = {
  bleu: { couleur: '#2f7bff', foncee: '#174a9e', produit: true },
  neutre: { couleur: '#9aa0a6', foncee: '#5c6166', produit: false },
  rouge: { teinte: 0, produit: true },
  jaune: { teinte: 50, produit: true },
  vert: { teinte: 125, produit: true },
  orange: { teinte: 28, produit: true },
  violet: { teinte: 275, produit: true },
};

const EQUIPE_JOUEUR = 'bleu';

// Force 1 : couleur très pâle. Force 10 : couleur très foncée et intense.
function couleursEquipe(nom, force = 5) {
  const equipe = EQUIPES[nom];
  if (equipe.teinte === undefined) return { couleur: equipe.couleur, foncee: equipe.foncee };
  const avancee = (force - 1) / 9;
  const saturation = 55 + 45 * avancee;
  const lumiere = 82 - 50 * avancee;
  return {
    couleur: `hsl(${equipe.teinte}, ${saturation}%, ${lumiere}%)`,
    foncee: `hsl(${equipe.teinte}, ${saturation}%, ${Math.max(16, lumiere - 20)}%)`,
  };
}

// Le nombre de soldats à partir duquel une tour atteint les niveaux 2 et 3.
const SEUILS_NIVEAU = [10, 30];

const Tours = {
  RAYON: 34,

  // Une tour a deux valeurs séparées : "soldats" (son attaque) et "pv" (sa durabilité).
  // "bonusProduction" : une tour de boss produit plus vite que les autres.
  creer({ x, y, equipe, soldats, pv, type = 'caserne', bonusProduction = 1, boss = false }) {
    const fiche = TYPES_DE_TOURS[type];
    const pvBase = Math.max(1, Math.round(pv * fiche.multiplicateurPv));
    return {
      x,
      y,
      equipe,
      type,
      soldats,
      pv: pvBase,
      pvBase,
      pvMax: pvBase,
      // La capacité n'est jamais plus petite que les soldats présents au départ.
      capaciteBase: Math.max(fiche.capacite, soldats),
      bonusProduction,
      boss,
      points: { renforcement: 0, production: 0, capacite: 0 },
      tempsProduction: 0,
      demiPerte: false,
      detteEnvoi: 0,
    };
  },

  fiche(tour) {
    return TYPES_DE_TOURS[tour.type];
  },

  // Le niveau découle du compteur : il monte et redescend tout seul avec les soldats.
  niveau(tour) {
    return 1 + SEUILS_NIVEAU.filter((seuil) => tour.soldats >= seuil).length;
  },

  lignesMax(tour) {
    return Tours.fiche(tour).lignesParNiveau[Tours.niveau(tour) - 1];
  },

  production(tour) {
    return (
      Tours.fiche(tour).production *
      tour.bonusProduction *
      (1 + Ameliorations.BONUS_PRODUCTION * tour.points.production)
    );
  },

  // Sur une mine, les points de production augmentent l'or. Sur les autres, seulement les soldats.
  orParSeconde(tour) {
    const fiche = Tours.fiche(tour);
    const bonus = fiche.production === 0 ? tour.points.production : 0;
    return fiche.orParSeconde * (1 + Ameliorations.BONUS_PRODUCTION * bonus);
  },

  capacite(tour) {
    return tour.capaciteBase + Ameliorations.pasCapacite(tour) * tour.points.capacite;
  },

  soldatsParPv(tour) {
    const base = Tours.fiche(tour).soldatsParPv;
    return base * (1 + Ameliorations.BONUS_RENFORCEMENT * tour.points.renforcement);
  },

  // Les PV retirés par un soldat ennemi une fois qu'il n'y a plus de défenseurs.
  degatsParSoldat(tour) {
    return Tours.fiche(tour).pvParSoldat / Tours.soldatsParPv(tour);
  },

  // Une tour pleine arrête de produire des soldats.
  mettreAJour(partie, tour, dt) {
    if (!EQUIPES[tour.equipe].produit) return;

    partie.or[tour.equipe] = (partie.or[tour.equipe] || 0) + Tours.orParSeconde(tour) * dt;

    if (tour.soldats >= Tours.capacite(tour)) {
      tour.tempsProduction = 0;
      return;
    }
    tour.tempsProduction += dt * Tours.production(tour);
    while (tour.tempsProduction >= 1) {
      tour.tempsProduction -= 1;
      tour.soldats = Math.min(tour.soldats + 1, Tours.capacite(tour));
    }
  },

  // Une tour capturée repart de zéro : elle perd ses améliorations.
  capturer(tour, equipe) {
    tour.equipe = equipe;
    tour.points = { renforcement: 0, production: 0, capacite: 0 };
    tour.pvMax = tour.pvBase;
    tour.pv = tour.pvMax;
    tour.soldats = 0;
    tour.tempsProduction = 0;
    tour.demiPerte = false;
    tour.detteEnvoi = 0;
  },

  // Trouve la tour sous le doigt ou la souris. La zone reste assez grande pour un doigt.
  trouverSurEcran(tours, vue, x, y) {
    const portee = Math.max(Tours.RAYON * 1.4 * vue.echelle, 28);
    let meilleure = null;
    let meilleureDistance = portee;
    for (const tour of tours) {
      const point = vue.versEcran(tour.x, tour.y, 20);
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance <= meilleureDistance) {
        meilleure = tour;
        meilleureDistance = distance;
      }
    }
    return meilleure;
  },

  // Le compteur, les points de niveau et la barre de PV, écrits au-dessus de la tour en 3D.
  dessinerEtiquette(ctx, tour, vue, enSurbrillance) {
    const hauteur = tour.hauteurVisuelle || 70;
    const base = vue.versEcran(tour.x, tour.y, hauteur);
    const echelle = vue.echelle;
    const x = base.x;

    const largeurBarre = Math.max(36, 58 * echelle);
    const hauteurBarre = Math.max(5, 7 * echelle);
    const barreY = base.y - hauteurBarre - 6;
    const part = Math.max(0, tour.pv / tour.pvMax);

    if (enSurbrillance) {
      const sol = vue.versEcran(tour.x, tour.y, 0);
      ctx.beginPath();
      ctx.ellipse(
        sol.x,
        sol.y,
        Tours.RAYON * 1.45 * echelle,
        Tours.RAYON * 1.15 * echelle,
        0,
        0,
        Math.PI * 2,
      );
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // La barre de PV : verte, puis jaune, puis rouge quand la tour faiblit.
    ctx.fillStyle = 'rgba(8, 18, 12, 0.85)';
    ctx.fillRect(x - largeurBarre / 2 - 1, barreY - 1, largeurBarre + 2, hauteurBarre + 2);
    ctx.fillStyle = part > 0.5 ? '#7ee06f' : part > 0.25 ? '#ffd84d' : '#ff6b5e';
    ctx.fillRect(x - largeurBarre / 2, barreY, largeurBarre * part, hauteurBarre);

    // Les points de niveau, entre le compteur et la barre de PV.
    const niveau = Tours.niveau(tour);
    const rayonPoint = Math.max(2.5, 3.5 * echelle);
    const pointY = barreY - rayonPoint - 3;
    for (let i = 0; i < niveau; i++) {
      ctx.beginPath();
      ctx.arc(x + (i - (niveau - 1) / 2) * rayonPoint * 3, pointY, rayonPoint, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd84d';
      ctx.fill();
      ctx.strokeStyle = '#10201a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Le compteur de soldats, tout en haut.
    const compteurY = pointY - rayonPoint - 2;
    ctx.font = `800 ${Math.max(15, 24 * echelle)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#10201a';
    ctx.strokeText(tour.soldats, x, compteurY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tour.soldats, x, compteurY);
  },
};
