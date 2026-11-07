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
  metal: '#4a4c55',
  lumiere: '#ffc45a', // les fenêtres éclairées et les lanternes
  peau: '#f0c9a0',
  cuir: '#6b4426',
  tissu: '#3b3848', // les pantalons des soldats
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

  // Un anneau couché, par exemple une bordure dorée autour d'un socle.
  anneau(f, rayon, epaisseur, y, couleur, cotes = 24) {
    const g = new THREE.TorusGeometry(rayon, epaisseur, 4, cotes);
    g.rotateX(Math.PI / 2);
    Modeles3D.poser(f, g, couleur, 0, y, 0);
  },

  // Le haut arrondi d'une porte : un demi-disque dressé, tourné vers l'avant (+z).
  arche(f, rayon, profondeur, x, y, z, couleur, rotationY = 0) {
    const g = new THREE.CylinderGeometry(rayon, rayon, profondeur, 10, 1, false, -Math.PI / 2, Math.PI);
    g.rotateX(-Math.PI / 2);
    Modeles3D.poser(f, g, couleur, x, y, z, rotationY);
  },

  // Une fenêtre éclairée dans un mur rond : un cadre de pierre et une lumière chaude.
  // (cx, cz) est le centre du mur, "angle" la direction où elle regarde.
  fenetre(f, cx, cz, angle, rayon, y, largeur = 3.4, hauteur = 5.5) {
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    const rotation = -angle + Math.PI / 2;
    const { pierreSombre, lumiere } = COULEURS_3D;
    Modeles3D.boite(f, largeur + 1.8, hauteur + 1.8, 1.6, cx + x * (rayon + 0.1), y - 0.9, cz + z * (rayon + 0.1), pierreSombre, rotation);
    Modeles3D.boite(f, largeur, hauteur, 1.6, cx + x * (rayon + 0.5), y, cz + z * (rayon + 0.5), lumiere, rotation);
  },

  // La même chose sur un mur plat qui regarde vers l'avant (+z), ou sur le côté avec "rotationY".
  fenetrePlate(f, x, y, z, largeur = 4, hauteur = 6, rotationY = 0) {
    const { pierreSombre, lumiere } = COULEURS_3D;
    const avant = (d) => [x + Math.sin(rotationY) * d, z + Math.cos(rotationY) * d];
    const [x1, z1] = avant(0.2);
    const [x2, z2] = avant(0.6);
    Modeles3D.boite(f, largeur + 1.8, hauteur + 1.8, 1.4, x1, y - 0.9, z1, pierreSombre, rotationY);
    Modeles3D.boite(f, largeur, hauteur, 1.4, x2, y, z2, lumiere, rotationY);
  },

  // Une porte en bois avec son arche, ses ferrures et sa poignée dorée, contre un mur en "z".
  porte(f, largeur, hauteur, z, y = 0) {
    const { pierreSombre, bois, noir, or } = COULEURS_3D;
    const demi = largeur / 2;
    Modeles3D.boite(f, largeur + 3.6, hauteur, 2.4, 0, y, z - 0.4, pierreSombre);
    Modeles3D.arche(f, demi + 1.8, 2.4, 0, y + hauteur, z - 0.4, pierreSombre);
    Modeles3D.boite(f, largeur, hauteur, 2.4, 0, y, z, bois);
    Modeles3D.arche(f, demi, 2.4, 0, y + hauteur, z, bois);
    Modeles3D.boite(f, largeur + 0.2, 0.8, 0.5, 0, y + hauteur * 0.3, z + 1.2, noir);
    Modeles3D.boite(f, largeur + 0.2, 0.8, 0.5, 0, y + hauteur * 0.7, z + 1.2, noir);
    Modeles3D.boule(f, 0.7, demi * 0.55, y + hauteur * 0.5, z + 1.4, or);
  },

  // Une lanterne accrochée au mur.
  lanterne(f, x, y, z) {
    const { lumiere, noir } = COULEURS_3D;
    Modeles3D.boite(f, 1.8, 2.6, 1.8, x, y, z, lumiere);
    Modeles3D.boite(f, 2.4, 0.7, 2.4, x, y + 2.6, z, noir);
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
    const { pierre, pierreSombre, or } = COULEURS_3D;
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
    // Au plus haut niveau, les remparts gagnent une bordure dorée.
    if (points >= 5) Modeles3D.anneau(f, exterieur + 0.6, 0.7, hauteur * 0.55, or, 36);
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
      Modeles3D.fenetrePlate(f, rayon + 14, 4, 17, 4, 4);
    }
  },

  // Capacité : des réserves à côté de la tour, en plus de la tour plus grande.
  reserves(f, points, rayon, couleur) {
    const { pierre, or } = COULEURS_3D;
    if (points >= 3) {
      Modeles3D.cylindre(f, 9, 10, 26, 10, -rayon - 8, 0, -10, pierre);
      Modeles3D.cylindre(f, 0, 11, 8, 10, -rayon - 8, 26, -10, couleur);
      Modeles3D.boule(f, 1.4, -rayon - 8, 34.5, -10, or);
    }
    if (points >= 5) {
      Modeles3D.cylindre(f, 9, 10, 32, 10, rayon * 0.3, 0, -rayon - 10, pierre);
      Modeles3D.cylindre(f, 0, 11, 9, 10, rayon * 0.3, 32, -rayon - 10, couleur);
      Modeles3D.boule(f, 1.4, rayon * 0.3, 41.5, -rayon - 10, or);
    }
  },

  // --- Les types de tours ---

  caserne(f, m) {
    const { pierre, pierreSombre, or } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 24 * (1 + 0.035 * c);
    const h = 40 * (1 + 0.11 * c);
    // Le mur est un peu plus large en bas : "rayonA" donne son rayon à une hauteur (de 0 à 1).
    const rayonA = (p) => r + 3 * (1 - p);

    Modeles3D.cylindre(f, r, r + 3, h, 12, 0, 0, 0, pierre);
    Modeles3D.cylindre(f, r + 3.6, r + 4.2, 3, 12, 0, 0, 0, pierreSombre); // la plinthe
    for (const p of [0.26, 0.74]) {
      Modeles3D.cylindre(f, rayonA(p) + 0.5, rayonA(p) + 0.5, 1.6, 12, 0, h * p, 0, pierreSombre);
    }
    Modeles3D.cylindre(f, rayonA(0.47) + 0.7, rayonA(0.47) + 0.7, 4, 12, 0, h * 0.45, 0, m.couleur);

    // Des fenêtres éclairées tout autour, sauf au-dessus de la porte.
    for (const angle of [Math.PI / 2 - 0.85, Math.PI / 2 + 0.85, -Math.PI / 2 + 0.7, -Math.PI / 2 - 0.7, Math.PI]) {
      Modeles3D.fenetre(f, 0, 0, angle, rayonA(0.64), h * 0.6);
    }

    // Le chemin de ronde, ses créneaux, et le toit pointu avec sa boule dorée.
    Modeles3D.cylindre(f, r + 3, r, 5, 12, 0, h, 0, pierreSombre);
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      Modeles3D.boite(f, 6, 6, 4, Math.cos(angle) * (r + 1), h + 5, Math.sin(angle) * (r + 1), pierre, -angle + Math.PI / 2);
    }
    Modeles3D.cylindre(f, r - 1.5, r - 1.5, 2, 12, 0, h + 4, 0, pierreSombre);
    Modeles3D.cylindre(f, 0, r - 2, 20, 12, 0, h + 5, 0, m.couleur);
    Modeles3D.anneau(f, r - 2.2, 0.7, h + 5.6, or, 12);
    Modeles3D.boule(f, 2, 0, h + 25.5, 0, or, 1);

    Modeles3D.porte(f, 8.5, 12, rayonA(0.1) + 0.4);
    const contreLeMur = (x, p) => Math.sqrt(rayonA(p) ** 2 - x * x) + 0.7;
    Modeles3D.lanterne(f, -8.4, 13, contreLeMur(8.4, 0.35));
    Modeles3D.lanterne(f, 8.4, 13, contreLeMur(8.4, 0.35));
    Modeles3D.cheminees(f, m.points.production, r, h + 4, m.fumees);
    m.drapeau = [0, h + 26, 0];
    m.hauteur = h + 44;
    return r;
  },

  forteresse(f, m) {
    const { pierre, pierreSombre, bois, noir, metal, or } = COULEURS_3D;
    const c = m.points.capacite;
    const cote = 42 * (1 + 0.035 * c);
    const h = 30 * (1 + 0.11 * c);
    const d = cote / 2;
    Modeles3D.boite(f, cote + 6, 6, cote + 6, 0, 0, 0, pierreSombre);
    Modeles3D.boite(f, cote, h, cote, 0, 5, 0, pierre);
    Modeles3D.boite(f, cote + 1.2, 1.6, cote + 1.2, 0, 5 + h * 0.55, 0, pierreSombre);
    Modeles3D.boite(f, cote * 0.55, h * 0.55, cote * 0.55, 0, h + 5, 0, pierreSombre);
    Modeles3D.boite(f, cote * 0.6, 3, cote * 0.6, 0, h * 1.55 + 5, 0, m.couleur);
    Modeles3D.fenetrePlate(f, 0, h + 5 + h * 0.22, cote * 0.275, 3.4, 5);

    // Les quatre tours d'angle, avec une fenêtre vers l'extérieur et une pointe dorée.
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = sx * d;
      const z = sz * d;
      Modeles3D.cylindre(f, 9, 10, h + 14, 10, x, 0, z, pierreSombre);
      Modeles3D.cylindre(f, 10.5, 9, 3, 10, x, h + 14, z, pierre);
      Modeles3D.cylindre(f, 0, 10, 13, 10, x, h + 17, z, m.couleur);
      Modeles3D.boule(f, 1.6, x, h + 30.5, z, or);
      Modeles3D.fenetre(f, x, z, Math.atan2(sz, sx), 9.4, h * 0.7, 2.6, 4.5);
    }
    for (let i = -1; i <= 1; i++) {
      Modeles3D.boite(f, 7, 5, 5, i * 12, h + 5, d, pierre);
      Modeles3D.boite(f, 7, 5, 5, i * 12, h + 5, -d, pierre);
      Modeles3D.boite(f, 5, 5, 7, d, h + 5, i * 12, pierre);
      Modeles3D.boite(f, 5, 5, 7, -d, h + 5, i * 12, pierre);
    }

    // Sur les côtés : une bannière entre deux fenêtres.
    for (const s of [-1, 1]) {
      Modeles3D.boite(f, 0.9, 13, 7, s * (d + 0.6), h - 9, 0, m.couleur);
      Modeles3D.boite(f, 1.3, 1, 8.5, s * (d + 0.8), h + 3.5, 0, or);
      Modeles3D.boite(f, 1.1, 3, 1.2, s * (d + 1.1), h - 4, 0, or);
      for (const z of [-7, 7]) Modeles3D.fenetrePlate(f, s * d, 5 + h * 0.62, z, 3, 5, (s * Math.PI) / 2);
    }

    // La grande porte, sa herse et son pont-levis.
    Modeles3D.boite(f, 17, 15, 3, 0, 6, d + 0.6, pierreSombre);
    Modeles3D.arche(f, 8.5, 3, 0, 21, d + 0.6, pierreSombre);
    Modeles3D.boite(f, 11.5, 11, 3, 0, 6, d + 1, noir);
    Modeles3D.arche(f, 5.75, 3, 0, 17, d + 1, noir);
    for (const x of [-4.2, -1.4, 1.4, 4.2]) Modeles3D.boite(f, 0.9, 14, 0.8, x, 6, d + 2.7, metal);
    Modeles3D.boite(f, 11.5, 0.9, 0.8, 0, 11, d + 2.7, metal);
    const pont = new THREE.BoxGeometry(12, 1.2, 13);
    pont.rotateX(0.45);
    Modeles3D.poser(f, pont, bois, 0, 3.2, d + 8.9);

    Modeles3D.cheminees(f, m.points.production, cote * 0.5, h + 5, m.fumees);
    m.drapeau = [0, h * 1.55 + 8, 0];
    m.hauteur = h * 1.55 + 26;
    return cote * 0.7;
  },

  campement(f, m) {
    const { bois, boisSombre, toile, pierreSombre, noir, or } = COULEURS_3D;
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
    // Une traverse de bois à mi-hauteur relie les pieux.
    Modeles3D.anneau(f, r, 0.8, 7, boisSombre, 18);
    // Deux poteaux plus hauts encadrent l'entrée, avec des torches.
    for (const s of [-1, 1]) {
      const x = Math.cos(Math.PI / 2 + s * 0.34) * r;
      const z = Math.sin(Math.PI / 2 + s * 0.34) * r;
      Modeles3D.cylindre(f, 2.6, 2.8, 22, 6, x, 0, z, boisSombre);
      Modeles3D.lanterne(f, x, 22, z);
    }

    // Les tentes, plus nombreuses et plus hautes avec la capacité.
    const tentes = 3 + Math.floor(c / 2);
    const hauteurTente = 26 * (1 + 0.08 * c);
    for (let i = 0; i < tentes; i++) {
      const angle = (i / tentes) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * r * 0.5;
      const z = Math.sin(angle) * r * 0.5 - 2;
      Modeles3D.cylindre(f, 0, 13, hauteurTente, 6, x, 0, z, i % 2 === 0 ? m.couleur : toile);
      Modeles3D.cylindre(f, 0.6, 0.6, 4, 4, x, hauteurTente - 0.5, z, boisSombre);
      Modeles3D.boule(f, 1, x, hauteurTente + 3.6, z, or);
      Modeles3D.boite(f, 5, 11, 1.5, x, 0, z + 11, noir);
    }

    // Le feu de camp, ses bûches et quelques tonneaux.
    Modeles3D.cylindre(f, 6, 7, 2.5, 7, 0, 0, 6, pierreSombre);
    Modeles3D.boite(f, 1.6, 1.6, 8, 0, 1.5, 6, boisSombre, 0.8);
    Modeles3D.boite(f, 1.6, 1.6, 8, 0, 1.5, 6, boisSombre, -0.8);
    m.feu = [0, 3, 6];
    for (const [x, z] of [[r * 0.62, r * 0.42], [r * 0.62 + 6.5, r * 0.3]]) {
      Modeles3D.cylindre(f, 3, 3.4, 6.5, 8, x, 0, z, bois);
      Modeles3D.cylindre(f, 3.5, 3.5, 0.7, 8, x, 1.4, z, noir);
      Modeles3D.cylindre(f, 3.3, 3.3, 0.7, 8, x, 4.6, z, noir);
    }
    Modeles3D.boite(f, 7, 6, 7, -r * 0.62, 0, r * 0.4, bois, 0.4);
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

    // L'entrée, face à la caméra, encadrée de poutres et de lanternes.
    const z = 22 * taille;
    Modeles3D.boite(f, 22, 22, 6, 0, 0, z, noir);
    Modeles3D.boite(f, 4, 25, 5, -13, 0, z + 2, bois);
    Modeles3D.boite(f, 4, 25, 5, 13, 0, z + 2, bois);
    Modeles3D.boite(f, 31, 4.5, 6, 0, 25, z + 2, m.couleur);
    Modeles3D.boite(f, 10, 3, 1, 0, 25.8, z + 5.2, or);
    Modeles3D.lanterne(f, -13, 18, z + 5.5);
    Modeles3D.lanterne(f, 13, 18, z + 5.5);

    // Les rails et le wagonnet plein d'or.
    Modeles3D.boite(f, 2, 1, 26, -5, 0, z + 14, boisSombre);
    Modeles3D.boite(f, 2, 1, 26, 5, 0, z + 14, boisSombre);
    for (let i = 0; i < 5; i++) Modeles3D.boite(f, 14, 0.8, 1.6, 0, 0, z + 4 + i * 5.5, bois);
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

  // Une tour de guet en bois, avec des archers sur la plateforme et un toit au-dessus.
  archers(f, m) {
    const { pierre, pierreSombre, bois, boisSombre, peau, or } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 18 * (1 + 0.035 * c);
    const h = 44 * (1 + 0.11 * c);
    Modeles3D.cylindre(f, r + 4, r + 8, 10, 10, 0, 0, 0, pierre);
    Modeles3D.cylindre(f, r + 4.4, r + 4.4, 1.4, 10, 0, 9, 0, pierreSombre);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      Modeles3D.boite(f, 4.5, h, 4.5, sx * r * 0.72, 8, sz * r * 0.72, bois);
    }
    Modeles3D.boite(f, r * 1.5, 2.5, 2.5, 0, h * 0.55, r * 0.72, boisSombre, 0.5);
    Modeles3D.boite(f, r * 1.5, 2.5, 2.5, 0, h * 0.55, -r * 0.72, boisSombre, -0.5);
    Modeles3D.boite(f, r * 1.5, 2.5, 2.5, r * 0.72, h * 0.3, 0, boisSombre, Math.PI / 2 + 0.5);
    Modeles3D.boite(f, r * 1.5, 2.5, 2.5, -r * 0.72, h * 0.3, 0, boisSombre, Math.PI / 2 - 0.5);

    // L'échelle, devant.
    const zEchelle = r * 0.72 + 3.4;
    Modeles3D.boite(f, 1.2, h, 1.2, -3, 8, zEchelle, boisSombre);
    Modeles3D.boite(f, 1.2, h, 1.2, 3, 8, zEchelle, boisSombre);
    for (let y = 12; y < h + 6; y += 5) Modeles3D.boite(f, 6, 0.9, 0.9, 0, y, zEchelle, bois);

    // La plateforme et ses archers.
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

    // Le toit pointu, posé sur quatre poteaux.
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      Modeles3D.boite(f, 1.8, 17, 1.8, sx * r * 1.18, h + 11, sz * r * 1.18, boisSombre);
    }
    const toit = new THREE.CylinderGeometry(0, r * 2.05, 13, 4);
    toit.translate(0, 6.5, 0);
    Modeles3D.poser(f, toit, m.couleur, 0, h + 27, 0, Math.PI / 4);
    Modeles3D.boule(f, 1.8, 0, h + 41, 0, or, 1);

    Modeles3D.cheminees(f, m.points.production, r, 10, m.fumees);
    m.drapeau = [0, h + 41, 0];
    m.hauteur = h + 62;
    return r + 6;
  },

  // Un bastion bas, avec son canon qui pivote vers sa cible.
  canon(f, m) {
    const { pierre, pierreSombre, boisSombre, metal, or } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 25 * (1 + 0.035 * c);
    const h = 20 * (1 + 0.11 * c);
    Modeles3D.cylindre(f, r, r + 5, h, 10, 0, 0, 0, pierre);
    Modeles3D.cylindre(f, r + 3.2, r + 3.2, 1.6, 10, 0, h * 0.35, 0, pierreSombre);
    // Des contreforts tout autour.
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      Modeles3D.boite(f, 6, h * 0.8, 6, Math.cos(angle) * (r + 3.5), 0, Math.sin(angle) * (r + 3.5), pierreSombre, -angle + Math.PI / 2);
    }
    Modeles3D.cylindre(f, r + 1.5, r, 4, 10, 0, h, 0, pierreSombre);
    Modeles3D.cylindre(f, r - 6, r - 6, 1.5, 10, 0, h + 3, 0, m.couleur);
    Modeles3D.anneau(f, r - 6, 0.6, h + 4.6, or, 20);
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      Modeles3D.boite(f, 7, 6, 4, Math.cos(angle) * r, h + 4, Math.sin(angle) * r, pierre, -angle + Math.PI / 2);
    }
    // La pile de boulets et une caisse de poudre, à côté du bastion.
    for (const [x, y, z] of [[-3, 0, 0], [3, 0, 0], [0, 0, 4], [0, 4.5, 1.4]]) {
      Modeles3D.boule(f, 3, x + r + 9, y + 3, z + 10, '#2a2a2e', 0);
    }
    Modeles3D.boite(f, 8, 6, 8, -r - 6, 0, 12, boisSombre, 0.3);
    Modeles3D.boite(f, 8.4, 1, 8.4, -r - 6, 2.5, 12, metal, 0.3);
    Modeles3D.boite(f, 12, 7, 12, 0, h + 3, 0, boisSombre);
    Modeles3D.cheminees(f, m.points.production, r, h + 3, m.fumees);
    m.canon = [0, h + 13, 0];
    m.drapeau = [r * 0.72, h + 4, -r * 0.72];
    m.hauteur = h + 32;
    return r + 3;
  },

  // Un petit temple clair, avec un cristal vert qui tourne au-dessus.
  soin(f, m) {
    const { pierre, pierreSombre, or } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 24 * (1 + 0.035 * c);
    const h = 26 * (1 + 0.11 * c);
    Modeles3D.cylindre(f, r + 3, r + 7, 5, 10, 0, 0, 0, pierreSombre);
    Modeles3D.cylindre(f, r, r + 3, 4, 10, 0, 5, 0, pierre);
    // Les marches, devant.
    Modeles3D.boite(f, 16, 2.4, 6, 0, 0, r + 7, pierre);
    Modeles3D.boite(f, 13, 4.6, 4, 0, 0, r + 4.5, pierre);
    const colonnes = 8;
    for (let i = 0; i < colonnes; i++) {
      const angle = (i / colonnes) * Math.PI * 2;
      const x = Math.cos(angle) * (r - 3);
      const z = Math.sin(angle) * (r - 3);
      Modeles3D.cylindre(f, 3.2, 3.2, 1.4, 8, x, 9, z, pierre);
      Modeles3D.cylindre(f, 2.2, 2.7, h, 7, x, 9, z, '#f4f1e6');
      Modeles3D.cylindre(f, 3.2, 2.4, 1.6, 8, x, h + 7.4, z, or);
    }
    Modeles3D.cylindre(f, r, r - 2, 4, 10, 0, h + 9, 0, pierre);
    Modeles3D.cylindre(f, r + 0.4, r + 0.4, 1.3, 10, 0, h + 10.4, 0, or);
    Modeles3D.cylindre(f, 3, r, 11, 10, 0, h + 13, 0, m.couleur);
    Modeles3D.cylindre(f, 0, 3, 6, 8, 0, h + 24, 0, or);
    Modeles3D.cylindre(f, r - 10, r - 8, h, 8, 0, 9, 0, '#d9f7e4');
    Modeles3D.cheminees(f, m.points.production, r, 9, m.fumees);
    m.cristal = [0, h + 39, 0];
    m.hauteur = h + 56;
    return r;
  },

  // Exactement une caserne... à un détail près : une petite marque rouge au-dessus de la porte.
  piege(f, m) {
    const rayon = Modeles3D.caserne(f, m);
    Modeles3D.boite(f, 3.4, 1.3, 1, 0, 21.5, rayon + 2.4, '#d6281f', 0.6);
    Modeles3D.boite(f, 3.4, 1.3, 1, 0, 21.5, rayon + 2.5, '#d6281f', -0.6);
    return rayon;
  },

  // Une tour immense, à étages, qui domine toute la carte.
  geante(f, m) {
    const { pierre, pierreSombre, or } = COULEURS_3D;
    const c = m.points.capacite;
    const r = 34 * (1 + 0.025 * c);
    const h = 56 * (1 + 0.08 * c);
    const rayonA = (p) => r + 3 * (1 - p);
    Modeles3D.cylindre(f, r + 4, r + 12, 12, 14, 0, 0, 0, pierreSombre);
    Modeles3D.cylindre(f, r, r + 3, h, 14, 0, 12, 0, pierre);
    // Des contreforts massifs.
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      Modeles3D.boite(f, 8, h * 0.55, 9, Math.cos(angle) * (r + 3), 12, Math.sin(angle) * (r + 3), pierreSombre, -angle + Math.PI / 2);
      Modeles3D.boite(f, 6, 4, 7, Math.cos(angle) * (r + 2.5), 12 + h * 0.55, Math.sin(angle) * (r + 2.5), pierre, -angle + Math.PI / 2);
    }
    Modeles3D.cylindre(f, rayonA(0.55) + 0.8, rayonA(0.55) + 0.8, 6, 14, 0, 12 + h * 0.52, 0, m.couleur);
    Modeles3D.cylindre(f, rayonA(0.62) + 0.9, rayonA(0.62) + 0.9, 1.4, 14, 0, 12 + h * 0.62, 0, or);
    // Deux rangées de fenêtres.
    for (const [p, decalage] of [[0.32, 0], [0.8, 0.45]]) {
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 2 + 0.55 + decalage + (i / 6) * Math.PI * 2;
        Modeles3D.fenetre(f, 0, 0, angle, rayonA(p), 12 + h * p - 3, 4, 7);
      }
    }
    Modeles3D.cylindre(f, r + 5, r, 7, 14, 0, h + 12, 0, pierreSombre);
    const haut = h + 19;
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      Modeles3D.boite(f, 7, 7, 4, Math.cos(angle) * (r + 3), haut, Math.sin(angle) * (r + 3), pierre, -angle + Math.PI / 2);
    }
    Modeles3D.cylindre(f, r * 0.62, r * 0.7, 26, 12, 0, haut, 0, pierre);
    for (let i = 0; i < 4; i++) {
      Modeles3D.fenetre(f, 0, 0, Math.PI / 2 + (i / 4) * Math.PI * 2, r * 0.66, haut + 10, 3.4, 6);
    }
    Modeles3D.cylindre(f, r * 0.72, r * 0.62, 4, 12, 0, haut + 26, 0, pierreSombre);
    Modeles3D.cylindre(f, 0, r * 0.7, 26, 12, 0, haut + 30, 0, m.couleur);
    Modeles3D.anneau(f, r * 0.66, 0.8, haut + 31, or, 12);
    Modeles3D.boule(f, 4, 0, haut + 58, 0, or, 1);
    Modeles3D.porte(f, 14, 20, rayonA(0.05) + 0.6, 12);
    Modeles3D.lanterne(f, -12.5, 28, Math.sqrt(rayonA(0.25) ** 2 - 12.5 * 12.5) + 0.7);
    Modeles3D.lanterne(f, 12.5, 28, Math.sqrt(rayonA(0.25) ** 2 - 12.5 * 12.5) + 0.7);
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

    // Le socle aux couleurs de l'équipe, bordé d'or : on voit à qui est la tour, même de loin.
    Modeles3D.cylindre(f, 47, 50, 2, 10, 0, -1, 0, COULEURS_3D.pierreSombre);
    Modeles3D.cylindre(f, 44, 46, 2.5, 28, 0, 0, 0, foncee);
    Modeles3D.cylindre(f, 40, 41, 3, 28, 0, 0, 0, couleur);
    Modeles3D.anneau(f, 42.6, 0.9, 2.7, COULEURS_3D.or, 32);

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
        Modeles3D.boule(f, 1.6, Math.cos(angle) * 13, y + 16.5, Math.sin(angle) * 13, '#e8303a');
      }
      modele.hauteur += 14;
    }

    modele.geometrie = Modeles3D.fusionner(f);
    return modele;
  },

  // --- Les soldats ---

  // Un soldat est fait de trois formes, pour pouvoir l'animer :
  // - "corps" : de la taille à la tête, avec le bras gauche (et son bouclier) ;
  // - "bras" : le bras droit et son arme, accroché à l'épaule ("epaule"), qui se balance et frappe ;
  // - les jambes, à part (voir "jambe").
  // Le blanc prend la couleur de l'équipe. "armure" est la couleur du métal (voir les skins).
  soldat(type, armure = '#d9d9d9') {
    const corps = Modeles3D.fabrique();
    const bras = Modeles3D.fabrique();
    const f = corps;
    const { peau, boisSombre, noir, or, cuir, tissu } = COULEURS_3D;
    const equipe = '#ffffff';
    let epaule = [4, 8, 0];
    let longueurBras = 7;

    // Ce que tout le monde a : des hanches, un buste avec une ceinture, un cou, une tête avec des
    // yeux, et le bras gauche. Renvoie la hauteur du centre de la tête.
    const buste = (rayon, hauteur, couleur = equipe, couleurBras = couleur) => {
      Modeles3D.cylindre(f, rayon * 0.98, rayon * 0.8, 3.4, 8, 0, -3.4, 0, tissu);
      Modeles3D.cylindre(f, rayon * 0.86, rayon, hauteur, 8, 0, 0, 0, couleur);
      Modeles3D.cylindre(f, rayon * 1.03, rayon * 1.03, 1.3, 8, 0, hauteur * 0.16, 0, cuir);
      Modeles3D.boite(f, 1.5, 1.3, 0.6, 0, hauteur * 0.16, rayon * 1.02, or);
      Modeles3D.cylindre(f, 1.1, 1.3, 1.4, 6, 0, hauteur, 0, peau);
      const yTete = hauteur + 3.6;
      Modeles3D.boule(f, 2.9, 0, yTete, 0, peau, 1);
      Modeles3D.boite(f, 0.55, 0.8, 0.5, 1.05, yTete - 0.1, 2.75, noir);
      Modeles3D.boite(f, 0.55, 0.8, 0.5, -1.05, yTete - 0.1, 2.75, noir);
      Modeles3D.boite(f, 1.8, hauteur * 0.78, 1.8, -rayon - 0.75, hauteur * 0.12, 0.3, couleurBras);
      Modeles3D.boule(f, 1.15, -rayon - 0.75, hauteur * 0.1, 0.3, peau, 0);
      epaule = [rayon + 0.75, hauteur * 0.9, 0];
      longueurBras = hauteur * 0.78;
      return yTete;
    };

    // Le bras droit, accroché à l'épaule (à l'origine), qui pend vers le bas.
    const brasDroit = (couleur = equipe, epauliere = null) => {
      const g = new THREE.BoxGeometry(1.8, longueurBras, 1.8);
      g.translate(0, -longueurBras / 2, 0);
      Modeles3D.poser(bras, g, couleur);
      Modeles3D.boule(bras, 1.15, 0, -longueurBras, 0.2, peau, 0);
      if (epauliere) Modeles3D.boule(bras, 1.9, 0, -0.4, 0, epauliere, 0);
    };
    // Une pièce tenue dans la main droite, penchée vers l'avant de "inclinaison".
    const enMain = (g, couleur, inclinaison) => {
      g.rotateX(inclinaison);
      g.translate(0, -longueurBras, 0.5);
      Modeles3D.poser(bras, g, couleur);
    };
    const epee = (longueur, inclinaison = 0.9) => {
      enMain(new THREE.BoxGeometry(1.1, longueur, 0.5).translate(0, longueur / 2 + 1.3, 0), armure, inclinaison);
      enMain(new THREE.ConeGeometry(0.62, 1.4, 4).translate(0, longueur + 2, 0), armure, inclinaison);
      enMain(new THREE.BoxGeometry(3.8, 0.8, 1).translate(0, 1.3, 0), or, inclinaison);
      enMain(new THREE.BoxGeometry(0.8, 2.2, 0.8), cuir, inclinaison);
    };
    // Un casque rond, avec le nez protégé et une crête aux couleurs de l'équipe.
    const casque = (yTete) => {
      Modeles3D.cylindre(f, 1.5, 3.4, 2.8, 8, 0, yTete + 0.8, 0, armure);
      Modeles3D.cylindre(f, 3.45, 3.45, 0.7, 8, 0, yTete + 0.6, 0, armure);
      Modeles3D.boite(f, 0.6, 2.2, 0.6, 0, yTete - 1.2, 3, armure);
      Modeles3D.boite(f, 0.9, 1.6, 4.6, 0, yTete + 3.2, -0.3, equipe);
    };

    if (type === 'chevalier') {
      // Grand et lourd : armure complète, tabard aux couleurs de l'équipe, grand heaume à plumet,
      // cape et grande épée.
      const tete = buste(5.2, 11, armure, armure);
      Modeles3D.boite(f, 5.8, 10, 0.9, 0, -1.5, 4.7, equipe);
      Modeles3D.boite(f, 1, 4.6, 0.4, 0, 3.4, 5.2, or);
      Modeles3D.boite(f, 3.2, 1, 0.4, 0, 5.4, 5.2, or);
      Modeles3D.boule(f, 2.3, -6, 10.4, 0, armure, 0);
      Modeles3D.cylindre(f, 3.05, 3.25, 5.8, 8, 0, tete - 2.8, 0, armure);
      Modeles3D.cylindre(f, 3.35, 3.35, 0.8, 8, 0, tete + 1.6, 0, or);
      Modeles3D.boite(f, 3.8, 0.6, 0.6, 0, tete + 0.1, 3, noir);
      Modeles3D.boite(f, 0.5, 2, 0.6, 0, tete - 1.7, 3, noir);
      Modeles3D.boite(f, 1.3, 4.6, 5.6, 0, tete + 2.8, -0.9, equipe);
      Modeles3D.boite(f, 8.4, 13, 0.9, 0, -2, -5.4, equipe); // la cape
      brasDroit(armure, armure);
      epee(14);
    } else if (type === 'coureur') {
      // Mince, bras nus, avec un bandeau qui flotte derrière lui et une dague.
      const tete = buste(2.9, 7.5, equipe, peau);
      Modeles3D.cylindre(f, 3, 3, 1.1, 8, 0, tete + 0.4, 0, equipe);
      Modeles3D.boite(f, 0.7, 0.7, 3.4, 0.6, tete, -4.2, equipe);
      Modeles3D.boite(f, 0.7, 0.7, 2.6, -0.6, tete + 0.3, -3.8, equipe);
      Modeles3D.boite(f, 2.6, 1.8, 2.2, 0, 5, -3.2, cuir); // une petite sacoche dans le dos
      brasDroit(peau);
      epee(5, 1.2);
    } else if (type === 'bouclier') {
      // Un grand bouclier devant lui pour arrêter les flèches, et une lance.
      const tete = buste(3.8, 9);
      casque(tete);
      Modeles3D.boite(f, 10, 13, 1.5, 0, -1, 5, armure);
      Modeles3D.boite(f, 7.5, 10, 1.7, 0, 0.5, 5.1, equipe);
      Modeles3D.boite(f, 1.5, 10, 1.9, 0, 0.5, 5.2, or);
      Modeles3D.boite(f, 7.5, 1.5, 1.9, 0, 6, 5.2, or);
      brasDroit(equipe, armure);
      enMain(new THREE.BoxGeometry(0.8, 22, 0.8).translate(0, 4, 0), boisSombre, 0.35);
      enMain(new THREE.ConeGeometry(0.9, 3.4, 4).translate(0, 16.7, 0), armure, 0.35);
    } else if (type === 'eclaireur') {
      // Une capuche, une cape, un sac et une longue-vue dorée.
      const tete = buste(3, 8);
      Modeles3D.cylindre(f, 0.3, 3.9, 5.2, 7, 0, tete - 0.2, -1, equipe); // en arrière, pour voir le visage
      Modeles3D.boite(f, 6, 9, 0.7, 0, -1, -3.4, equipe);
      Modeles3D.boite(f, 5, 6, 2.6, 0, 1.5, -4.2, cuir);
      brasDroit();
      enMain(new THREE.CylinderGeometry(0.75, 0.95, 6.5, 6).translate(0, 2.6, 0), or, 1.3);
    } else if (type === 'soigneur') {
      // Une robe claire avec une étole aux couleurs de l'équipe, et un bâton à croix verte.
      const robe = '#f2f0e4';
      const tete = buste(3.6, 9, robe);
      Modeles3D.cylindre(f, 3.6, 5.2, 6, 8, 0, -4.4, 0, robe);
      Modeles3D.boite(f, 1.3, 10, 0.5, 1.4, -1.5, 3.4, equipe);
      Modeles3D.boite(f, 1.3, 10, 0.5, -1.4, -1.5, 3.4, equipe);
      Modeles3D.cylindre(f, 0.3, 3.7, 4.6, 7, 0, tete + 0.2, -1.1, robe);
      brasDroit(robe);
      enMain(new THREE.BoxGeometry(1, 19, 1).translate(0, 5, 0), boisSombre, 0.12);
      enMain(new THREE.BoxGeometry(4.4, 1.4, 1.4).translate(0, 13.5, 0), '#3fe07d', 0.12);
      enMain(new THREE.BoxGeometry(1.4, 4.4, 1.4).translate(0, 13.5, 0), '#3fe07d', 0.12);
    } else {
      // Le fantassin : casque à crête, épée et bouclier rond aux couleurs de l'équipe.
      const tete = buste(3.7, 9);
      casque(tete);
      Modeles3D.boule(f, 1.8, -4.45, 8.6, 0, armure, 0);
      const disque = (rayon, epaisseur, couleur, z) => {
        const g = new THREE.CylinderGeometry(rayon, rayon, epaisseur, 10);
        g.rotateX(Math.PI / 2);
        Modeles3D.poser(f, g, couleur, -5.2, 4.2, z);
      };
      disque(3.6, 1, armure, 2.3);
      disque(2.9, 1, equipe, 2.55);
      Modeles3D.boule(f, 0.95, -5.2, 4.2, 3.2, or);
      brasDroit(equipe, armure);
      epee(9);
    }
    return { corps: Modeles3D.fusionner(corps), bras: Modeles3D.fusionner(bras), epaule };
  },

  // Une jambe, accrochée par le haut : c'est ce point qui reste fixe quand elle se balance.
  jambe() {
    const f = Modeles3D.fabrique();
    const { tissu, cuir, noir } = COULEURS_3D;
    const cuisse = new THREE.BoxGeometry(2.1, 3.4, 2.3);
    cuisse.translate(0, -1.7, 0);
    Modeles3D.poser(f, cuisse, tissu);
    const botte = new THREE.BoxGeometry(2.4, 2.2, 2.6);
    botte.translate(0, -4.3, 0);
    Modeles3D.poser(f, botte, cuir);
    const revers = new THREE.BoxGeometry(2.7, 0.7, 2.9);
    revers.translate(0, -3.3, 0);
    Modeles3D.poser(f, revers, cuir);
    const pied = new THREE.BoxGeometry(2.4, 1, 3.6);
    pied.translate(0, -4.9, 0.8);
    Modeles3D.poser(f, pied, noir);
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
    // Des cerclages dorés autour du fût.
    for (const z of [0, 12]) {
      const cercle = new THREE.CylinderGeometry(5.3 - z * 0.06, 5.3 - z * 0.06, 1.6, 10);
      cercle.rotateX(Math.PI / 2);
      Modeles3D.poser(f, cercle, '#d9a520', 0, 0, z);
    }
    const bouche = new THREE.CylinderGeometry(5, 5, 3.5, 10);
    bouche.rotateX(Math.PI / 2);
    Modeles3D.poser(f, bouche, '#1d1e22', 0, 0, 23);
    Modeles3D.boule(f, 6, 0, 0, -6, '#3d3f46', 0);
    return Modeles3D.fusionner(f);
  },

  roue() {
    const f = Modeles3D.fabrique();
    const g = new THREE.TorusGeometry(9, 1.3, 5, 12);
    Modeles3D.poser(f, g, COULEURS_3D.boisSombre);
    for (let i = 0; i < 3; i++) {
      const rayon = new THREE.BoxGeometry(18, 1.2, 1.2);
      rayon.rotateZ((i / 3) * Math.PI);
      Modeles3D.poser(f, rayon, COULEURS_3D.bois);
    }
    return Modeles3D.fusionner(f);
  },

  // --- Le décor ---

  sapin(f, x, z, taille, couleur) {
    Modeles3D.cylindre(f, 2.2 * taille, 3 * taille, 8 * taille, 5, x, 0, z, COULEURS_3D.tronc);
    Modeles3D.cylindre(f, 0, 13 * taille, 20 * taille, 6, x, 7 * taille, z, couleur);
    Modeles3D.cylindre(f, 0, 10 * taille, 16 * taille, 6, x, 17 * taille, z, couleur);
  },

  // Un arbre rond, au feuillage fait de quelques boules.
  arbreRond(f, x, z, taille, couleur, tirage) {
    Modeles3D.cylindre(f, 1.8 * taille, 2.6 * taille, 12 * taille, 5, x, 0, z, COULEURS_3D.tronc);
    Modeles3D.boule(f, 10 * taille, x, 18 * taille, z, couleur, 0);
    Modeles3D.boule(f, 7 * taille, x + (tirage() - 0.5) * 10 * taille, 22 * taille, z + (tirage() - 0.5) * 8 * taille, couleur, 0);
  },

  buisson(f, x, z, taille, couleur) {
    Modeles3D.boule(f, 5 * taille, x, 2.5 * taille, z, couleur, 0);
    Modeles3D.boule(f, 3.8 * taille, x + 4 * taille, 2 * taille, z + 1.5 * taille, couleur, 0);
  },

  // Un décor en une seule forme : arbres, rochers, buissons et fleurs,
  // toujours les mêmes pour un même niveau. "ile" est le contour de l'île (voir scene3d.js) :
  // rien n'est posé dans l'eau.
  decor(niveau, largeur, hauteur, ile) {
    const tirage = Generateur.aleatoire(Math.imul(niveau.numero || 1, 31337));
    const f = Modeles3D.fabrique();
    const place = (x, z, distance = 78, bord = 16) =>
      Scene3D.surIle(ile, x, z, bord) &&
      niveau.tours.every((t) => Math.hypot(t.x - largeur / 2 - x, t.y - hauteur / 2 - z) > distance);
    const auHasard = () => {
      // La plupart des décors longent la côte, pour ne pas gêner la partie.
      if (tirage() < 0.7) {
        const k = Math.floor(tirage() * ile.bord.length);
        const recul = 20 + tirage() * 100;
        return [ile.bord[k].x - ile.normales[k].x * recul, ile.bord[k].y - ile.normales[k].y * recul];
      }
      return [(tirage() - 0.5) * (largeur + 200), (tirage() - 0.5) * (hauteur + 200)];
    };

    const nombre = 70;
    for (let i = 0; i < nombre; i++) {
      const [x, z] = auHasard();
      if (!place(x, z)) continue;

      const choix = tirage();
      const taille = 0.7 + tirage() * 0.7;
      const couleur = tirage() < 0.5 ? COULEURS_3D.feuillage : COULEURS_3D.feuillageClair;
      if (choix < 0.45) Modeles3D.sapin(f, x, z, taille, couleur);
      else if (choix < 0.7) Modeles3D.arbreRond(f, x, z, taille, couleur, tirage);
      else if (choix < 0.85) Modeles3D.buisson(f, x, z, taille, couleur);
      else {
        const g = new THREE.DodecahedronGeometry(5 + tirage() * 7, 0);
        Modeles3D.poser(f, g, COULEURS_3D.roche, x, 2, z);
      }
    }

    // Des fleurs, un peu partout entre les tours.
    const fleurs = ['#ff6b8a', '#ffd84d', '#ffffff', '#b98cff', '#ff9f43'];
    for (let i = 0; i < 70; i++) {
      const x = (tirage() - 0.5) * (largeur + 200);
      const z = (tirage() - 0.5) * (hauteur + 200);
      if (!place(x, z, 64, 10)) continue;
      const couleur = fleurs[Math.floor(tirage() * fleurs.length)];
      for (let j = 0; j < 3; j++) {
        const fx = x + (tirage() - 0.5) * 12;
        const fz = z + (tirage() - 0.5) * 12;
        Modeles3D.cylindre(f, 0.3, 0.3, 2.4, 3, fx, 0, fz, COULEURS_3D.feuillage);
        Modeles3D.boule(f, 1.2, fx, 2.8, fz, couleur, 0);
      }
    }
    return f.pieces.length > 0 ? Modeles3D.fusionner(f) : null;
  },
};
