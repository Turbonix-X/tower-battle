// tours.js — Les tours : équipe, compteur de soldats et types de tours.

// "produit" : est-ce que les tours de cette équipe gagnent des soldats avec le temps ?
const EQUIPES = {
  bleu: { couleur: '#2f7bff', foncee: '#174a9e', produit: true },
  rouge: { couleur: '#e5383b', foncee: '#8f1d20', produit: true },
  neutre: { couleur: '#9aa0a6', foncee: '#5c6166', produit: false },
};

const EQUIPE_JOUEUR = 'bleu';

const Tours = {
  RAYON: 34,
  SOLDATS_PAR_SECONDE: 1,

  // Une tour a deux valeurs séparées : "soldats" (son attaque) et "pv" (sa durabilité).
  creer({ x, y, equipe, soldats, pv }) {
    return { x, y, equipe, soldats, pv, pvMax: pv, tempsProduction: 0 };
  },

  mettreAJour(tour, dt) {
    if (!EQUIPES[tour.equipe].produit) return;
    tour.tempsProduction += dt * Tours.SOLDATS_PAR_SECONDE;
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

  dessiner(ctx, tour, vue, enSurbrillance) {
    const { x, y } = vue.versEcran(tour.x, tour.y);
    const rayon = Tours.RAYON * vue.echelle;
    const equipe = EQUIPES[tour.equipe];

    // Les créneaux, vus de dessus.
    const creneau = rayon * 0.34;
    ctx.fillStyle = equipe.foncee;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const cx = x + Math.cos(angle) * rayon * 0.92;
      const cy = y + Math.sin(angle) * rayon * 0.92;
      ctx.fillRect(cx - creneau / 2, cy - creneau / 2, creneau, creneau);
    }

    // Le corps de la tour.
    ctx.beginPath();
    ctx.arc(x, y, rayon * 0.92, 0, Math.PI * 2);
    ctx.fillStyle = equipe.foncee;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, rayon * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = equipe.couleur;
    ctx.fill();

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

    // Le compteur de soldats, au-dessus de la barre de PV.
    ctx.font = `bold ${Math.max(15, 24 * vue.echelle)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#10201a';
    ctx.strokeText(tour.soldats, x, barreY - 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tour.soldats, x, barreY - 3);
  },
};
