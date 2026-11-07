// soldats.js — Les soldats : déplacement entre les tours et combats à l'arrivée.
// Le dessin 3D et les effets sont dans scene3d.js, qui lit "partie.evenements".

const Soldats = {
  VITESSE: 110, // en unités de carte par seconde

  // Le soldat garde le niveau de sa tour au moment où il part.
  // "blesse" : il a déjà utilisé son avantage de soldat qui compte double.
  creer(partie, depart, arrivee) {
    partie.soldats.push({
      equipe: depart.equipe,
      depart,
      arrivee,
      niveau: Tours.niveau(depart),
      vitesse: Soldats.VITESSE * Tours.fiche(depart).vitesseSoldats,
      phase: Math.random() * Math.PI * 2, // pour que les soldats ne marchent pas tous au pas
      blesse: false,
      mort: false,
      parcouru: 0,
      longueur: Math.hypot(arrivee.x - depart.x, arrivee.y - depart.y) - Tours.RAYON,
    });
  },

  mettreAJour(partie, dt) {
    for (const soldat of partie.soldats) soldat.parcouru += soldat.vitesse * dt;

    // Les rencontres d'abord : deux soldats face à face se battent avant d'atteindre une tour.
    Soldats.resoudreRencontres(partie);

    partie.soldats = partie.soldats.filter((soldat) => {
      if (soldat.parcouru < soldat.longueur) return true;
      Soldats.arriver(partie, soldat);
      return false;
    });
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
    partie.evenements.push({ type: 'combat', x, y, equipes: [a.equipe, b.equipe] });

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
      // Renfort : ne soigne pas les PV, et ne dépasse jamais la capacité de la tour.
      tour.soldats = Math.min(tour.soldats + 1, Tours.capacite(tour));
      partie.evenements.push({ type: 'renfort', tour });
    } else if (tour.soldats > 0) {
      Soldats.combattreTour(soldat, tour);
      partie.evenements.push({ type: 'impact', tour, equipe: soldat.equipe });
    } else {
      tour.pv -= Tours.degatsParSoldat(tour);
      partie.evenements.push({ type: 'degat', tour, equipe: soldat.equipe });
      if (tour.pv <= 0) {
        Tours.capturer(tour, soldat.equipe);
        Lignes.retirerDepuis(partie, tour);
        partie.evenements.push({ type: 'capture', tour, equipe: soldat.equipe });
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
};
