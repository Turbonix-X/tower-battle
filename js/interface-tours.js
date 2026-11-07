// interface-tours.js — Le menu rond d'amélioration et la fiche d'info d'une tour.

const InterfaceTours = {
  RAYON_ROUE: 88,
  MARGE_BORD: 60,
  // Sur un petit écran, le menu rond est plus petit (voir aussi style.css).
  LARGEUR_PETIT_ECRAN: 520,
  RAYON_ROUE_PETIT: 72,
  MARGE_BORD_PETIT: 50,
  DELAI_FICHE: 450, // en millisecondes
  PLACE_CHOIX_SOLDATS: 40, // la place à garder sous le menu rond pour le choix du soldat
  ANGLES: { renforcement: -90, production: 150, capacite: 30 },
  ICONES: { renforcement: '🛡️', production: '⚙️', capacite: '📦' },

  vue: null,
  obtenirPartie: null,
  roue: null,
  fiche: null,
  boutons: {},
  tourRoue: null,
  tourFiche: null,
  minuteur: null,
  ficheParAppui: false,

  installer(vue, obtenirPartie) {
    InterfaceTours.vue = vue;
    InterfaceTours.obtenirPartie = obtenirPartie;
    InterfaceTours.roue = document.getElementById('roue');
    InterfaceTours.fiche = document.getElementById('fiche');

    for (const statistique of Ameliorations.STATISTIQUES) {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'roue-bouton';
      bouton.innerHTML =
        `<span class="roue-icone">${InterfaceTours.ICONES[statistique]}</span>` +
        '<span class="roue-nom"></span><span class="roue-effet"></span>' +
        '<span class="roue-points"></span><span class="roue-prix"></span>';
      bouton.addEventListener('click', () => {
        const partie = obtenirPartie();
        if (partie && InterfaceTours.tourRoue) {
          Ameliorations.acheter(partie, InterfaceTours.tourRoue, statistique);
        }
      });
      InterfaceTours.roue.append(bouton);
      InterfaceTours.boutons[statistique] = bouton;
    }

    InterfaceTours.choixSoldats = document.createElement('div');
    InterfaceTours.choixSoldats.id = 'roue-soldats';
    InterfaceTours.roue.append(InterfaceTours.choixSoldats);
  },

  // La tour dont on affiche la portée.
  tourSelectionnee() {
    return InterfaceTours.tourRoue || InterfaceTours.tourFiche;
  },

  // Sous le menu rond : le choix du soldat, quand la tour peut en produire plusieurs.
  placerChoixSoldats(partie, tour) {
    const types = Tours.typesDeSoldats(tour, partie.numero);
    const zone = InterfaceTours.choixSoldats;
    const cle = types.length > 1 ? types.join('|') : '';
    if (InterfaceTours.cleChoix !== cle) {
      InterfaceTours.cleChoix = cle;
      zone.replaceChildren();
      for (const type of cle ? types : []) {
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.className = 'choix-soldat';
        bouton.dataset.type = type;
        bouton.textContent = TYPES_DE_SOLDATS[type].icone;
        bouton.addEventListener('click', () => {
          if (InterfaceTours.tourRoue) InterfaceTours.tourRoue.typeSoldat = type;
        });
        zone.append(bouton);
      }
    }
    const actif = Tours.typeDeSoldatActif(partie, tour);
    zone.dataset.nom = cle && actif ? Textes.t(TYPES_DE_SOLDATS[actif].nom) : '';
    for (const bouton of zone.children) {
      const type = bouton.dataset.type;
      const estActif = type === actif;
      bouton.classList.toggle('actif', estActif);
      bouton.setAttribute('aria-pressed', estActif);
      const nom = Textes.t(TYPES_DE_SOLDATS[type].nom);
      if (bouton.title !== nom) {
        bouton.title = nom;
        bouton.setAttribute('aria-label', nom);
      }
    }
  },

  // --- Le menu rond ---

  ouvrirRoue(tour) {
    InterfaceTours.cacherFiche();
    InterfaceTours.tourRoue = tour;
    InterfaceTours.roue.classList.add('visible');
  },

  fermerRoue() {
    InterfaceTours.tourRoue = null;
    if (InterfaceTours.roue) InterfaceTours.roue.classList.remove('visible');
  },

  fermerTout() {
    InterfaceTours.fermerRoue();
    InterfaceTours.annulerAppui();
    InterfaceTours.cacherFiche();
  },

  // Le menu suit la tour à l'écran, et se ferme si la tour est perdue.
  mettreAJour(partie) {
    const tour = InterfaceTours.tourRoue;
    if (tour) {
      if (tour.equipe !== EQUIPE_JOUEUR) InterfaceTours.fermerRoue();
      else InterfaceTours.placerRoue(partie, tour);
    }
    if (InterfaceTours.tourFiche) InterfaceTours.remplirFiche(InterfaceTours.tourFiche);
  },

  placerRoue(partie, tour) {
    const vue = InterfaceTours.vue;
    const centre = vue.versEcran(tour.x, tour.y, 25);
    const petitEcran = vue.largeurEcran <= InterfaceTours.LARGEUR_PETIT_ECRAN;
    const marge = petitEcran ? InterfaceTours.MARGE_BORD_PETIT : InterfaceTours.MARGE_BORD;
    const rayon = petitEcran ? InterfaceTours.RAYON_ROUE_PETIT : InterfaceTours.RAYON_ROUE;
    const dehors = rayon + marge;
    InterfaceTours.placerChoixSoldats(partie, tour);
    const placeChoix = InterfaceTours.choixSoldats.children.length > 0 ? InterfaceTours.PLACE_CHOIX_SOLDATS : 0;
    const cx = Math.min(vue.largeurEcran - dehors, Math.max(dehors, centre.x));
    const cy = Math.min(vue.hauteurEcran - dehors - placeChoix, Math.max(dehors, centre.y));

    const zone = document.getElementById('zone-jeu').getBoundingClientRect();
    const roue = InterfaceTours.roue;
    roue.style.left = `${zone.left + cx}px`;
    roue.style.top = `${zone.top + cy}px`;

    const prix = Ameliorations.prix(tour);
    const pleine = Ameliorations.estPleine(tour);
    const peutAcheter = Ameliorations.peutAcheter(partie, tour);

    for (const statistique of Ameliorations.STATISTIQUES) {
      const bouton = InterfaceTours.boutons[statistique];
      const angle = (InterfaceTours.ANGLES[statistique] * Math.PI) / 180;
      bouton.style.setProperty('--x', `${Math.cos(angle) * rayon}px`);
      bouton.style.setProperty('--y', `${Math.sin(angle) * rayon}px`);
      bouton.disabled = !peutAcheter;

      const ecrire = (classe, texte) => {
        const element = bouton.querySelector(classe);
        if (element.textContent !== texte) element.textContent = texte;
      };
      ecrire('.roue-nom', Textes.t(statistique));
      ecrire('.roue-effet', Ameliorations.effet(tour, statistique));
      ecrire('.roue-points', '●'.repeat(tour.points[statistique]) || '○');
      ecrire('.roue-prix', pleine ? Textes.t('maximum') : `🪙 ${prix}`);
    }
  },

  // --- La fiche d'info ---

  debutAppui(tour, x, y) {
    InterfaceTours.annulerAppui();
    if (!tour) return;
    InterfaceTours.minuteur = setTimeout(() => {
      InterfaceTours.ficheParAppui = true;
      InterfaceTours.montrerFiche(tour, x, y);
    }, InterfaceTours.DELAI_FICHE);
  },

  annulerAppui() {
    clearTimeout(InterfaceTours.minuteur);
    InterfaceTours.minuteur = null;
  },

  // Renvoie true si la fiche était ouverte par un appui long.
  finAppui() {
    InterfaceTours.annulerAppui();
    const ficheVue = InterfaceTours.ficheParAppui;
    if (ficheVue) {
      InterfaceTours.ficheParAppui = false;
      InterfaceTours.cacherFiche();
    }
    return ficheVue;
  },

  // À la souris, la fiche apparaît quand le pointeur reste sur une tour.
  survol(tour, x, y) {
    if (InterfaceTours.ficheParAppui) return;
    if (tour === InterfaceTours.tourSurvolee) return;
    InterfaceTours.tourSurvolee = tour;
    InterfaceTours.annulerAppui();
    InterfaceTours.cacherFiche();
    if (!tour) return;
    InterfaceTours.minuteur = setTimeout(() => InterfaceTours.montrerFiche(tour, x, y), InterfaceTours.DELAI_FICHE);
  },

  montrerFiche(tour, x, y) {
    if (InterfaceTours.tourRoue) return;
    const vue = InterfaceTours.vue;
    const zone = document.getElementById('zone-jeu').getBoundingClientRect();
    const fiche = InterfaceTours.fiche;
    InterfaceTours.tourFiche = tour;
    InterfaceTours.remplirFiche(tour);
    fiche.classList.add('visible');

    const largeur = fiche.offsetWidth;
    const hauteur = fiche.offsetHeight;
    const gauche = Math.max(8, Math.min(vue.largeurEcran - largeur - 8, x + 18));
    const haut = Math.max(8, Math.min(vue.hauteurEcran - hauteur - 8, y - hauteur / 2));
    fiche.style.left = `${zone.left + gauche}px`;
    fiche.style.top = `${zone.top + haut}px`;
  },

  cacherFiche() {
    InterfaceTours.tourFiche = null;
    InterfaceTours.tourSurvolee = null;
    if (InterfaceTours.fiche) InterfaceTours.fiche.classList.remove('visible');
  },

  remplirFiche(tour) {
    // Pour un piège, on affiche ce qu'il fait semblant d'être.
    const fiche = Tours.ficheVisible(tour);
    const partie = InterfaceTours.obtenirPartie();
    const nombre = (valeur) => String(Math.round(valeur * 100) / 100);
    const typeSoldat = partie ? Tours.typeDeSoldatActif(partie, tour) : null;
    const lignes = [
      ['ficheSoldats', `${tour.soldats} / ${Tours.capacite(tour)}`],
      ['fichePv', `${Math.ceil(tour.pv)} / ${tour.pvMax}`],
      ['ficheProduction', `${nombre(Tours.production(tour))} /s`],
      ['ficheOr', `${nombre(Tours.orParSeconde(tour))} /s`],
      ['ficheDefense', nombre(1 / Tours.degatsParSoldat(tour))],
      ['ficheVitesse', `×${nombre(fiche.vitesseSoldats)}`],
      ['ficheLignes', String(Tours.lignesMax(tour))],
      ['fichePoints', `${Ameliorations.pointsUtilises(tour)} / ${Ameliorations.POINTS_MAX}`],
    ];
    if (Tours.fiche(tour).tir) lignes.push(['fichePortee', String(Tours.portee(tour))]);
    if (typeSoldat) lignes.push(['ficheTypeSoldat', Textes.t(TYPES_DE_SOLDATS[typeSoldat].nom)]);

    const titre = Textes.t(fiche.nom);
    const description = Textes.t(fiche.description);
    const contenu = lignes
      .map(([cle, valeur]) => `<div><span>${Textes.t(cle)}</span><strong>${valeur}</strong></div>`)
      .join('');
    const html = `<h3>${titre}</h3><p>${description}</p><div class="fiche-lignes">${contenu}</div>`;
    if (InterfaceTours.dernierHtml !== html) {
      InterfaceTours.dernierHtml = html;
      InterfaceTours.fiche.innerHTML = html;
    }
  },
};
