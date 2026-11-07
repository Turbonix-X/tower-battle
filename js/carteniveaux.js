// carteniveaux.js — L'écran de choix des niveaux : un chemin qui serpente, par pages de 50.

const CarteNiveaux = {
  PAR_LIGNE: 5,
  page: 0,
  surChoix: null, // ce qu'il faut faire quand le joueur choisit un niveau

  installer(surChoix) {
    CarteNiveaux.surChoix = surChoix;
    document.getElementById('page-precedente').addEventListener('click', () => {
      CarteNiveaux.afficher(CarteNiveaux.page - 1);
    });
    document.getElementById('page-suivante').addEventListener('click', () => {
      CarteNiveaux.afficher(CarteNiveaux.page + 1);
    });
  },

  pageDuNiveau(numero) {
    return Math.floor((numero - 1) / Niveaux.PAR_PAGE);
  },

  // La position d'un niveau sur la page, en pourcentage. Le chemin change de sens à chaque rangée.
  position(indice) {
    const lignes = Niveaux.PAR_PAGE / CarteNiveaux.PAR_LIGNE;
    const ligne = Math.floor(indice / CarteNiveaux.PAR_LIGNE);
    const dansLigne = indice % CarteNiveaux.PAR_LIGNE;
    const colonne = ligne % 2 === 0 ? dansLigne : CarteNiveaux.PAR_LIGNE - 1 - dansLigne;
    return {
      x: ((colonne + 0.5) / CarteNiveaux.PAR_LIGNE) * 100,
      y: ((ligne + 0.5) / lignes) * 100 + Math.sin(indice * 1.3) * 1.2,
    };
  },

  afficher(page) {
    const dernierePage = CarteNiveaux.pageDuNiveau(Niveaux.NOMBRE);
    CarteNiveaux.page = Math.max(0, Math.min(page, dernierePage));
    const premier = CarteNiveaux.page * Niveaux.PAR_PAGE + 1;
    const dernier = premier + Niveaux.PAR_PAGE - 1;

    document.getElementById('titre-page').textContent = Textes.t('pageNiveaux', {
      a: premier,
      b: dernier,
    });
    document.getElementById('page-precedente').disabled = CarteNiveaux.page === 0;
    document.getElementById('page-suivante').disabled = CarteNiveaux.page === dernierePage;

    const carte = document.getElementById('carte-niveaux');
    carte.replaceChildren();
    carte.append(CarteNiveaux.creerChemin(premier));
    for (let numero = premier; numero <= dernier; numero++) {
      carte.append(CarteNiveaux.creerBouton(numero, numero - premier));
    }
  },

  creerChemin(premier) {
    const espace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(espace, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('chemin');

    const points = [];
    for (let i = 0; i < Niveaux.PAR_PAGE; i++) points.push(CarteNiveaux.position(i));

    const ajouterTrace = (liste, classe) => {
      if (liste.length < 2) return;
      const trace = document.createElementNS(espace, 'polyline');
      trace.setAttribute('points', liste.map((p) => `${p.x},${p.y}`).join(' '));
      trace.setAttribute('vector-effect', 'non-scaling-stroke');
      trace.classList.add(classe);
      svg.append(trace);
    };

    ajouterTrace(points, 'chemin-complet');
    const atteints = Sauvegarde.donnees.niveauAtteint - premier + 1;
    ajouterTrace(points.slice(0, Math.max(0, atteints)), 'chemin-atteint');
    return svg;
  },

  creerBouton(numero, indice) {
    const { niveauAtteint, etoiles } = Sauvegarde.donnees;
    const bouton = document.createElement('button');
    const position = CarteNiveaux.position(indice);
    bouton.type = 'button';
    bouton.className = 'noeud';
    bouton.style.left = `${position.x}%`;
    bouton.style.top = `${position.y}%`;
    bouton.style.animationDelay = `${indice * 12}ms`;

    const verrouille = numero > niveauAtteint;
    if (Generateur.estBoss(numero)) bouton.classList.add('noeud-boss');
    if (numero === niveauAtteint) bouton.classList.add('noeud-actuel');

    const nombre = document.createElement('span');
    nombre.className = 'noeud-numero';
    nombre.textContent = numero;
    bouton.append(nombre);

    if (verrouille) {
      bouton.disabled = true;
      bouton.classList.add('noeud-verrouille');
      bouton.setAttribute('aria-label', Textes.t('verrouille', { n: numero }));
    } else {
      bouton.addEventListener('click', () => CarteNiveaux.surChoix(numero));
      if (etoiles[numero]) {
        const score = document.createElement('span');
        score.className = 'noeud-etoiles';
        score.textContent = '★'.repeat(etoiles[numero]) + '☆'.repeat(3 - etoiles[numero]);
        bouton.append(score);
      }
    }
    return bouton;
  },
};
