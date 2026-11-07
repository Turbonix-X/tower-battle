// tutoriel.js — Les conseils des premiers niveaux, avec une main animée qui montre quoi faire.

const Tutoriel = {
  DUREE_GESTE: 1.8, // en secondes

  creer(niveau) {
    return niveau.tutoriel ? { etapes: niveau.tutoriel, indice: 0, tempsEtape: 0, horloge: 0 } : null;
  },

  etapeEnCours(partie) {
    const { tutoriel } = partie;
    return tutoriel ? tutoriel.etapes[tutoriel.indice] || null : null;
  },

  estFinie(partie, etape) {
    const { tours, lignes, tutoriel } = partie;
    const existe = (de, vers) =>
      lignes.some((l) => l.depart === tours[de] && l.arrivee === tours[vers]);
    // Une étape facultative ne bloque pas le conseil suivant indéfiniment.
    if (etape.dureeMax && tutoriel.tempsEtape >= etape.dureeMax) return true;

    switch (etape.action) {
      case 'amelioration':
        return tours.some(
          (tour) => tour.equipe === EQUIPE_JOUEUR && Ameliorations.pointsUtilises(tour) > 0,
        );
      case 'ligne':
        return existe(etape.de, etape.vers);
      case 'coupe':
        return !existe(etape.de, etape.vers);
      case 'capture':
        return tours[etape.tour].equipe === EQUIPE_JOUEUR;
      case 'soldats':
        return tours[etape.tour].soldats >= etape.nombre;
      case 'temps':
        return tutoriel.tempsEtape >= etape.duree;
      default:
        return true;
    }
  },

  mettreAJour(partie, dt) {
    const { tutoriel } = partie;
    if (!tutoriel) return;
    tutoriel.horloge += dt;
    tutoriel.tempsEtape += dt;

    let etape = Tutoriel.etapeEnCours(partie);
    while (etape && Tutoriel.estFinie(partie, etape)) {
      tutoriel.indice += 1;
      tutoriel.tempsEtape = 0;
      etape = Tutoriel.etapeEnCours(partie);
    }
    Menu.afficherBulle(etape ? etape.texte : null);
  },

  // La main glisse d'une tour à l'autre, ou barre la ligne à couper.
  dessiner(ctx, partie, vue) {
    const etape = Tutoriel.etapeEnCours(partie);
    if (!etape) return;
    const { tours } = partie;

    let debut;
    let fin;
    if (etape.action === 'amelioration') {
      // La main tapote la tour à améliorer.
      debut = vue.versEcran(tours[etape.tour].x, tours[etape.tour].y, 20);
      fin = { x: debut.x, y: debut.y + 14 };
    } else if (etape.action === 'ligne' || etape.main) {
      const geste = etape.main || etape;
      debut = vue.versEcran(tours[geste.de].x, tours[geste.de].y);
      fin = vue.versEcran(tours[geste.vers].x, tours[geste.vers].y);
    } else if (etape.action === 'coupe') {
      const a = vue.versEcran(tours[etape.de].x, tours[etape.de].y);
      const b = vue.versEcran(tours[etape.vers].x, tours[etape.vers].y);
      const milieu = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const longueur = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = ((b.y - a.y) / longueur) * 60;
      const ny = (-(b.x - a.x) / longueur) * 60;
      debut = { x: milieu.x - nx, y: milieu.y - ny };
      fin = { x: milieu.x + nx, y: milieu.y + ny };
    } else {
      return;
    }

    const cycle = (partie.tutoriel.horloge % Tutoriel.DUREE_GESTE) / Tutoriel.DUREE_GESTE;
    const avancee = Math.min(1, cycle / 0.75);
    const lisse = avancee * avancee * (3 - 2 * avancee);
    const x = debut.x + (fin.x - debut.x) * lisse;
    const y = debut.y + (fin.y - debut.y) * lisse;

    ctx.globalAlpha = cycle > 0.85 ? (1 - cycle) / 0.15 : 1;

    ctx.beginPath();
    ctx.moveTo(debut.x, debut.y);
    ctx.lineTo(x, y);
    ctx.setLineDash([8, 7]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    // Le doigt touche le trait par le bout, la main est dessous.
    ctx.font = '38px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('👆', x, y);
    ctx.globalAlpha = 1;
  },
};
