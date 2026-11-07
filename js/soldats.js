// soldats.js — Les soldats : déplacement entre les tours et combats à l'arrivée.

const Soldats = {
  VITESSE: 110, // en unités de carte par seconde
  RAYON: 6,
  DUREE_ANIMATION_COMBAT: 0.45, // en secondes

  // Le soldat garde le niveau de sa tour au moment où il part.
  // "blesse" : il a déjà utilisé son avantage de soldat qui compte double.
  creer(partie, depart, arrivee) {
    partie.soldats.push({
      equipe: depart.equipe,
      depart,
      arrivee,
      niveau: Tours.niveau(depart),
      blesse: false,
      mort: false,
      parcouru: 0,
      longueur: Math.hypot(arrivee.x - depart.x, arrivee.y - depart.y) - Tours.RAYON,
    });
  },

  mettreAJour(partie, dt) {
    for (const soldat of partie.soldats) soldat.parcouru += Soldats.VITESSE * dt;

    // Les rencontres d'abord : deux soldats face à face se battent avant d'atteindre une tour.
    Soldats.resoudreRencontres(partie);

    partie.soldats = partie.soldats.filter((soldat) => {
      if (soldat.parcouru < soldat.longueur) return true;
      Soldats.arriver(partie, soldat);
      return false;
    });

    for (const combat of partie.combats) combat.temps += dt;
    partie.combats = partie.combats.filter((c) => c.temps < Soldats.DUREE_ANIMATION_COMBAT);
  },

  // Les plus anciens sont en tête de la liste : ce sont eux qui se rencontrent en premier.
  resoudreRencontres(partie) {
    const soldats = partie.soldats;
    for (let i = 0; i < soldats.length; i++) {
      const a = soldats[i];
      if (a.mort) continue;
      for (let j = i + 1; j < soldats.length && !a.mort; j++) {
        const b = soldats[j];
        if (!b.mort && Soldats.seRencontrent(a, b)) Soldats.combattre(partie, a, b);
      }
    }
    partie.soldats = soldats.filter((soldat) => !soldat.mort);
  },

  // Deux ennemis sur la même ligne, en sens inverse, qui viennent de se croiser.
  seRencontrent(a, b) {
    return (
      a.equipe !== b.equipe &&
      a.depart === b.arrivee &&
      a.arrivee === b.depart &&
      a.parcouru + b.parcouru >= a.longueur + Tours.RAYON
    );
  },

  // Un soldat de niveau plus élevé compte double : il faut deux adversaires pour le tuer.
  combattre(partie, a, b) {
    const { x, y } = Soldats.position(a);
    partie.combats.push({
      x,
      y,
      temps: 0,
      couleurs: [partie.palette[a.equipe].couleur, partie.palette[b.equipe].couleur],
    });

    if (a.niveau > b.niveau && !a.blesse) {
      a.blesse = true;
      b.mort = true;
    } else if (b.niveau > a.niveau && !b.blesse) {
      b.blesse = true;
      a.mort = true;
    } else {
      a.mort = true;
      b.mort = true;
    }
  },

  // Les règles d'arrivée sur une tour.
  arriver(partie, soldat) {
    const tour = soldat.arrivee;

    if (tour.equipe === soldat.equipe) {
      tour.soldats += 1; // renfort : ne soigne pas les PV
    } else if (tour.soldats > 0) {
      Soldats.combattreTour(soldat, tour);
    } else {
      tour.pv -= 1;
      if (tour.pv <= 0) {
        Tours.capturer(tour, soldat.equipe);
        Lignes.retirerDepuis(partie, tour);
      }
    }
  },

  combattreTour(soldat, tour) {
    const niveauTour = Tours.niveau(tour);
    if (soldat.niveau > niveauTour) {
      // L'attaquant compte double : il tue deux défenseurs, ou un seul s'il est blessé.
      tour.soldats = Math.max(0, tour.soldats - (soldat.blesse ? 1 : 2));
    } else if (niveauTour > soldat.niveau) {
      // Les défenseurs comptent double : il faut deux attaquants pour en tuer un.
      if (tour.demiPerte) tour.soldats -= 1;
      tour.demiPerte = !tour.demiPerte;
    } else {
      tour.soldats -= 1;
    }
  },

  position(soldat) {
    const avancee = soldat.parcouru / (soldat.longueur + Tours.RAYON);
    return {
      x: soldat.depart.x + (soldat.arrivee.x - soldat.depart.x) * avancee,
      y: soldat.depart.y + (soldat.arrivee.y - soldat.depart.y) * avancee,
    };
  },

  dessiner(ctx, partie, vue) {
    const rayon = Math.max(3, Soldats.RAYON * vue.echelle);
    for (const soldat of partie.soldats) {
      const monde = Soldats.position(soldat);
      const { x, y } = vue.versEcran(monde.x, monde.y);
      ctx.beginPath();
      ctx.arc(x, y, rayon, 0, Math.PI * 2);
      ctx.fillStyle = partie.palette[soldat.equipe].couleur;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  },

  // L'animation de combat : un anneau et des étincelles aux couleurs des deux équipes.
  dessinerCombats(ctx, partie, vue) {
    const taille = Math.max(10, 18 * vue.echelle);
    for (const combat of partie.combats) {
      const avancee = combat.temps / Soldats.DUREE_ANIMATION_COMBAT;
      const { x, y } = vue.versEcran(combat.x, combat.y);
      ctx.globalAlpha = 1 - avancee;

      ctx.beginPath();
      ctx.arc(x, y, taille * (0.3 + avancee), 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(
          x + Math.cos(angle) * taille * (0.4 + avancee),
          y + Math.sin(angle) * taille * (0.4 + avancee),
          Math.max(2, 3 * vue.echelle),
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = combat.couleurs[i % 2];
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },
};
