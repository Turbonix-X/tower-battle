// soldats.js — Les soldats : déplacement entre les tours et combats à l'arrivée.

const Soldats = {
  VITESSE: 110, // en unités de carte par seconde
  RAYON: 6,

  creer(partie, depart, arrivee) {
    partie.soldats.push({
      equipe: depart.equipe,
      depart,
      arrivee,
      parcouru: 0,
      longueur: Math.hypot(arrivee.x - depart.x, arrivee.y - depart.y) - Tours.RAYON,
    });
  },

  mettreAJour(partie, dt) {
    partie.soldats = partie.soldats.filter((soldat) => {
      soldat.parcouru += Soldats.VITESSE * dt;
      if (soldat.parcouru < soldat.longueur) return true;
      Soldats.arriver(partie, soldat);
      return false;
    });
  },

  // Les règles d'arrivée sur une tour.
  arriver(partie, soldat) {
    const tour = soldat.arrivee;

    if (tour.equipe === soldat.equipe) {
      tour.soldats += 1; // renfort : ne soigne pas les PV
    } else if (tour.soldats > 0) {
      tour.soldats -= 1; // combat : le soldat et un défenseur disparaissent
    } else {
      tour.pv -= 1;
      if (tour.pv <= 0) {
        Tours.capturer(tour, soldat.equipe);
        Lignes.retirerDepuis(partie, tour);
      }
    }
  },

  dessiner(ctx, partie, vue) {
    const rayon = Math.max(3, Soldats.RAYON * vue.echelle);
    for (const soldat of partie.soldats) {
      const avancee = soldat.parcouru / (soldat.longueur + Tours.RAYON);
      const { x, y } = vue.versEcran(
        soldat.depart.x + (soldat.arrivee.x - soldat.depart.x) * avancee,
        soldat.depart.y + (soldat.arrivee.y - soldat.depart.y) * avancee,
      );
      ctx.beginPath();
      ctx.arc(x, y, rayon, 0, Math.PI * 2);
      ctx.fillStyle = EQUIPES[soldat.equipe].couleur;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  },
};
