// ameliorations.js — Les 3 statistiques améliorables de chaque tour et leur prix.

const Ameliorations = {
  STATISTIQUES: ['renforcement', 'production', 'capacite'],
  POINTS_MAX: 6, // au total sur une tour, à répartir librement
  HAUSSE_DU_PRIX: 1.5, // chaque point coûte 1,5 fois plus cher que le précédent
  BONUS_RENFORCEMENT: 0.25, // +25 % de soldats ennemis pour retirer 1 PV, par point
  BONUS_PRODUCTION: 0.3, // +30 % de production, par point
  PART_PV: 0.25, // +25 % des PV de base, par point
  PART_CAPACITE: 0.2, // +20 % de la capacité de base, par point

  pointsUtilises(tour) {
    return tour.points.renforcement + tour.points.production + tour.points.capacite;
  },

  // Le prix monte avec le nombre de points déjà placés sur cette tour.
  prix(tour) {
    const base = Tours.fiche(tour).coutAmelioration;
    return Math.round(base * Math.pow(Ameliorations.HAUSSE_DU_PRIX, Ameliorations.pointsUtilises(tour)));
  },

  estPleine(tour) {
    return Ameliorations.pointsUtilises(tour) >= Ameliorations.POINTS_MAX;
  },

  peutAcheter(partie, tour) {
    return !Ameliorations.estPleine(tour) && (partie.or[tour.equipe] || 0) >= Ameliorations.prix(tour);
  },

  pasPv(tour) {
    return Math.max(1, Math.ceil(tour.pvBase * Ameliorations.PART_PV));
  },

  pasCapacite(tour) {
    return Math.max(1, Math.round(Tours.fiche(tour).capacite * Ameliorations.PART_CAPACITE));
  },

  acheter(partie, tour, statistique) {
    if (!Ameliorations.peutAcheter(partie, tour)) return false;
    partie.or[tour.equipe] -= Ameliorations.prix(tour);
    tour.points[statistique] += 1;

    if (statistique === 'renforcement') {
      tour.pvMax += Ameliorations.pasPv(tour);
      tour.pv += Ameliorations.pasPv(tour);
    }
    partie.evenements.push({ type: 'amelioration', tour, statistique });
    return true;
  },

  // Ce que rapporte le prochain point, pour l'afficher dans le menu rond.
  effet(tour, statistique) {
    if (statistique === 'renforcement') {
      return Textes.t('effetRenforcement', { pv: Ameliorations.pasPv(tour) });
    }
    if (statistique === 'capacite') {
      return Textes.t('effetCapacite', { n: Ameliorations.pasCapacite(tour) });
    }
    const fiche = Tours.fiche(tour);
    const estMine = fiche.production === 0;
    const base = estMine ? fiche.orParSeconde : fiche.production * tour.bonusProduction;
    const gain = (base * Ameliorations.BONUS_PRODUCTION).toFixed(2).replace(/0$/, '');
    return Textes.t(estMine ? 'effetOr' : 'effetProduction', { n: gain });
  },
};
