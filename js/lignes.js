// lignes.js — Les lignes entre les tours : les tracer, les retenir et les retirer.

const Lignes = {
  SECONDES_ENTRE_SOLDATS: 0.5, // soit environ 2 soldats par seconde

  // Une tour a besoin de soldats, et de place dans sa limite de lignes.
  peutPartirDe(partie, tour) {
    const lignes = partie.lignes.filter((ligne) => ligne.depart === tour).length;
    return tour.soldats > 0 && lignes < Tours.lignesMax(tour);
  },

  ajouter(partie, depart, arrivee) {
    if (depart === arrivee) return;
    if (partie.lignes.some((l) => l.depart === depart && l.arrivee === arrivee)) return;
    if (!Lignes.peutPartirDe(partie, depart)) return;
    partie.lignes.push({ depart, arrivee, attente: 0, enPause: false });
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
        Soldats.creer(partie, depart, arrivee); // avant le retrait, pour garder le bon niveau
        depart.soldats -= 1;
        ligne.attente = Lignes.SECONDES_ENTRE_SOLDATS;
      }
    }

    // Une tour sans soldats arrête ses lignes. Les soldats en route continuent.
    partie.lignes = partie.lignes.filter((ligne) => ligne.depart.soldats > 0);
  },

  // Coupe les lignes du joueur croisées par le segment p1-p2 (en coordonnées d'écran).
  couper(partie, vue, p1, p2) {
    partie.lignes = partie.lignes.filter((ligne) => {
      if (ligne.depart.equipe !== EQUIPE_JOUEUR) return true;
      const a = vue.versEcran(ligne.depart.x, ligne.depart.y);
      const b = vue.versEcran(ligne.arrivee.x, ligne.arrivee.y);
      return !Lignes.segmentsSeCroisent(p1, p2, a, b);
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
  // "obtenirPartie" renvoie la partie en cours, ou rien si les gestes sont bloqués.
  installerControles(canvas, vue, obtenirPartie) {
    const lirePointeur = (e, partie) => {
      const cadre = canvas.getBoundingClientRect();
      const x = e.clientX - cadre.left;
      const y = e.clientY - cadre.top;
      const monde = vue.versMonde(x, y);
      // Zone de prise assez grande pour un doigt, même quand la carte est petite.
      const portee = Math.max(Tours.RAYON * 1.25, 28 / vue.echelle);
      return { x, y, tour: Tours.trouverA(partie.tours, monde.x, monde.y, portee) };
    };

    canvas.addEventListener('pointerdown', (e) => {
      const partie = obtenirPartie();
      if (!partie || partie.trace || partie.coupe || e.button !== 0) return;
      const { x, y, tour } = lirePointeur(e, partie);
      canvas.setPointerCapture(e.pointerId);
      if (tour && tour.equipe === EQUIPE_JOUEUR) {
        partie.trace = { pointeur: e.pointerId, depart: tour, cible: null, ecranX: x, ecranY: y };
      } else {
        partie.coupe = { pointeur: e.pointerId, points: [{ x, y }] };
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
      } else if (coupe && coupe.pointeur === e.pointerId) {
        Lignes.couper(partie, vue, coupe.points[coupe.points.length - 1], { x, y });
        coupe.points.push({ x, y });
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      const partie = obtenirPartie();
      if (!partie) return;
      const { trace, coupe } = partie;

      if (trace && trace.pointeur === e.pointerId) {
        const { tour } = lirePointeur(e, partie);
        partie.trace = null;
        // La tour a pu être perdue pendant le tracé.
        if (tour && trace.depart.equipe === EQUIPE_JOUEUR) {
          Lignes.ajouter(partie, trace.depart, tour);
        }
      } else if (coupe && coupe.pointeur === e.pointerId) {
        partie.coupe = null;
      }
    });

    canvas.addEventListener('pointercancel', (e) => {
      const partie = obtenirPartie();
      if (!partie) return;
      if (partie.trace && partie.trace.pointeur === e.pointerId) partie.trace = null;
      if (partie.coupe && partie.coupe.pointeur === e.pointerId) partie.coupe = null;
    });
  },

  dessiner(ctx, partie, vue) {
    const epaisseur = Math.max(3, 5 * vue.echelle);
    ctx.lineCap = 'round';

    for (const ligne of partie.lignes) {
      const a = vue.versEcran(ligne.depart.x, ligne.depart.y);
      const b = vue.versEcran(ligne.arrivee.x, ligne.arrivee.y);
      const couleur = EQUIPES[ligne.depart.equipe].couleur;

      // Quand deux tours s'envoient des soldats, chacune dessine sa moitié de la ligne.
      const face = partie.lignes.some(
        (l) => l.depart === ligne.arrivee && l.arrivee === ligne.depart,
      );
      const fin = face ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : b;

      ctx.globalAlpha = ligne.enPause ? 0.35 : 1;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(fin.x, fin.y);
      ctx.strokeStyle = '#10201a';
      ctx.lineWidth = epaisseur + 3;
      ctx.stroke();
      ctx.strokeStyle = couleur;
      ctx.lineWidth = epaisseur;
      ctx.stroke();

      // La flèche indique le sens, juste avant la tour d'arrivée.
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const recul = face ? 0 : Tours.RAYON * vue.echelle * 1.1;
      const pointeX = fin.x - Math.cos(angle) * recul;
      const pointeY = fin.y - Math.sin(angle) * recul;
      const taille = epaisseur * 3;
      ctx.beginPath();
      ctx.moveTo(pointeX, pointeY);
      ctx.lineTo(pointeX - Math.cos(angle - 0.5) * taille, pointeY - Math.sin(angle - 0.5) * taille);
      ctx.lineTo(pointeX - Math.cos(angle + 0.5) * taille, pointeY - Math.sin(angle + 0.5) * taille);
      ctx.closePath();
      ctx.fillStyle = couleur;
      ctx.fill();
      ctx.strokeStyle = '#10201a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  // Ce qui suit la souris ou le doigt : la ligne en pointillés, ou le trait de coupe.
  dessinerGeste(ctx, partie, vue) {
    const { trace, coupe } = partie;
    const epaisseur = Math.max(3, 5 * vue.echelle);

    if (trace) {
      const a = vue.versEcran(trace.depart.x, trace.depart.y);
      const b = trace.cible
        ? vue.versEcran(trace.cible.x, trace.cible.y)
        : { x: trace.ecranX, y: trace.ecranY };
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.setLineDash([10, 8]);
      // En rouge si la tour ne peut pas envoyer une ligne de plus.
      ctx.strokeStyle = Lignes.peutPartirDe(partie, trace.depart) ? '#ffffff' : '#ff6b6b';
      ctx.lineWidth = epaisseur;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (coupe) {
      ctx.beginPath();
      coupe.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  },
};
