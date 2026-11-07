// lignes.js — Les lignes entre les tours : les tracer, les retenir et les retirer.
// Le dessin 3D des lignes est dans scene3d.js. Ici, on ne dessine que le geste en cours.

const Lignes = {
  SECONDES_ENTRE_SOLDATS: 0.5, // soit environ 2 soldats par seconde
  DEPLACEMENT_MAX_TOUCHER: 12, // en pixels : au-delà, ce n'est plus un simple toucher

  // Ce que coûte à la tour un soldat envoyé sur un adversaire.
  // À 2 soldats par seconde, elle perd 0,8 par seconde et en gagne 1 : son compteur monte.
  COUT_ATTAQUE: 0.4,
  // Un renfort entre deux tours d'une même équipe coûte un soldat entier,
  // sinon deux tours pourraient fabriquer des soldats à l'infini en s'envoyant des renforts.
  COUT_RENFORT: 1,

  // Une tour a besoin de soldats, et de place dans sa limite de lignes.
  peutPartirDe(partie, tour) {
    const lignes = partie.lignes.filter((ligne) => ligne.depart === tour).length;
    return tour.soldats > 0 && lignes < Tours.lignesMax(tour);
  },

  // La ligne dépend des deux tours : celle qui envoie, et celle qui reçoit (voir donnees-liens.js).
  peutRelier(partie, depart, arrivee) {
    if (!Lignes.peutPartirDe(partie, depart)) return false;
    if (depart === arrivee) return false;
    if (Tours.fiche(depart).aura && arrivee.equipe !== depart.equipe) return false; // on ne soigne que ses alliés

    const recues = partie.lignes.filter(
      (l) =>
        l.arrivee === arrivee && l.depart.equipe === depart.equipe && l.depart.type === depart.type,
    ).length;
    return recues < receptionsMax(depart.type, arrivee.type);
  },

  // Renvoie true si la ligne a bien été créée.
  ajouter(partie, depart, arrivee) {
    if (partie.lignes.some((l) => l.depart === depart && l.arrivee === arrivee)) return false;
    if (!Lignes.peutRelier(partie, depart, arrivee)) return false;
    partie.lignes.push({ depart, arrivee, attente: 0, enPause: false });
    return true;
  },

  // Une tour qui change d'équipe ne continue pas les envois de son ancienne équipe.
  retirerDepuis(partie, tour) {
    partie.lignes = partie.lignes.filter((ligne) => ligne.depart !== tour);
  },

  mettreAJour(partie, dt) {
    // Si le niveau baisse, les lignes les plus récentes se mettent en pause.
    const lignesVues = new Map();
    for (const ligne of partie.lignes) {
      const { depart, arrivee } = ligne;
      const rang = lignesVues.get(depart) || 0;
      lignesVues.set(depart, rang + 1);
      ligne.enPause = rang >= Tours.lignesMax(depart);

      ligne.attente = Math.max(0, ligne.attente - dt);
      if (!ligne.enPause && ligne.attente === 0 && depart.soldats > 0) {
        const type = Tours.typeDeSoldatActif(partie, depart);
        if (type) {
          Soldats.creer(partie, depart, arrivee, type); // avant le retrait, pour garder le bon niveau
          Lignes.payerEnvoi(depart, arrivee, type);
          ligne.attente = Lignes.SECONDES_ENTRE_SOLDATS;
        }
      }
    }

    // Une tour sans soldats arrête ses lignes. Les soldats en route continuent.
    // Un ordi ne garde jamais de ligne au-delà de sa limite : les lignes en trop disparaissent.
    // Une ligne de soin s'arrête si la tour soignée a changé de camp.
    partie.lignes = partie.lignes.filter((ligne) => {
      if (ligne.depart.soldats <= 0) return false;
      if (Tours.fiche(ligne.depart).aura && ligne.arrivee.equipe !== ligne.depart.equipe) return false;
      return !ligne.enPause || ligne.depart.equipe === EQUIPE_JOUEUR;
    });
  },

  payerEnvoi(depart, arrivee, type) {
    const fiche = TYPES_DE_SOLDATS[type];
    const renfort = depart.equipe === arrivee.equipe && !fiche.soin;
    depart.detteEnvoi += renfort ? Lignes.COUT_RENFORT : Lignes.COUT_ATTAQUE * fiche.coutEnvoi;
    while (depart.detteEnvoi >= 1) {
      depart.detteEnvoi -= 1;
      depart.soldats = Math.max(0, depart.soldats - 1);
    }
  },

  // Coupe les lignes du joueur croisées par le segment p1-p2 (en coordonnées d'écran).
  couper(partie, vue, p1, p2) {
    partie.lignes = partie.lignes.filter((ligne) => {
      if (ligne.depart.equipe !== EQUIPE_JOUEUR) return true;
      const a = vue.versEcran(ligne.depart.x, ligne.depart.y);
      const b = vue.versEcran(ligne.arrivee.x, ligne.arrivee.y);
      const coupee = Lignes.segmentsSeCroisent(p1, p2, a, b);
      if (coupee) partie.evenements.push({ type: 'coupe', ligne, x: (ligne.depart.x + ligne.arrivee.x) / 2, y: (ligne.depart.y + ligne.arrivee.y) / 2 });
      return !coupee;
    });
  },

  segmentsSeCroisent(p1, p2, a, b) {
    const cote = (o, u, v) => (u.x - o.x) * (v.y - o.y) - (u.y - o.y) * (v.x - o.x);
    return (
      cote(p1, p2, a) * cote(p1, p2, b) < 0 &&
      cote(a, b, p1) * cote(a, b, p2) < 0
    );
  },

  // Souris et doigt passent par les mêmes événements "pointer".
  // Un geste qui part de ma tour trace une ligne. Partout ailleurs, il coupe.
  // Toucher ma tour sans bouger ouvre le menu d'amélioration.
  // "obtenirPartie" renvoie la partie en cours, ou rien si les gestes sont bloqués.
  installerControles(canvas, vue, obtenirPartie) {
    const lirePointeur = (e, partie) => {
      const cadre = canvas.getBoundingClientRect();
      const x = e.clientX - cadre.left;
      const y = e.clientY - cadre.top;
      return { x, y, tour: Tours.trouverSurEcran(partie.tours, vue, x, y) };
    };

    canvas.addEventListener('pointerdown', (e) => {
      const partie = obtenirPartie();
      if (!partie || partie.trace || partie.coupe || e.button !== 0) return;
      InterfaceTours.fermerRoue();
      const { x, y, tour } = lirePointeur(e, partie);
      canvas.setPointerCapture(e.pointerId);
      InterfaceTours.debutAppui(tour, x, y);
      if (tour && tour.equipe === EQUIPE_JOUEUR) {
        partie.trace = {
          pointeur: e.pointerId,
          depart: tour,
          cible: null,
          ecranX: x,
          ecranY: y,
          departX: x,
          departY: y,
          aBouge: false,
        };
      } else {
        partie.coupe = { pointeur: e.pointerId, points: [{ x, y }], departX: x, departY: y };
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      const partie = obtenirPartie();
      if (!partie) return;
      const { x, y, tour } = lirePointeur(e, partie);
      const { trace, coupe } = partie;

      if (trace && trace.pointeur === e.pointerId) {
        trace.ecranX = x;
        trace.ecranY = y;
        trace.cible = tour === trace.depart ? null : tour;
        if (Math.hypot(x - trace.departX, y - trace.departY) > Lignes.DEPLACEMENT_MAX_TOUCHER) {
          trace.aBouge = true;
          InterfaceTours.annulerAppui();
        }
      } else if (coupe && coupe.pointeur === e.pointerId) {
        Lignes.couper(partie, vue, coupe.points[coupe.points.length - 1], { x, y });
        coupe.points.push({ x, y });
        if (Math.hypot(x - coupe.departX, y - coupe.departY) > Lignes.DEPLACEMENT_MAX_TOUCHER) {
          InterfaceTours.annulerAppui();
        }
      } else if (e.pointerType === 'mouse') {
        InterfaceTours.survol(tour, x, y);
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      const partie = obtenirPartie();
      if (!partie) return;
      const { trace, coupe } = partie;
      const ficheVue = InterfaceTours.finAppui();

      if (trace && trace.pointeur === e.pointerId) {
        const { tour } = lirePointeur(e, partie);
        partie.trace = null;
        if (!trace.aBouge) {
          // Un simple toucher : on ouvre le menu, sauf si la fiche d'info vient d'être lue.
          if (!ficheVue && trace.depart.equipe === EQUIPE_JOUEUR) InterfaceTours.ouvrirRoue(trace.depart);
        } else if (tour && trace.depart.equipe === EQUIPE_JOUEUR) {
          // La tour a pu être perdue pendant le tracé.
          Lignes.ajouter(partie, trace.depart, tour);
        }
      } else if (coupe && coupe.pointeur === e.pointerId) {
        partie.coupe = null;
      }
    });

    canvas.addEventListener('pointercancel', (e) => {
      const partie = obtenirPartie();
      InterfaceTours.finAppui();
      if (!partie) return;
      if (partie.trace && partie.trace.pointeur === e.pointerId) partie.trace = null;
      if (partie.coupe && partie.coupe.pointeur === e.pointerId) partie.coupe = null;
    });

    canvas.addEventListener('pointerleave', () => InterfaceTours.survol(null));
  },

  // Ce qui suit la souris ou le doigt : la ligne en pointillés, ou le trait de coupe.
  dessinerGeste(ctx, partie, vue) {
    const { trace, coupe } = partie;
    const epaisseur = Math.max(3, 5 * vue.echelle);

    if (trace && trace.aBouge) {
      const a = vue.versEcran(trace.depart.x, trace.depart.y);
      const b = trace.cible
        ? vue.versEcran(trace.cible.x, trace.cible.y)
        : { x: trace.ecranX, y: trace.ecranY };
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.setLineDash([10, 8]);
      // En rouge si la tour ne peut pas envoyer une ligne de plus.
      const possible = trace.cible
        ? Lignes.peutRelier(partie, trace.depart, trace.cible)
        : Lignes.peutPartirDe(partie, trace.depart);
      ctx.strokeStyle = possible ? '#ffffff' : '#ff6b6b';
      ctx.lineWidth = epaisseur;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (coupe && coupe.points.length > 1) {
      ctx.beginPath();
      coupe.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  },
};
