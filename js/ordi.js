// ordi.js — L'intelligence des équipes jouées par l'ordinateur.

const Ordi = {
  SECONDES_MIN: 2,
  SECONDES_MAX: 3,
  SOLDATS_POUR_RIPOSTER: 3, // en dessous, une tour attaquée préfère demander des renforts
  SOLDATS_POUR_AIDER: 5, // au-dessus, une tour peut envoyer des renforts

  // La force va de 1 à 10. Elle est choisie niveau par niveau, dans niveaux.js.
  creer({ equipe, force }) {
    return { equipe, force, attente: Ordi.tirerAttente() };
  },

  tirerAttente() {
    return Ordi.SECONDES_MIN + Math.random() * (Ordi.SECONDES_MAX - Ordi.SECONDES_MIN);
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
        Ordi.jouer(partie, ordi);
        ordi.attente = Ordi.tirerAttente();
      }
    }
  },

  // Un tour de jeu : la défense passe avant les tours neutres, puis viennent mes tours.
  jouer(partie, ordi) {
    Ordi.nettoyerLignes(partie, ordi);
    for (let i = 0; i < Ordi.actionsParTour(ordi.force); i++) {
      const aJoue =
        Ordi.defendre(partie, ordi) || Ordi.capturer(partie, ordi) || Ordi.attaquer(partie, ordi);
      if (!aJoue) return;
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

  // Combien de soldats il faut envoyer pour prendre la cible, selon les règles de combat.
  coutCapture(cible, niveauAttaquant, distance) {
    const niveauCible = Tours.niveau(cible);
    let prixDefenseur = 1;
    if (niveauAttaquant > niveauCible) prixDefenseur = 0.5;
    if (niveauAttaquant < niveauCible) prixDefenseur = 2;

    // Pendant le trajet, une tour d'une autre équipe continue de produire des soldats.
    const trajet = distance / Soldats.VITESSE;
    const production = EQUIPES[cible.equipe].produit ? trajet * Tours.SOLDATS_PAR_SECONDE : 0;
    return Math.ceil((cible.soldats + production) * prixDefenseur) + cible.pv;
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
      const disponibles = lignesVersCible.reduce((total, l) => total + l.depart.soldats, enRoute);
      const cout = Ordi.coutCapture(arrivee, Tours.niveau(depart), Ordi.distance(depart, arrivee));
      return enRoute < cout && disponibles >= cout;
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

  // Les tours ennemies les plus faibles d'abord.
  attaquer(partie, ordi) {
    const faiblesse = (tour) => tour.soldats + tour.pv;
    const ennemies = partie.tours
      .filter((tour) => tour.equipe !== ordi.equipe && tour.equipe !== 'neutre')
      .sort((a, b) => faiblesse(a) - faiblesse(b));
    return Ordi.lancerSurPremiere(partie, ordi, ennemies);
  },

  lancerSurPremiere(partie, ordi, cibles) {
    return Ordi.ordonner(cibles, ordi).some((cible) => Ordi.lancerAttaque(partie, ordi, cible));
  },

  // Rassemble les tours les plus proches jusqu'à avoir assez de soldats, puis attaque.
  lancerAttaque(partie, ordi, cible) {
    const dejaVisee = partie.lignes.some(
      (l) => l.arrivee === cible && l.depart.equipe === ordi.equipe,
    );
    if (dejaVisee) return false;

    const sources = Ordi.sesTours(partie, ordi)
      .filter((tour) => Lignes.peutPartirDe(partie, tour))
      .sort((a, b) => Ordi.distance(a, cible) - Ordi.distance(b, cible));

    const enRoute = Ordi.renforts(partie, ordi, cible);
    const groupe = [];
    let soldats = enRoute;
    let niveauGroupe = 3;
    for (const source of sources) {
      groupe.push(source);
      soldats += source.soldats;
      niveauGroupe = Math.min(niveauGroupe, Tours.niveau(source));
      const cout = Ordi.coutCapture(cible, niveauGroupe, Ordi.distance(source, cible));
      if (soldats >= cout) {
        for (const tour of groupe) Lignes.ajouter(partie, tour, cible);
        return true;
      }
    }
    return false;
  },
};
