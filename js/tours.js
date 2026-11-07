// tours.js — Les tours : équipe, compteur de soldats et types de tours.

// "produit" : est-ce que les tours de cette équipe gagnent des soldats avec le temps ?
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

// "lignesParNiveau" : combien de lignes peuvent partir en même temps aux niveaux 1, 2 et 3.
const TYPES_DE_TOURS = {
  base: { lignesParNiveau: [1, 2, 3] },
};

// Le nombre de soldats à partir duquel une tour atteint les niveaux 2 et 3.
const SEUILS_NIVEAU = [10, 30];

const Tours = {
  RAYON: 34,
  SOLDATS_PAR_SECONDE: 1,

  // Une tour a deux valeurs séparées : "soldats" (son attaque) et "pv" (sa durabilité).
  // "production" multiplie les soldats gagnés : une tour de boss en produit plus.
  creer({ x, y, equipe, soldats, pv, type = 'base', production = 1, boss = false }) {
    return {
      x,
      y,
      equipe,
      type,
      soldats,
      pv,
      pvMax: pv,
      production,
      boss,
      tempsProduction: 0,
      demiPerte: false,
      detteEnvoi: 0,
    };
  },

  // Le niveau découle du compteur : il monte et redescend tout seul avec les soldats.
  niveau(tour) {
    return 1 + SEUILS_NIVEAU.filter((seuil) => tour.soldats >= seuil).length;
  },

  lignesMax(tour) {
    return TYPES_DE_TOURS[tour.type].lignesParNiveau[Tours.niveau(tour) - 1];
  },

  mettreAJour(tour, dt) {
    if (!EQUIPES[tour.equipe].produit) return;
    tour.tempsProduction += dt * Tours.SOLDATS_PAR_SECONDE * tour.production;
    while (tour.tempsProduction >= 1) {
      tour.tempsProduction -= 1;
      tour.soldats += 1;
    }
  },

  capturer(tour, equipe) {
    tour.equipe = equipe;
    tour.pv = tour.pvMax;
    tour.soldats = 0;
    tour.tempsProduction = 0;
    tour.demiPerte = false;
    tour.detteEnvoi = 0;
  },

  // Renvoie la tour la plus proche du point (x, y), à moins de "portee" de son centre.
  trouverA(tours, x, y, portee) {
    let meilleure = null;
    let meilleureDistance = portee;
    for (const tour of tours) {
      const distance = Math.hypot(tour.x - x, tour.y - y);
      if (distance <= meilleureDistance) {
        meilleure = tour;
        meilleureDistance = distance;
      }
    }
    return meilleure;
  },

  dessiner(ctx, tour, vue, palette, enSurbrillance) {
    const { x, y } = vue.versEcran(tour.x, tour.y);
    const rayon = Tours.RAYON * vue.echelle;
    const equipe = palette[tour.equipe];

    // Les créneaux, vus de dessus.
    const creneau = rayon * 0.34;
    ctx.fillStyle = equipe.foncee;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const cx = x + Math.cos(angle) * rayon * 0.92;
      const cy = y + Math.sin(angle) * rayon * 0.92;
      ctx.fillRect(cx - creneau / 2, cy - creneau / 2, creneau, creneau);
    }

    // Le corps de la tour, avec un contour clair pour rester visible sur l'herbe.
    ctx.beginPath();
    ctx.arc(x, y, rayon * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = equipe.foncee;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, rayon * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = equipe.couleur;
    ctx.fill();

    if (tour.boss) Tours.dessinerCouronne(ctx, x, y, rayon);

    if (enSurbrillance) {
      ctx.beginPath();
      ctx.arc(x, y, rayon * 1.25, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // La barre de PV, juste au-dessus de la tour.
    const largeurBarre = rayon * 2;
    const hauteurBarre = Math.max(5, 8 * vue.echelle);
    const barreX = x - largeurBarre / 2;
    const barreY = y - rayon * 1.3 - hauteurBarre;
    ctx.fillStyle = '#10201a';
    ctx.fillRect(barreX - 1, barreY - 1, largeurBarre + 2, hauteurBarre + 2);
    ctx.fillStyle = '#7ee06f';
    ctx.fillRect(barreX, barreY, largeurBarre * (tour.pv / tour.pvMax), hauteurBarre);

    // Les points de niveau, entre le compteur et la barre de PV.
    const niveau = Tours.niveau(tour);
    const rayonPoint = Math.max(2.5, 4 * vue.echelle);
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
    ctx.font = `bold ${Math.max(15, 24 * vue.echelle)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#10201a';
    ctx.strokeText(tour.soldats, x, compteurY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tour.soldats, x, compteurY);
  },

  // Un anneau doré et une couronne pour reconnaître la tour d'un boss.
  dessinerCouronne(ctx, x, y, rayon) {
    ctx.beginPath();
    ctx.arc(x, y, rayon * 1.1, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffd84d';
    ctx.lineWidth = 3;
    ctx.stroke();

    const l = rayon * 0.5;
    const h = rayon * 0.32;
    ctx.beginPath();
    ctx.moveTo(x - l, y + h);
    ctx.lineTo(x - l, y - h);
    ctx.lineTo(x - l / 2, y);
    ctx.lineTo(x, y - h);
    ctx.lineTo(x + l / 2, y);
    ctx.lineTo(x + l, y - h);
    ctx.lineTo(x + l, y + h);
    ctx.closePath();
    ctx.fillStyle = '#ffd84d';
    ctx.fill();
    ctx.strokeStyle = '#10201a';
    ctx.lineWidth = 1;
    ctx.stroke();
  },
};
