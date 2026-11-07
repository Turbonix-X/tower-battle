// modeles3d.js — Fabrique les formes 3D : tours de chaque type, soldat, arbres et rochers.
// Chaque modèle est fusionné en une seule forme colorée, pour rester fluide sur téléphone.

const COULEURS_3D = {
  pierre: '#b8b0a0',
  pierreSombre: '#8a8476',
  bois: '#7a5532',
  boisSombre: '#54391f',
  brique: '#a4553c',
  toile: '#e9dfc4',
  or: '#ffcf33',
  roche: '#6d6a64',
  rocheSombre: '#3f3d3a',
  noir: '#1a1714',
  peau: '#f0c9a0',
  feuillage: '#3f8f4a',
  feuillageClair: '#5aa854',
  tronc: '#5e4228',
};

const Modeles3D = {
  cache: new Map(),
  materiau: null,

  installer() {
    Modeles3D.materiau = new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 0.82,
      metalness: 0.04,
    });

    // Pour les soldats : seules les parties blanches prennent la couleur de l'équipe.
    // La peau, l'armure et les armes gardent leur vraie couleur.
    Modeles3D.materiauSoldat = Modeles3D.materiau.clone();
    Modeles3D.materiauSoldat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_vertex>',
        `#include <color_vertex>
        #if defined(USE_COLOR) && defined(USE_INSTANCING_COLOR)
          vColor = color;
          if (color.r > 0.99 && color.g > 0.99 && color.b > 0.99) vColor = instanceColor;
        #endif`,
      );
    };
  },

  // --- Outils de construction ---

  fabrique() {
    return { pieces: [] };
  },

  poser(f, geometrie, couleur, x = 0, y = 0, z = 0, rotationY = 0) {
    const matrice = new THREE.Matrix4();
    matrice.makeRotationY(rotationY);
    matrice.setPosition(x, y, z);
    geometrie.applyMatrix4(matrice);
    f.pieces.push({ geometrie, couleur });
  },

  // Dans ces outils, "y" est le bas de la pièce : on empile comme des cubes de construction.
  boite(f, largeur, hauteur, profondeur, x, y, z, couleur, rotationY = 0) {
    const g = new THREE.BoxGeometry(largeur, hauteur, profondeur);
    g.translate(0, hauteur / 2, 0);
    Modeles3D.poser(f, g, couleur, x, y, z, rotationY);
  },

  cylindre(f, rayonHaut, rayonBas, hauteur, cotes, x, y, z, couleur) {
    const g = new THREE.CylinderGeometry(rayonHaut, rayonBas, hauteur, cotes);
    g.translate(0, hauteur / 2, 0);
    Modeles3D.poser(f, g, couleur, x, y, z);
  },

  boule(f, rayon, x, y, z, couleur, detail = 0) {
    Modeles3D.poser(f, new THREE.IcosahedronGeometry(rayon, detail), couleur, x, y, z);
  },

  // Assemble toutes les pièces en une seule forme, avec une couleur par sommet.
  fusionner(f) {
    const morceaux = f.pieces.map(({ geometrie, couleur }) => ({
      g: geometrie.index ? geometrie.toNonIndexed() : geometrie,
      c: new THREE.Color(couleur),
    }));
    const total = morceaux.reduce((n, m) => n + m.g.attributes.position.count, 0);
    const positions = new Float32Array(total * 3);
    const normales = new Float32Array(total * 3);
    const couleurs = new Float32Array(total * 3);

    let decalage = 0;
    for (const { g, c } of morceaux) {
      const nombre = g.attributes.position.count;
      positions.set(g.attributes.position.array, decalage * 3);
      normales.set(g.attributes.normal.array, decalage * 3);
      for (let i = 0; i < nombre; i++) {
        couleurs[(decalage + i) * 3] = c.r;
        couleurs[(decalage + i) * 3 + 1] = c.g;
        couleurs[(decalage + i) * 3 + 2] = c.b;
      }
      decalage += nombre;
    }

    const resultat = new THREE.BufferGeometry();
    resultat.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    resultat.setAttribute('normal', new THREE.BufferAttribute(normales, 3));
    resultat.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));
    return resultat;
  },

  // --- Les parties communes, qui montrent les améliorations ---

  // Renforcement : des remparts de plus en plus épais autour de la tour.
  remparts(f, rayon, points) {
    if (points === 0) return rayon;
    const { pierre, pierreSombre } = COULEURS_3D;
    const epaisseur = 3 + points * 1.5;
    const hauteur = 7 + points * 1.5;
    const exterieur = rayon + 6 + points * 1.5;
    Modeles3D.cylindre(f, exterieur, exterieur + 2, hauteur, 18, 0, 0, 0, pierreSombre);
    Modeles3D.cylindre(f, exterieur - epaisseur, exterieur - epaisseur, hauteur + 0.5, 18, 0, 0, 0, pierre);

    const creneaux = 10 + points * 2;
    for (let i = 0; i < creneaux; i++) {
      const angle = (i / creneaux) * Math.PI * 2;
      Modeles3D.boite(
        f,
        4,
        3 + points * 0.4,
        epaisseur,
        Math.cos(angle) * (exterieur - epaisseur / 2),
        hauteur,
        Math.sin(angle) * (exterieur - epaisseur / 2),
        pierreSombre,
        -angle + Math.PI / 2,
      );
    }
    return exterieur;
  },

  // Production : une cheminée qui fume par point, et un atelier à partir de 4 points.
  cheminees(f, points, rayon, hauteurBase, fumees) {
    const { brique, noir, pierreSombre, bois } = COULEURS_3D;
    for (let i = 0; i < points; i++) {
      const angle = 0.6 + (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * rayon * 0.72;
      const z = Math.sin(angle) * rayon * 0.72;
      const hauteur = 14 + (i % 2) * 4;
      Modeles3D.boite(f, 6, hauteur, 6, x, hauteurBase, z, brique);
      Modeles3D.boite(f, 7.5, 2, 7.5, x, hauteurBase + hauteur, z, noir);
      fumees.push([x, hauteurBase + hauteur + 2, z]);
    }
    if (points >= 4) {
      Modeles3D.boite(f, 18, 12, 14, rayon + 14, 0, 10, bois);
      Modeles3D.cylindre(f, 0, 12, 8, 4, rayon + 14, 12, 10, pierreSombre);
    }
  },

  // Capacité : des réserves à côté de la tour, en plus de la tour plus grande.
  reserves(f, points, rayon, couleur) {
    const { pierre } = COULEURS_3D;
    if (points >= 3) {
      Modeles3D.cylindre(f, 9, 10, 26, 10, -rayon - 8, 0, -10, pierre);
      Modeles3D.cylindre(f, 0, 11, 8, 10, -rayon - 8, 26, -10, couleur);
    }
    if (points >= 5) {
      Modeles3D.cylindre(f, 9, 10, 32, 10, rayon * 0.3, 0, -rayon - 10, pierre);
      Modeles3D.cylindre(f, 0, 11, 9, 10, rayon * 0.3, 32, -rayon - 10, couleur);
    }
  },

  // --- Les types de tours ---

  caserne(f, m) {
    const { pierre, pierreSombre, bois } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 24 * (1 + 0.035 * c);
    const h = 40 * (1 + 0.11 * c);
    Modeles3D.cylindre(f, r, r + 3, h, 12, 0, 0, 0, pierre);
    Modeles3D.cylindre(f, r + 0.6, r + 0.6, 5, 12, 0, h * 0.45, 0, m.couleur);
    Modeles3D.cylindre(f, r + 3, r, 5, 12, 0, h, 0, pierreSombre);
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      Modeles3D.boite(f, 6, 6, 4, Math.cos(angle) * (r + 1), h + 5, Math.sin(angle) * (r + 1), pierre, -angle + Math.PI / 2);
    }
    Modeles3D.cylindre(f, 0, r - 2, 20, 12, 0, h + 4, 0, m.couleur);
    Modeles3D.boite(f, 8, 15, 4, 0, 0, r + 1, bois);
    Modeles3D.cheminees(f, m.points.production, r, h + 4, m.fumees);
    m.drapeau = [0, h + 24, 0];
    m.hauteur = h + 42;
    return r;
  },

  forteresse(f, m) {
    const { pierre, pierreSombre, bois } = COULEURS_3D;
    const c = m.points.capacite;
    const cote = 42 * (1 + 0.035 * c);
    const h = 30 * (1 + 0.11 * c);
    const d = cote / 2;
    Modeles3D.boite(f, cote + 6, 6, cote + 6, 0, 0, 0, pierreSombre);
    Modeles3D.boite(f, cote, h, cote, 0, 5, 0, pierre);
    Modeles3D.boite(f, cote * 0.55, h * 0.55, cote * 0.55, 0, h + 5, 0, pierreSombre);
    Modeles3D.boite(f, cote * 0.6, 3, cote * 0.6, 0, h * 1.55 + 5, 0, m.couleur);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = sx * d;
      const z = sz * d;
      Modeles3D.cylindre(f, 9, 10, h + 14, 10, x, 0, z, pierreSombre);
      Modeles3D.cylindre(f, 10.5, 9, 3, 10, x, h + 14, z, pierre);
      Modeles3D.cylindre(f, 0, 10, 13, 10, x, h + 17, z, m.couleur);
    }
    for (let i = -1; i <= 1; i++) {
      Modeles3D.boite(f, 7, 5, 5, i * 12, h + 5, d, pierre);
      Modeles3D.boite(f, 7, 5, 5, i * 12, h + 5, -d, pierre);
      Modeles3D.boite(f, 5, 5, 7, d, h + 5, i * 12, pierre);
      Modeles3D.boite(f, 5, 5, 7, -d, h + 5, i * 12, pierre);
    }
    Modeles3D.boite(f, 12, 18, 5, 0, 3, d + 1, bois);
    Modeles3D.cheminees(f, m.points.production, cote * 0.5, h + 5, m.fumees);
    m.drapeau = [0, h * 1.55 + 8, 0];
    m.hauteur = h * 1.55 + 26;
    return cote * 0.7;
  },

  campement(f, m) {
    const { bois, boisSombre, toile, pierreSombre } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 30 * (1 + 0.035 * c);
    const nbPieux = 18;
    for (let i = 0; i < nbPieux; i++) {
      const angle = (i / nbPieux) * Math.PI * 2;
      if (Math.abs(angle - Math.PI / 2) < 0.3) continue; // l'entrée, côté caméra
      const hauteur = 13 + (i % 3) * 2;
      Modeles3D.cylindre(f, 0, 2.5, 5, 5, Math.cos(angle) * r, hauteur, Math.sin(angle) * r, boisSombre);
      Modeles3D.cylindre(f, 2.3, 2.5, hauteur, 5, Math.cos(angle) * r, 0, Math.sin(angle) * r, bois);
    }

    // Les tentes, plus nombreuses et plus hautes avec la capacité.
    const tentes = 3 + Math.floor(c / 2);
    const hauteurTente = 26 * (1 + 0.08 * c);
    for (let i = 0; i < tentes; i++) {
      const angle = (i / tentes) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * r * 0.5;
      const z = Math.sin(angle) * r * 0.5 - 2;
      Modeles3D.cylindre(f, 0, 13, hauteurTente, 6, x, 0, z, i % 2 === 0 ? m.couleur : toile);
      Modeles3D.boite(f, 5, 11, 1.5, x, 0, z + 11, COULEURS_3D.noir);
    }

    Modeles3D.cylindre(f, 6, 7, 2.5, 7, 0, 0, 6, pierreSombre);
    m.feu = [0, 3, 6];
    Modeles3D.cheminees(f, m.points.production, r * 0.55, 14, m.fumees);
    m.drapeau = [r * 0.5, 14, -r * 0.5];
    m.hauteur = hauteurTente + 16;
    return r;
  },

  mine(f, m) {
    const { roche, rocheSombre, bois, boisSombre, noir, or } = COULEURS_3D;
    const c = m.points.capacite;
    const taille = 1 + 0.06 * c;

    // La colline de roche.
    Modeles3D.poser(f, new THREE.DodecahedronGeometry(30 * taille, 0), roche, 0, 12 * taille, -6);
    Modeles3D.poser(f, new THREE.DodecahedronGeometry(17 * taille, 0), rocheSombre, -20 * taille, 8, 4);
    Modeles3D.poser(f, new THREE.DodecahedronGeometry(14 * taille, 0), rocheSombre, 22 * taille, 6, 2);

    // L'entrée, face à la caméra.
    const z = 22 * taille;
    Modeles3D.boite(f, 22, 22, 6, 0, 0, z, noir);
    Modeles3D.boite(f, 4, 25, 5, -13, 0, z + 2, bois);
    Modeles3D.boite(f, 4, 25, 5, 13, 0, z + 2, bois);
    Modeles3D.boite(f, 31, 4.5, 6, 0, 25, z + 2, m.couleur);

    // Les rails et le wagonnet plein d'or.
    Modeles3D.boite(f, 2, 1, 26, -5, 0, z + 14, boisSombre);
    Modeles3D.boite(f, 2, 1, 26, 5, 0, z + 14, boisSombre);
    Modeles3D.boite(f, 14, 7, 12, 0, 2, z + 18, boisSombre);
    for (const [x, zz] of [[-3, 15], [3, 16], [0, 20], [-4, 21], [4, 21]]) {
      Modeles3D.boule(f, 3.2, x, 10, z + zz, or);
    }

    // Des pépites sur la colline, plus nombreuses avec les points de production.
    const pepites = 4 + m.points.production * 2;
    for (let i = 0; i < pepites; i++) {
      const angle = i * 2.399;
      const distance = 14 + (i % 3) * 5;
      Modeles3D.boule(f, 2.5, Math.cos(angle) * distance, 26 * taille - distance * 0.45, Math.sin(angle) * distance * 0.7 - 2, or);
    }

    // Le chevalement et sa roue qui tourne.
    Modeles3D.boite(f, 3, 40, 3, -22 * taille, 0, -14, bois);
    Modeles3D.boite(f, 3, 40, 3, -10 * taille, 0, -14, bois);
    Modeles3D.boite(f, 18 * taille, 3, 3, -16 * taille, 40, -14, bois);
    m.roue = [-16 * taille, 40, -11];
    m.drapeau = [12, 38 * taille, -8];
    Modeles3D.cheminees(f, m.points.production >= 2 ? 1 : 0, 24, 14 * taille, m.fumees);
    m.hauteur = 62 * taille;
    return 30 * taille;
  },

  // Une tour de guet en bois, avec des archers sur la plateforme.
  archers(f, m) {
    const { pierre, pierreSombre, bois, boisSombre, peau } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 18 * (1 + 0.035 * c);
    const h = 44 * (1 + 0.11 * c);
    Modeles3D.cylindre(f, r + 4, r + 8, 10, 10, 0, 0, 0, pierre);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      Modeles3D.boite(f, 4.5, h, 4.5, sx * r * 0.72, 8, sz * r * 0.72, bois);
    }
    Modeles3D.boite(f, r * 1.5, 2.5, 2.5, 0, h * 0.55, r * 0.72, boisSombre, 0.5);
    Modeles3D.boite(f, r * 1.5, 2.5, 2.5, 0, h * 0.55, -r * 0.72, boisSombre, -0.5);
    Modeles3D.boite(f, r * 2.6, 4, r * 2.6, 0, h + 7, 0, boisSombre);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * r * 0.75;
      const z = Math.sin(angle) * r * 0.75;
      Modeles3D.cylindre(f, 2.3, 3, 8, 6, x, h + 11, z, m.couleur);
      Modeles3D.boule(f, 2.3, x, h + 21, z, peau, 0);
      Modeles3D.boite(f, 0.8, 11, 0.8, x * 1.25, h + 13, z * 1.25, pierreSombre);
    }
    for (const [sx, sz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      Modeles3D.boite(f, sx ? 2 : r * 2.6, 5, sz ? 2 : r * 2.6, sx * r * 1.3, h + 11, sz * r * 1.3, bois);
    }
    Modeles3D.cheminees(f, m.points.production, r, 10, m.fumees);
    m.drapeau = [r * 1.2, h + 11, -r * 1.2];
    m.hauteur = h + 42;
    return r + 6;
  },

  // Un bastion bas, avec son canon qui pivote vers sa cible.
  canon(f, m) {
    const { pierre, pierreSombre, boisSombre } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 25 * (1 + 0.035 * c);
    const h = 20 * (1 + 0.11 * c);
    Modeles3D.cylindre(f, r, r + 5, h, 10, 0, 0, 0, pierre);
    Modeles3D.cylindre(f, r + 1.5, r, 4, 10, 0, h, 0, pierreSombre);
    Modeles3D.cylindre(f, r - 6, r - 6, 1.5, 10, 0, h + 3, 0, m.couleur);
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      Modeles3D.boite(f, 7, 6, 4, Math.cos(angle) * r, h + 4, Math.sin(angle) * r, pierre, -angle + Math.PI / 2);
    }
    // La pile de boulets, à côté du bastion.
    for (const [x, y, z] of [[-3, 0, 0], [3, 0, 0], [0, 0, 4], [0, 4.5, 1.4]]) {
      Modeles3D.boule(f, 3, x + r + 9, y + 3, z + 10, '#2a2a2e', 0);
    }
    Modeles3D.boite(f, 12, 7, 12, 0, h + 3, 0, boisSombre);
    Modeles3D.cheminees(f, m.points.production, r, h + 3, m.fumees);
    m.canon = [0, h + 13, 0];
    m.hauteur = h + 32;
    return r + 3;
  },

  // Un petit temple clair, avec un cristal vert qui tourne au-dessus.
  soin(f, m) {
    const { pierre, pierreSombre } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 24 * (1 + 0.035 * c);
    const h = 26 * (1 + 0.11 * c);
    Modeles3D.cylindre(f, r + 3, r + 7, 5, 10, 0, 0, 0, pierreSombre);
    Modeles3D.cylindre(f, r, r + 3, 4, 10, 0, 5, 0, pierre);
    const colonnes = 8;
    for (let i = 0; i < colonnes; i++) {
      const angle = (i / colonnes) * Math.PI * 2;
      Modeles3D.cylindre(f, 2.2, 2.7, h, 7, Math.cos(angle) * (r - 3), 9, Math.sin(angle) * (r - 3), '#f4f1e6');
    }
    Modeles3D.cylindre(f, r, r - 2, 4, 10, 0, h + 9, 0, pierre);
    Modeles3D.cylindre(f, 3, r, 11, 10, 0, h + 13, 0, m.couleur);
    Modeles3D.cylindre(f, r - 10, r - 8, h, 8, 0, 9, 0, '#d9f7e4');
    Modeles3D.cheminees(f, m.points.production, r, 9, m.fumees);
    m.cristal = [0, h + 37, 0];
    m.hauteur = h + 54;
    return r;
  },

  // Exactement une caserne... à un détail près : une petite marque rouge au-dessus de la porte.
  piege(f, m) {
    const rayon = Modeles3D.caserne(f, m);
    Modeles3D.boite(f, 3.4, 1.3, 1, 0, 17, rayon + 2.5, '#d6281f', 0.6);
    Modeles3D.boite(f, 3.4, 1.3, 1, 0, 17, rayon + 2.6, '#d6281f', -0.6);
    return rayon;
  },

  // Une tour immense, à étages, qui domine toute la carte.
  geante(f, m) {
    const { pierre, pierreSombre, bois, or } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 34 * (1 + 0.025 * c);
    const h = 56 * (1 + 0.08 * c);
    Modeles3D.cylindre(f, r + 4, r + 12, 12, 14, 0, 0, 0, pierreSombre);
    Modeles3D.cylindre(f, r, r + 3, h, 14, 0, 12, 0, pierre);
    Modeles3D.cylindre(f, r + 1, r + 1, 6, 14, 0, h * 0.55, 0, m.couleur);
    Modeles3D.cylindre(f, r + 5, r, 7, 14, 0, h + 12, 0, pierreSombre);
    const haut = h + 19;
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      Modeles3D.boite(f, 7, 7, 4, Math.cos(angle) * (r + 3), haut, Math.sin(angle) * (r + 3), pierre, -angle + Math.PI / 2);
    }
    Modeles3D.cylindre(f, r * 0.62, r * 0.7, 26, 12, 0, haut, 0, pierre);
    Modeles3D.cylindre(f, r * 0.72, r * 0.62, 4, 12, 0, haut + 26, 0, pierreSombre);
    Modeles3D.cylindre(f, 0, r * 0.7, 26, 12, 0, haut + 30, 0, m.couleur);
    Modeles3D.boule(f, 4, 0, haut + 58, 0, or, 0);
    Modeles3D.boite(f, 16, 30, 5, 0, 8, r + 3, bois);
    Modeles3D.cheminees(f, m.points.production, r, h + 12, m.fumees);
    m.drapeau = [r * 0.7, h + 19, -r * 0.7];
    m.hauteur = haut + 66;
    return r + 8;
  },

  // Renvoie le modèle d'une tour. Tous les modèles identiques sont partagés.
  // Un skin remplace pour un moment les couleurs des matériaux, le temps de la construction.
  tour({ type, points, couleur, foncee, boss, skin = 'classique' }) {
    const cle = [type, points.renforcement, points.production, points.capacite, couleur, boss, skin].join('|');
    if (Modeles3D.cache.has(cle)) return Modeles3D.cache.get(cle);

    const couleursNormales = { ...COULEURS_3D };
    Object.assign(COULEURS_3D, SKINS_TOURS[skin].couleurs);
    const modele = Modeles3D.construireTour({ type, points, couleur, foncee, boss });
    Object.assign(COULEURS_3D, couleursNormales);

    Modeles3D.cache.set(cle, modele);
    return modele;
  },

  construireTour({ type, points, couleur, foncee, boss }) {
    const f = Modeles3D.fabrique();
    const modele = {
      points,
      couleur,
      foncee,
      boss,
      fumees: [],
      drapeau: null,
      roue: null,
      feu: null,
      canon: null,
      cristal: null,
      hauteur: 70,
    };

    // Le socle aux couleurs de l'équipe : on voit à qui est la tour, même de loin.
    Modeles3D.cylindre(f, 44, 46, 2.5, 28, 0, 0, 0, foncee);
    Modeles3D.cylindre(f, 40, 41, 3, 28, 0, 0, 0, couleur);

    const rayon = Modeles3D[TYPES_DE_TOURS[type].modele](f, modele);
    Modeles3D.remparts(f, rayon, points.renforcement);
    Modeles3D.reserves(f, points.capacite, rayon, couleur);

    if (boss) {
      const { or } = COULEURS_3D;
      const y = modele.hauteur - 4;
      Modeles3D.cylindre(f, 15, 13, 7, 10, 0, y, 0, or);
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        Modeles3D.cylindre(f, 0, 4, 9, 5, Math.cos(angle) * 13, y + 7, Math.sin(angle) * 13, or);
      }
      modele.hauteur += 14;
    }

    modele.geometrie = Modeles3D.fusionner(f);
    return modele;
  },

  // --- Les petites formes ---

  // Le corps d'un soldat, de la taille à la tête : les jambes sont à part, pour les animer.
  // Le blanc prend la couleur de l'équipe. "armure" est la couleur du métal (voir les skins).
  soldat(type, armure = '#d9d9d9') {
    const f = Modeles3D.fabrique();
    const { peau, boisSombre, noir } = COULEURS_3D;
    const equipe = '#ffffff';

    // Ce que tout le monde a : un buste, une tête, deux bras.
    const buste = (rayon, hauteur, couleur = equipe) => {
      Modeles3D.cylindre(f, rayon * 0.82, rayon, hauteur, 7, 0, 0, 0, couleur);
      Modeles3D.boule(f, 2.9, 0, hauteur + 2.6, 0, peau, 1);
      Modeles3D.boite(f, 1.5, hauteur * 0.8, 1.5, rayon + 0.6, hauteur * 0.1, 0, couleur);
      Modeles3D.boite(f, 1.5, hauteur * 0.8, 1.5, -rayon - 0.6, hauteur * 0.1, 0, couleur);
      return hauteur + 2.6;
    };
    const casque = (y, couleur = armure) => {
      Modeles3D.cylindre(f, 1.5, 3.4, 2.8, 8, 0, y + 0.8, 0, couleur);
    };
    const epee = (x, longueur = 10) => {
      Modeles3D.boite(f, 1, longueur, 1, x, 2, 2.4, armure);
      Modeles3D.boite(f, 3.6, 0.9, 1, x, 2, 2.4, boisSombre);
    };

    if (type === 'chevalier') {
      // Grand et lourd : armure complète, plumet et grande épée.
      const tete = buste(5.2, 11);
      Modeles3D.cylindre(f, 4.6, 5.8, 7, 8, 0, 2, 0, armure);
      Modeles3D.boite(f, 7, 2, 7, 0, 9.5, 0, armure);
      Modeles3D.cylindre(f, 2.6, 3.8, 5, 8, 0, tete - 1, 0, armure);
      Modeles3D.boite(f, 1.2, 5, 5, 0, tete + 3, -1, equipe);
      Modeles3D.boite(f, 8, 12, 1, 0, 0, -5.6, equipe); // la cape
      epee(6.4, 15);
    } else if (type === 'coureur') {
      // Mince et sans armure, avec un simple bandeau et une dague.
      const tete = buste(2.9, 7.5);
      Modeles3D.cylindre(f, 3, 3, 1.1, 8, 0, tete + 0.4, 0, equipe);
      epee(3.9, 5);
    } else if (type === 'bouclier') {
      // Un grand bouclier devant lui, pour arrêter les flèches.
      const tete = buste(3.8, 9);
      casque(tete);
      Modeles3D.boite(f, 10, 13, 1.5, 0, -1, 5, armure);
      Modeles3D.boite(f, 7.5, 10, 1.7, 0, 0.5, 5.1, equipe);
      Modeles3D.boite(f, 1.5, 10, 1.9, 0, 0.5, 5.2, armure);
    } else if (type === 'eclaireur') {
      // Une capuche, une longue-vue et un sac.
      const tete = buste(3, 8);
      Modeles3D.cylindre(f, 0.3, 3.8, 5, 7, 0, tete, -0.4, equipe);
      Modeles3D.boite(f, 5, 6, 2.6, 0, 1.5, -3.4, boisSombre);
      Modeles3D.boite(f, 1.3, 1.3, 6, 3.8, 7, 2.5, armure);
    } else if (type === 'soigneur') {
      // Une robe claire et un bâton surmonté d'une croix verte.
      buste(3.6, 9);
      Modeles3D.cylindre(f, 3.6, 5, 6, 8, 0, -4, 0, '#f6f6ec');
      Modeles3D.boite(f, 1, 16, 1, 5, -2, 1.5, boisSombre);
      Modeles3D.boite(f, 4.4, 1.4, 1.4, 5, 12, 1.5, '#3fe07d');
      Modeles3D.boite(f, 1.4, 4.4, 1.4, 5, 10.5, 1.5, '#3fe07d');
    } else {
      // Le fantassin : casque, épée et petit bouclier rond.
      const tete = buste(3.7, 9);
      casque(tete);
      epee(4.7);
      Modeles3D.cylindre(f, 3, 3, 1.1, 8, -4.8, 3, 2, noir);
      const rond = new THREE.CylinderGeometry(3.1, 3.1, 1, 9);
      rond.rotateX(Math.PI / 2);
      Modeles3D.poser(f, rond, armure, -4.8, 5, 2);
    }
    return Modeles3D.fusionner(f);
  },

  // Une jambe, accrochée par le haut : c'est ce point qui reste fixe quand elle se balance.
  jambe() {
    const f = Modeles3D.fabrique();
    const haut = new THREE.BoxGeometry(2.1, 5.2, 2.3);
    haut.translate(0, -2.6, 0);
    Modeles3D.poser(f, haut, '#4b4b4b');
    const pied = new THREE.BoxGeometry(2.3, 1.2, 3.4);
    pied.translate(0, -4.8, 0.7);
    Modeles3D.poser(f, pied, COULEURS_3D.noir);
    return Modeles3D.fusionner(f);
  },

  fleche() {
    const f = Modeles3D.fabrique();
    const tige = new THREE.CylinderGeometry(0.45, 0.45, 15, 5);
    tige.rotateX(Math.PI / 2);
    Modeles3D.poser(f, tige, COULEURS_3D.bois);
    const pointe = new THREE.ConeGeometry(1.1, 3.5, 5);
    pointe.rotateX(Math.PI / 2);
    Modeles3D.poser(f, pointe, '#e8e8e8', 0, 0, 9);
    Modeles3D.boite(f, 3, 0.3, 3, 0, 0, -7, '#f2f2f2');
    Modeles3D.boite(f, 0.3, 3, 3, 0, -1.5, -7, '#f2f2f2');
    return Modeles3D.fusionner(f);
  },

  boulet() {
    const f = Modeles3D.fabrique();
    Modeles3D.boule(f, 5.5, 0, 0, 0, '#2a2a2e', 1);
    return Modeles3D.fusionner(f);
  },

  // Le fût du canon, pointé vers l'avant. Il tourne vers sa cible.
  futDeCanon() {
    const f = Modeles3D.fabrique();
    const fut = new THREE.CylinderGeometry(4, 5.2, 28, 10);
    fut.rotateX(Math.PI / 2);
    Modeles3D.poser(f, fut, '#33353b', 0, 0, 9);
    const bouche = new THREE.CylinderGeometry(5, 5, 3.5, 10);
    bouche.rotateX(Math.PI / 2);
    Modeles3D.poser(f, bouche, '#1d1e22', 0, 0, 23);
    Modeles3D.boule(f, 6, 0, 0, -6, '#3d3f46', 0);
    return Modeles3D.fusionner(f);
  },

  roue() {
    const f = Modeles3D.fabrique();
    const g = new THREE.TorusGeometry(9, 1.3, 5, 12);
    g.rotateX(0);
    Modeles3D.poser(f, g, COULEURS_3D.boisSombre);
    for (let i = 0; i < 3; i++) {
      const rayon = new THREE.BoxGeometry(18, 1.2, 1.2);
      rayon.rotateZ((i / 3) * Math.PI);
      Modeles3D.poser(f, rayon, COULEURS_3D.bois);
    }
    return Modeles3D.fusionner(f);
  },

  // Un décor en une seule forme : arbres et rochers, toujours les mêmes pour un même niveau.
  decor(niveau, largeur, hauteur) {
    const tirage = Generateur.aleatoire(Math.imul(niveau.numero || 1, 31337));
    const f = Modeles3D.fabrique();
    const place = (x, z) =>
      niveau.tours.every((t) => Math.hypot(t.x - largeur / 2 - x, t.y - hauteur / 2 - z) > 78);

    const nombre = 46;
    for (let i = 0; i < nombre; i++) {
      // La plupart des décors sont sur les bords, pour ne pas gêner la partie.
      const surLesBords = tirage() < 0.75;
      let x = (tirage() - 0.5) * (largeur + 80);
      let z = (tirage() - 0.5) * (hauteur + 80);
      if (surLesBords) {
        if (tirage() < 0.5) x = (x > 0 ? 1 : -1) * (largeur / 2 + 10 + tirage() * 25);
        else z = (z > 0 ? 1 : -1) * (hauteur / 2 + 10 + tirage() * 25);
      }
      if (!place(x, z)) continue;

      if (tirage() < 0.72) {
        const taille = 0.7 + tirage() * 0.7;
        Modeles3D.cylindre(f, 2.2 * taille, 3 * taille, 8 * taille, 5, x, 0, z, COULEURS_3D.tronc);
        const couleur = tirage() < 0.5 ? COULEURS_3D.feuillage : COULEURS_3D.feuillageClair;
        Modeles3D.cylindre(f, 0, 13 * taille, 20 * taille, 6, x, 7 * taille, z, couleur);
        Modeles3D.cylindre(f, 0, 10 * taille, 16 * taille, 6, x, 17 * taille, z, couleur);
      } else {
        const g = new THREE.DodecahedronGeometry(5 + tirage() * 7, 0);
        Modeles3D.poser(f, g, COULEURS_3D.roche, x, 2, z);
      }
    }
    return f.pieces.length > 0 ? Modeles3D.fusionner(f) : null;
  },
};
