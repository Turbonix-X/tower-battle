// lignes.js — Les lignes entre les tours : les tracer, les retenir et les retirer.

const Lignes = {
  SECONDES_ENTRE_SOLDATS: 0.5, // soit environ 2 soldats par seconde

  ajouter(partie, depart, arrivee) {
    if (depart === arrivee) return;
    if (partie.lignes.some((l) => l.depart === depart && l.arrivee === arrivee)) return;
    partie.lignes.push({ depart, arrivee, attente: 0 });
  },

  // Une tour qui change d'équipe ne continue pas les envois de son ancienne équipe.
  retirerDepuis(partie, tour) {
    partie.lignes = partie.lignes.filter((ligne) => ligne.depart !== tour);
  },

  // Chaque ligne envoie un soldat dès que l'attente est finie et que la tour en a un.
  mettreAJour(partie, dt) {
    for (const ligne of partie.lignes) {
      ligne.attente = Math.max(0, ligne.attente - dt);
      if (ligne.attente === 0 && ligne.depart.soldats > 0) {
        ligne.depart.soldats -= 1;
        Soldats.creer(partie, ligne.depart, ligne.arrivee);
        ligne.attente = Lignes.SECONDES_ENTRE_SOLDATS;
      }
    }
  },

  // Souris et doigt passent par les mêmes événements "pointer".
  installerControles(canvas, partie, vue) {
    const tourSous = (e) => {
      const cadre = canvas.getBoundingClientRect();
      const ecranX = e.clientX - cadre.left;
      const ecranY = e.clientY - cadre.top;
      const monde = vue.versMonde(ecranX, ecranY);
      // Zone de prise assez grande pour un doigt, même quand la carte est petite.
      const portee = Math.max(Tours.RAYON * 1.25, 28 / vue.echelle);
      return { ecranX, ecranY, tour: Tours.trouverA(partie.tours, monde.x, monde.y, portee) };
    };

    canvas.addEventListener('pointerdown', (e) => {
      if (partie.trace || e.button !== 0) return;
      const { ecranX, ecranY, tour } = tourSous(e);
      if (!tour || tour.equipe !== EQUIPE_JOUEUR) return;
      canvas.setPointerCapture(e.pointerId);
      partie.trace = { pointeur: e.pointerId, depart: tour, cible: null, ecranX, ecranY };
    });

    canvas.addEventListener('pointermove', (e) => {
      const trace = partie.trace;
      if (!trace || trace.pointeur !== e.pointerId) return;
      const { ecranX, ecranY, tour } = tourSous(e);
      trace.ecranX = ecranX;
      trace.ecranY = ecranY;
      trace.cible = tour === trace.depart ? null : tour;
    });

    canvas.addEventListener('pointerup', (e) => {
      const trace = partie.trace;
      if (!trace || trace.pointeur !== e.pointerId) return;
      const { tour } = tourSous(e);
      partie.trace = null;
      // La tour a pu être perdue pendant le tracé.
      if (tour && trace.depart.equipe === EQUIPE_JOUEUR) {
        Lignes.ajouter(partie, trace.depart, tour);
      }
    });

    canvas.addEventListener('pointercancel', (e) => {
      if (partie.trace && partie.trace.pointeur === e.pointerId) partie.trace = null;
    });
  },

  dessiner(ctx, partie, vue) {
    const epaisseur = Math.max(3, 5 * vue.echelle);
    ctx.lineCap = 'round';

    for (const ligne of partie.lignes) {
      const a = vue.versEcran(ligne.depart.x, ligne.depart.y);
      const b = vue.versEcran(ligne.arrivee.x, ligne.arrivee.y);
      const couleur = EQUIPES[ligne.depart.equipe].couleur;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = '#10201a';
      ctx.lineWidth = epaisseur + 3;
      ctx.stroke();
      ctx.strokeStyle = couleur;
      ctx.lineWidth = epaisseur;
      ctx.stroke();

      // La flèche indique le sens, juste avant la tour d'arrivée.
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const recul = Tours.RAYON * vue.echelle * 1.1;
      const pointeX = b.x - Math.cos(angle) * recul;
      const pointeY = b.y - Math.sin(angle) * recul;
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
  },

  // La ligne en pointillés qui suit la souris ou le doigt.
  dessinerTrace(ctx, partie, vue) {
    const trace = partie.trace;
    if (!trace) return;
    const a = vue.versEcran(trace.depart.x, trace.depart.y);
    const b = trace.cible
      ? vue.versEcran(trace.cible.x, trace.cible.y)
      : { x: trace.ecranX, y: trace.ecranY };
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, 5 * vue.echelle);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};
