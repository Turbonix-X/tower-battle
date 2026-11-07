// tirs.js — Ce que font les tours toutes seules : flèches, boulets de canon et soins autour d'elles.
// Les réglages de chaque tour sont dans donnees-tours.js. Le dessin est dans scene3d.js.

const Tirs = {
  SECONDES_ENTRE_EFFETS_SOIN: 0.7,

  mettreAJour(partie, dt) {
    for (const tour of partie.tours) {
      if (!EQUIPES[tour.equipe].produit) continue;
      const fiche = Tours.fiche(tour);
      if (fiche.aura) Tirs.soignerAutour(partie, tour, fiche.aura, dt);
      if (fiche.tir) Tirs.viser(partie, tour, fiche.tir, dt);
    }
    Tirs.avancerProjectiles(partie, dt);
  },

  // --- Les flèches et les boulets ---

  viser(partie, tour, tir, dt) {
    tour.tempsTir = Math.max(0, tour.tempsTir - dt);
    if (tour.tempsTir > 0) return;

    const portee = Tours.portee(tour);
    const cible =
      tir.projectile === 'fleche'
        ? Tirs.soldatLePlusProche(partie, tour, portee)
        : Tirs.tourLaPlusAbimee(partie, tour, portee);
    if (!cible) return;

    tour.tempsTir = tir.secondes;
    tour.dernierTir = partie.temps;
    tour.visee = cible;
    partie.projectiles.push({
      genre: tir.projectile,
      equipe: tour.equipe,
      depart: tour,
      cible,
      degats: tir.degats,
      temps: 0,
      duree: tir.duree,
      x: tour.x,
      y: tour.y,
      cibleX: cible.x,
      cibleY: cible.y,
    });
    partie.evenements.push({ type: 'tir', tour, genre: tir.projectile });
  },

  // La flèche vise le soldat ennemi le plus proche, même s'il attaque une autre tour.
  soldatLePlusProche(partie, tour, portee) {
    let meilleur = null;
    let meilleureDistance = portee;
    for (const soldat of partie.soldats) {
      if (soldat.mort || soldat.equipe === tour.equipe) continue;
      const lieu = Soldats.position(soldat);
      const distance = Math.hypot(lieu.x - tour.x, lieu.y - tour.y);
      if (distance <= meilleureDistance) {
        meilleur = soldat;
        meilleureDistance = distance;
      }
    }
    return meilleur;
  },

  // Le boulet vise la tour ennemie à portée qui a le moins de PV, sans viser les tours neutres.
  // Une tour à 1 PV n'est plus visée : seuls des soldats peuvent l'achever.
  tourLaPlusAbimee(partie, tour, portee) {
    let meilleure = null;
    for (const autre of partie.tours) {
      if (autre.equipe === tour.equipe || !EQUIPES[autre.equipe].produit || autre.pv <= 1) continue;
      if (Math.hypot(autre.x - tour.x, autre.y - tour.y) > portee) continue;
      if (!meilleure || autre.pv < meilleure.pv) meilleure = autre;
    }
    return meilleure;
  },

  avancerProjectiles(partie, dt) {
    partie.projectiles = partie.projectiles.filter((p) => {
      p.temps += dt;

      // La flèche suit le soldat tant qu'il est vivant.
      if (p.genre === 'fleche' && !p.cible.mort) {
        const lieu = Soldats.position(p.cible);
        p.cibleX = lieu.x;
        p.cibleY = lieu.y;
      }
      if (p.temps < p.duree) return true;

      if (p.genre === 'fleche') Tirs.toucherSoldat(partie, p);
      else Tirs.toucherTour(partie, p);
      return false;
    });
  },

  toucherSoldat(partie, p) {
    const soldat = p.cible;
    partie.evenements.push({ type: 'fleche', x: p.cibleX, y: p.cibleY, bloquee: !soldat.mort && soldat.vieFleches > p.degats });
    if (soldat.mort) return;
    soldat.vieFleches -= p.degats;
    if (soldat.vieFleches <= 0) Soldats.tuer(partie, soldat);
  },

  toucherTour(partie, p) {
    const tour = p.cible;
    partie.evenements.push({ type: 'boulet', tour, x: p.cibleX, y: p.cibleY });
    if (tour.equipe === p.equipe) return; // elle a changé de camp pendant le vol
    tour.pv = Math.max(1, tour.pv - Tours.degatsDeCanon(tour, p.degats));
  },

  // --- Les soins autour de la tour soin ---

  soignerAutour(partie, tour, aura, dt) {
    for (const autre of partie.tours) {
      if (autre === tour || autre.equipe !== tour.equipe || autre.pv >= autre.pvMax) continue;
      if (Math.hypot(autre.x - tour.x, autre.y - tour.y) > aura.portee) continue;
      Tours.soigner(partie, autre, aura.pvParSeconde * dt, true);
    }
  },
};
