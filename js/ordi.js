// ordi.js — L'intelligence des équipes jouées par l'ordinateur.

// La personnalité varie le style de jeu, quelle que soit la force.
const PERSONNALITES = {
  equilibre: {
    margeAttaque: 1,
    envieDeDefendre: 1,
    neutresEnPremier: true,
    opportuniste: false,
    statistiquePreferee: 'production',
  },
  agressif: {
    margeAttaque: 0.8,
    envieDeDefendre: 0.6,
    neutresEnPremier: false,
    opportuniste: false,
    statistiquePreferee: 'production',
  },
  defenseur: {
    margeAttaque: 1.3,
    envieDeDefendre: 1,
    neutresEnPremier: true,
    opportuniste: false,
    statistiquePreferee: 'renforcement',
  },
  ruse: {
    margeAttaque: 1,
    envieDeDefendre: 0.9,
    neutresEnPremier: true,
    opportuniste: true,
    statistiquePreferee: 'capacite',
  },
};

const Ordi = {
  SECONDES_MIN: 2,
  SECONDES_MAX: 3,
  SOLDATS_POUR_RIPOSTER: 3, // en dessous, une tour attaquée préfère demander des renforts
  SOLDATS_POUR_AIDER: 5, // au-dessus, une tour peut envoyer des renforts
  CHANCE_OUBLI_LIGNE: 0.3, // un ordi faible finit par couper une ligne au hasard
  POIDS_DISTANCE: 0.05, // combien la distance compte dans le choix d'une cible
  PENALITE_DEJA_VISEE: 20,
  // Le joueur est seul face à plusieurs ordis : ils lui laissent le temps de s'installer,
  // se méfient davantage de lui, et préfèrent s'attaquer entre eux.
  SECONDES_DE_GRACE: 20,
  PENALITE_JOUEUR: 25,
  MARGE_CONTRE_JOUEUR: 1.5,
  MARGE_CONTRE_JOUEUR_FORT: 1.2,

  // La force va de 1 à 10. Elle est choisie niveau par niveau.
  creer({ equipe, force, personnalite = 'equilibre', attenteInitiale }) {
    return {
      equipe,
      force,
      personnalite: PERSONNALITES[personnalite],
      attente: attenteInitiale ?? Ordi.tirerAttente(),
    };
  },

  tirerAttente() {
    return Ordi.SECONDES_MIN + Math.random() * (Ordi.SECONDES_MAX - Ordi.SECONDES_MIN);
  },

  estFaible(ordi) {
    return ordi.force <= 3;
  },

  estFort(ordi) {
    return ordi.force >= 8;
  },

  // Plus l'ordi est fort, plus il fait de choses à chaque tour.
  actionsParTour(force) {
    return 1 + Math.floor(force / 4);
  },

  // Plus l'ordi est faible, plus il risque de ne pas prendre le meilleur choix.
  chanceErreur(force) {
    return (10 - force) * 0.05;
  },

  mettreAJour(partie, dt) {
    for (const ordi of partie.ordis) {
      ordi.attente -= dt;
      if (ordi.attente <= 0) {
        if (Ordi.sesTours(partie, ordi).length > 0) Ordi.jouer(partie, ordi);
        ordi.attente = Ordi.tirerAttente();
      }
    }
  },

  jouer(partie, ordi) {
    if (Ordi.estFaible(ordi)) Ordi.jouerFaible(partie, ordi);
    else Ordi.jouerNormal(partie, ordi);
  },

  // --- Les ordis faibles : ils attaquent au hasard et oublient de se défendre ---

  jouerFaible(partie, ordi) {
    Ordi.couperAuHasard(partie, ordi);

    const penseADefendre = Math.random() < ordi.force * 0.1 * ordi.personnalite.envieDeDefendre;
    if (penseADefendre && Ordi.defendre(partie, ordi)) return;
    if (Math.random() < 0.3) return; // il lui arrive de ne rien faire du tout

    const sources = Ordi.sesTours(partie, ordi).filter(
      (tour) => tour.soldats >= Ordi.SOLDATS_POUR_RIPOSTER && Lignes.peutPartirDe(partie, tour),
    );
    const cibles = partie.tours.filter((tour) => tour.equipe !== ordi.equipe);
    if (sources.length === 0 || cibles.length === 0) return;

    const source = sources[Math.floor(Math.random() * sources.length)];
    const cible = cibles[Math.floor(Math.random() * cibles.length)];
    Lignes.ajouter(partie, source, cible);
  },

  couperAuHasard(partie, ordi) {
    partie.lignes = partie.lignes.filter((ligne) => {
      if (ligne.depart.equipe !== ordi.equipe) return true;
      if (ligne.arrivee.equipe === ordi.equipe) return false; // un renfort sans raison
      return Math.random() >= Ordi.CHANCE_OUBLI_LIGNE;
    });
  },

  // --- Les ordis moyens et forts ---

  // La défense passe en premier. La personnalité décide ensuite qui attaquer d'abord.
  jouerNormal(partie, ordi) {
    Ordi.nettoyerLignes(partie, ordi);
    Ordi.ameliorer(partie, ordi);
    const { personnalite } = ordi;
    for (let i = 0; i < Ordi.actionsParTour(ordi.force); i++) {
      const defend = Math.random() < personnalite.envieDeDefendre && Ordi.defendre(partie, ordi);
      const attaque =
        defend ||
        (personnalite.neutresEnPremier
          ? Ordi.capturer(partie, ordi) || Ordi.attaquer(partie, ordi)
          : Ordi.attaquer(partie, ordi) || Ordi.capturer(partie, ordi));
      if (!attaque) return;
    }
  },

  // --- Ce que l'ordi regarde sur la carte ---

  sesTours(partie, ordi) {
    return partie.tours.filter((tour) => tour.equipe === ordi.equipe);
  },

  // Les soldats de son équipe en route vers cette tour.
  renforts(partie, ordi, tour) {
    return partie.soldats.filter((s) => s.equipe === ordi.equipe && s.arrivee === tour).length;
  },

  // Les soldats ennemis en route vers cette tour.
  assaillants(partie, ordi, tour) {
    return partie.soldats.filter((s) => s.equipe !== ordi.equipe && s.arrivee === tour);
  },

  distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  },

  // Par prudence, l'ordi ne compte que les soldats qu'il a vraiment dans ses tours,
  // même si un envoi coûte moins d'un soldat. Sinon, il attaque trop tôt et trop fort.
  pouvoir(tour) {
    return tour.soldats;
  },

  // Combien de soldats il faut envoyer pour prendre la cible, selon les règles de combat.
  coutCapture(cible, niveauAttaquant, distance) {
    const niveauCible = Tours.niveau(cible);
    let prixDefenseur = 1;
    if (niveauAttaquant > niveauCible) prixDefenseur = 0.5;
    if (niveauAttaquant < niveauCible) prixDefenseur = 2;

    // Une tour ennemie continue de produire pendant le trajet et pendant le combat.
    let defenseurs = cible.soldats;
    if (EQUIPES[cible.equipe].produit) {
      const trajet = distance / Soldats.VITESSE;
      defenseurs = (defenseurs + trajet * Tours.production(cible)) * 1.5;
    }
    return Math.ceil(defenseurs * prixDefenseur + cible.pv / Tours.degatsParSoldat(cible));
  },

  // Les ordis moyens et forts dépensent leur or pour améliorer leur tour la mieux remplie,
  // chacun selon son style.
  ameliorer(partie, ordi) {
    if (Ordi.estFaible(ordi)) return;
    const tour = Ordi.sesTours(partie, ordi)
      .filter((t) => Ameliorations.peutAcheter(partie, t))
      .sort((a, b) => b.soldats - a.soldats)[0];
    if (tour) Ameliorations.acheter(partie, tour, ordi.personnalite.statistiquePreferee);
  },

  // Parfois, selon la force, l'ordi essaie son deuxième meilleur choix avant le meilleur.
  ordonner(choix, ordi) {
    if (choix.length > 1 && Math.random() < Ordi.chanceErreur(ordi.force)) {
      [choix[0], choix[1]] = [choix[1], choix[0]];
    }
    return choix;
  },

  // --- Les décisions ---

  // Coupe les lignes qui n'ont plus de raison d'être, pour ne pas vider ses tours.
  nettoyerLignes(partie, ordi) {
    partie.lignes = partie.lignes.filter((ligne) => {
      const { depart, arrivee } = ligne;
      if (depart.equipe !== ordi.equipe) return true;

      // Un renfort ne sert que si la tour aidée est attaquée.
      if (arrivee.equipe === ordi.equipe) {
        return Ordi.assaillants(partie, ordi, arrivee).length > 0;
      }

      // Une riposte continue tant que la cible envoie des soldats sur cette tour.
      if (Ordi.assaillants(partie, ordi, depart).some((s) => s.depart === arrivee)) return true;

      // Une attaque s'arrête quand assez de soldats sont partis, ou si elle ne peut plus réussir.
      const lignesVersCible = partie.lignes.filter(
        (l) => l.arrivee === arrivee && l.depart.equipe === ordi.equipe,
      );
      const enRoute = Ordi.renforts(partie, ordi, arrivee);
      const disponibles = lignesVersCible.reduce((total, l) => total + Ordi.pouvoir(l.depart), enRoute);
      const cout = Ordi.coutCapture(arrivee, Tours.niveau(depart), Ordi.distance(depart, arrivee));
      if (enRoute >= cout || disponibles < cout) return false;

      // Un ordi fort abandonne si une autre cible est devenue bien plus facile.
      return !(Ordi.estFort(ordi) && Ordi.existeCibleBienPlusFacile(partie, ordi, depart, cout));
    });
  },

  existeCibleBienPlusFacile(partie, ordi, depart, coutActuel) {
    return partie.tours.some((tour) => {
      if (tour.equipe === ordi.equipe || tour.equipe === 'neutre') return false;
      const cout = Ordi.coutCapture(tour, Tours.niveau(depart), Ordi.distance(depart, tour));
      return cout < coutActuel * 0.5;
    });
  },

  // Répond à l'attaque la plus dangereuse qui n'a pas encore de réponse.
  defendre(partie, ordi) {
    const danger = (tour) => Ordi.assaillants(partie, ordi, tour).length - tour.soldats;
    const attaquees = Ordi.sesTours(partie, ordi)
      .filter((tour) => Ordi.assaillants(partie, ordi, tour).length > 0)
      .filter((tour) => !Ordi.aDejaUneReponse(partie, ordi, tour))
      .sort((a, b) => danger(b) - danger(a));

    for (const tour of Ordi.ordonner(attaquees, ordi)) {
      const attaquant = Ordi.assaillants(partie, ordi, tour)[0].depart;
      if (Ordi.riposter(partie, ordi, tour, attaquant) || Ordi.appelerRenforts(partie, ordi, tour)) {
        return true;
      }
    }
    return false;
  },

  aDejaUneReponse(partie, ordi, tour) {
    const attaquants = Ordi.assaillants(partie, ordi, tour).map((s) => s.depart);
    return partie.lignes.some(
      (l) =>
        (l.arrivee === tour && l.depart.equipe === ordi.equipe) ||
        (l.depart === tour && attaquants.includes(l.arrivee)),
    );
  },

  // Une tour qui riposte envoie ses soldats à la rencontre de ceux de l'attaquant.
  riposter(partie, ordi, tour, attaquant) {
    if (attaquant.equipe === ordi.equipe) return false;
    if (tour.soldats < Ordi.SOLDATS_POUR_RIPOSTER) return false;
    if (!Lignes.peutPartirDe(partie, tour)) return false;
    Lignes.ajouter(partie, tour, attaquant);
    return true;
  },

  appelerRenforts(partie, ordi, tour) {
    const aide = Ordi.sesTours(partie, ordi)
      .filter((t) => t !== tour && t.soldats >= Ordi.SOLDATS_POUR_AIDER)
      .filter((t) => Lignes.peutPartirDe(partie, t))
      .sort((a, b) => Ordi.distance(a, tour) - Ordi.distance(b, tour))[0];
    if (!aide) return false;
    Lignes.ajouter(partie, aide, tour);
    return true;
  },

  // Les tours neutres les plus proches d'abord.
  capturer(partie, ordi) {
    const proximite = (cible) =>
      Math.min(...Ordi.sesTours(partie, ordi).map((tour) => Ordi.distance(tour, cible)));
    const neutres = partie.tours
      .filter((tour) => tour.equipe === 'neutre')
      .sort((a, b) => proximite(a) - proximite(b));
    return Ordi.lancerSurPremiere(partie, ordi, neutres);
  },

  // Les tours ennemies les plus faibles d'abord. Tous les ennemis comptent, pas seulement le joueur.
  attaquer(partie, ordi) {
    const joueurProtege = partie.temps < Ordi.SECONDES_DE_GRACE;
    const ennemies = partie.tours
      .filter((tour) => tour.equipe !== ordi.equipe && tour.equipe !== 'neutre')
      .filter((tour) => !(joueurProtege && tour.equipe === EQUIPE_JOUEUR))
      .sort((a, b) => Ordi.faiblesse(partie, ordi, a) - Ordi.faiblesse(partie, ordi, b));
    return Ordi.lancerSurPremiere(partie, ordi, ennemies);
  },

  // Plus le score est bas, plus la tour est une proie facile.
  faiblesse(partie, ordi, tour) {
    let score = tour.soldats + tour.pv;

    // Une tour lointaine intéresse moins : chaque ordi s'en prend surtout à ses voisins.
    const proximite = Math.min(...Ordi.sesTours(partie, ordi).map((t) => Ordi.distance(t, tour)));
    score += proximite * Ordi.POIDS_DISTANCE;

    // Une tour déjà visée par une autre équipe intéresse moins, sauf le rusé plus bas :
    // ainsi, les ordis ne se jettent pas tous en même temps sur la même tour.
    const dejaVisee = partie.lignes.some(
      (l) => l.arrivee === tour && l.depart.equipe !== ordi.equipe,
    );
    if (dejaVisee && !ordi.personnalite.opportuniste) score += Ordi.PENALITE_DEJA_VISEE;

    if (tour.equipe === EQUIPE_JOUEUR) score += Ordi.PENALITE_JOUEUR;

    // Un ordi fort repère les tours qui se vident parce qu'elles envoient des soldats.
    if (Ordi.estFort(ordi)) {
      const lignes = partie.lignes.filter((l) => l.depart === tour).length;
      score -= lignes * 8;
    }

    // Le rusé profite d'une tour déjà occupée à se battre contre quelqu'un d'autre.
    if (ordi.personnalite.opportuniste) {
      const attaqueeParAutres = partie.soldats.some(
        (s) => s.arrivee === tour && s.equipe !== tour.equipe && s.equipe !== ordi.equipe,
      );
      if (attaqueeParAutres) score -= 15;
    }
    return score;
  },

  lancerSurPremiere(partie, ordi, cibles) {
    return Ordi.ordonner(cibles, ordi).some((cible) => Ordi.lancerAttaque(partie, ordi, cible));
  },

  // Rassemble les tours les plus proches jusqu'à avoir assez de soldats, puis attaque.
  // Un ordi fort attend d'avoir une vraie marge, et attaque par plusieurs côtés si possible.
  lancerAttaque(partie, ordi, cible) {
    const dejaVisee = partie.lignes.some(
      (l) => l.arrivee === cible && l.depart.equipe === ordi.equipe,
    );
    if (dejaVisee) return false;

    const sources = Ordi.sesTours(partie, ordi)
      .filter((tour) => Lignes.peutPartirDe(partie, tour))
      .sort((a, b) => Ordi.distance(a, cible) - Ordi.distance(b, cible));

    let marge = ordi.personnalite.margeAttaque * (Ordi.estFort(ordi) ? 1.2 : 1);
    if (cible.equipe === EQUIPE_JOUEUR) {
      marge *= Ordi.estFort(ordi) ? Ordi.MARGE_CONTRE_JOUEUR_FORT : Ordi.MARGE_CONTRE_JOUEUR;
    }
    const coteMin = Ordi.estFort(ordi) && cible.equipe !== 'neutre' ? Math.min(2, sources.length) : 1;

    const enRoute = Ordi.renforts(partie, ordi, cible);
    const groupe = [];
    let pouvoir = enRoute;
    let niveauGroupe = 3;
    for (const source of sources) {
      groupe.push(source);
      pouvoir += Ordi.pouvoir(source);
      niveauGroupe = Math.min(niveauGroupe, Tours.niveau(source));
      const cout = Ordi.coutCapture(cible, niveauGroupe, Ordi.distance(source, cible));
      if (pouvoir >= cout * marge && groupe.length >= coteMin) {
        for (const tour of groupe) Lignes.ajouter(partie, tour, cible);
        return true;
      }
    }
    return false;
  },
};
