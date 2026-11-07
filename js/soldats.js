// soldats.js — Les soldats : déplacement entre les tours et combats à l'arrivée.
// Les valeurs de chaque type sont dans donnees-soldats.js.
// Le dessin 3D et les effets sont dans scene3d.js, qui lit "partie.evenements".

const Soldats = {
  VITESSE: 110, // en unités de carte par seconde
  DISTANCE_ENGAGEMENT: 34, // à cette distance d'un ennemi, le soldat lève son arme

  // Le soldat garde le niveau de sa tour au moment où il part.
  creer(partie, depart, arrivee, type) {
    const fiche = TYPES_DE_SOLDATS[type];
    partie.soldats.push({
      type,
      equipe: depart.equipe,
      depart,
      arrivee,
      niveau: Tours.niveau(depart),
      vitesse: Soldats.VITESSE * Tours.fiche(depart).vitesseSoldats * fiche.vitesse,
      phase: Math.random() * Math.PI * 2, // pour que les soldats ne marchent pas tous au pas
      vie: fiche.force, // ce qu'il vaut encore au combat
      vieFleches: fiche.vieFleches,
      engage: false,
      mort: false,
      parcouru: 0,
      longueur: Math.hypot(arrivee.x - depart.x, arrivee.y - depart.y) - Tours.RAYON,
    });
  },

  fiche(soldat) {
    return TYPES_DE_SOLDATS[soldat.type];
  },

  mettreAJour(partie, dt) {
    for (const soldat of partie.soldats) {
      soldat.parcouru += soldat.vitesse * dt;
      soldat.engage = false;
    }

    // Les rencontres d'abord : deux soldats face à face se battent avant d'atteindre une tour.
    Soldats.resoudreRencontres(partie);

    partie.soldats = partie.soldats.filter((soldat) => {
      if (soldat.mort) return false;
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
      if (a.mort || !Soldats.fiche(a).combat) continue;
      for (let j = i + 1; j < soldats.length && !a.mort; j++) {
        const b = soldats[j];
        if (b.mort || !Soldats.sontFaceAFace(a, b) || !Soldats.fiche(b).combat) continue;
        const ecart = a.longueur + Tours.RAYON - a.parcouru - b.parcouru;
        if (ecart <= 0) {
          Soldats.combattre(partie, a, b);
        } else if (ecart < Soldats.DISTANCE_ENGAGEMENT) {
          a.engage = true;
          b.engage = true;
        }
      }
    }
    partie.soldats = soldats.filter((soldat) => !soldat.mort);
  },

  // Deux ennemis sur la même ligne, en sens inverse.
  sontFaceAFace(a, b) {
    return a.equipe !== b.equipe && a.depart === b.arrivee && a.arrivee === b.depart;
  },

  // Chacun compte selon sa force, doublée s'il vient d'une tour de niveau plus élevé.
  // Le plus fort survit, avec ce qu'il lui reste.
  combattre(partie, a, b) {
    const { x, y } = Soldats.position(a);
    partie.evenements.push({ type: 'combat', x, y, equipes: [a.equipe, b.equipe] });

    const bonusA = a.niveau > b.niveau ? 2 : 1;
    const bonusB = b.niveau > a.niveau ? 2 : 1;
    const valeurA = a.vie * bonusA;
    const valeurB = b.vie * bonusB;

    if (valeurA > valeurB) {
      a.vie = (valeurA - valeurB) / bonusA;
      Soldats.tuer(partie, b);
    } else if (valeurB > valeurA) {
      b.vie = (valeurB - valeurA) / bonusB;
      Soldats.tuer(partie, a);
    } else {
      Soldats.tuer(partie, a);
      Soldats.tuer(partie, b);
    }
  },

  // Le soldat tombe : scene3d.js dessine sa chute à partir de cet événement.
  tuer(partie, soldat) {
    if (soldat.mort) return;
    soldat.mort = true;
    const { x, y } = Soldats.position(soldat);
    partie.evenements.push({
      type: 'mort',
      x,
      y,
      soldat: soldat.type,
      equipe: soldat.equipe,
      direction: Math.atan2(soldat.arrivee.x - soldat.depart.x, soldat.arrivee.y - soldat.depart.y),
    });
  },

  // Les règles d'arrivée sur une tour.
  arriver(partie, soldat) {
    const tour = soldat.arrivee;
    const fiche = Soldats.fiche(soldat);

    if (tour.equipe === soldat.equipe) {
      if (fiche.soin) {
        Tours.soigner(partie, tour, fiche.soin);
        return;
      }
      // Renfort : ne soigne pas les PV, et ne dépasse jamais la capacité de la tour.
      tour.soldats = Math.min(tour.soldats + 1, Tours.capacite(tour));
      partie.evenements.push({ type: 'renfort', tour });
      return;
    }

    // Ceux qui ne se battent pas s'arrêtent là, sans rien faire à la tour.
    if (!fiche.combat) return;

    if (tour.type === 'piege') {
      Soldats.declencherPiege(partie, tour, soldat);
    } else if (tour.soldats > 0) {
      Soldats.combattreTour(soldat, tour);
      partie.evenements.push({ type: 'impact', tour, equipe: soldat.equipe });
    } else {
      tour.pv -= Tours.degatsParSoldat(tour) * fiche.degatsPv;
      partie.evenements.push({ type: 'degat', tour, equipe: soldat.equipe });
      if (tour.pv <= 0) {
        Tours.capturer(tour, soldat.equipe);
        Lignes.retirerDepuis(partie, tour);
        partie.evenements.push({ type: 'capture', tour, equipe: soldat.equipe });
      }
    }
  },

  // Le piège explose et détruit les premiers soldats qui arrivent, puis redevient une tour normale.
  declencherPiege(partie, tour, soldat) {
    const { victimesPiege, rayonPiege } = Tours.fiche(tour);
    const proches = partie.soldats
      .filter((s) => s !== soldat && !s.mort && s.arrivee === tour && Soldats.fiche(s).combat)
      .map((s) => {
        const lieu = Soldats.position(s);
        return { s, distance: Math.hypot(lieu.x - tour.x, lieu.y - tour.y) };
      })
      .filter(({ distance }) => distance <= rayonPiege)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, victimesPiege - 1);

    Soldats.tuer(partie, soldat);
    for (const { s } of proches) Soldats.tuer(partie, s);
    tour.type = 'caserne';
    partie.evenements.push({ type: 'piege', tour });
  },

  // Plus l'attaquant est fort, plus il tue de défenseurs. Si la tour a un niveau
  // plus élevé, ses défenseurs comptent double : la perte s'accumule jusqu'à faire un soldat.
  combattreTour(soldat, tour) {
    const niveauTour = Tours.niveau(tour);
    const bonusAttaque = soldat.niveau > niveauTour ? 2 : 1;
    const bonusDefense = niveauTour > soldat.niveau ? 2 : 1;
    tour.perteEnCours += (soldat.vie * bonusAttaque) / bonusDefense;
    const perdus = Math.floor(tour.perteEnCours);
    tour.perteEnCours -= perdus;
    tour.soldats = Math.max(0, tour.soldats - perdus);
  },

  position(soldat) {
    const avancee = soldat.parcouru / (soldat.longueur + Tours.RAYON);
    return {
      x: soldat.depart.x + (soldat.arrivee.x - soldat.depart.x) * avancee,
      y: soldat.depart.y + (soldat.arrivee.y - soldat.depart.y) * avancee,
    };
  },
};
