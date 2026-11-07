// camera.js — La caméra 3D, et la conversion entre la carte et l'écran.
// Sur un écran en hauteur, la caméra tourne pour remplir l'écran, avec le joueur en bas.

const Vue = {
  ELEVATION: (58 * Math.PI) / 180,
  CHAMP: 38, // l'angle de vue de la caméra, en degrés
  MARGE_ECRAN: 0.93, // la carte occupe au plus 93 % de l'écran
  HAUTEUR_ETIQUETTES: 120, // pour que les compteurs du haut restent visibles

  camera: null,
  largeurEcran: 1,
  hauteurEcran: 1,
  largeurCarte: 1000,
  hauteurCarte: 640,
  echelle: 1, // pixels par unité de carte, au centre de l'écran
  tournee: false,
  azimutBase: 0,
  distance: 1500,
  cible: null,
  vecteur: null,

  installer() {
    Vue.camera = new THREE.PerspectiveCamera(Vue.CHAMP, 1, 10, 9000);
    Vue.cible = new THREE.Vector3();
    Vue.vecteur = new THREE.Vector3();
  },

  // Place la caméra autour de la cible, avec un angle et une distance.
  poser(azimut, elevation, facteur = 1, secousseX = 0, secousseY = 0) {
    const d = Vue.distance * facteur;
    const horizontal = Math.cos(elevation) * d;
    Vue.camera.position.set(
      Vue.cible.x + Math.sin(azimut) * horizontal + secousseX,
      Vue.cible.y + Math.sin(elevation) * d + secousseY,
      Vue.cible.z + Math.cos(azimut) * horizontal,
    );
    Vue.camera.up.set(0, 1, 0);
    Vue.camera.lookAt(Vue.cible);
    Vue.camera.updateMatrixWorld();
  },

  // Cherche la distance et le cadrage pour que toute la carte tienne dans l'écran.
  ajuster(largeurCarte, hauteurCarte, largeurEcran, hauteurEcran) {
    Vue.largeurCarte = largeurCarte;
    Vue.hauteurCarte = hauteurCarte;
    Vue.largeurEcran = Math.max(1, largeurEcran);
    Vue.hauteurEcran = Math.max(1, hauteurEcran);
    Vue.tournee = hauteurEcran > largeurEcran;
    Vue.azimutBase = Vue.tournee ? -Math.PI / 2 : 0;

    Vue.camera.aspect = Vue.largeurEcran / Vue.hauteurEcran;
    Vue.camera.updateProjectionMatrix();

    const lx = largeurCarte / 2;
    const lz = hauteurCarte / 2;
    const points = [];
    for (const [x, z] of [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]]) {
      points.push([x, 0, z], [x, Vue.HAUTEUR_ETIQUETTES, z]);
    }
    // Sur l'écran, "vers le haut" correspond à ce déplacement sur le sol.
    const hautSol = Vue.tournee ? [1, 0] : [0, -1];

    Vue.distance = 1500;
    Vue.cible.set(0, 0, 0);
    const v = Vue.vecteur;
    for (let essai = 0; essai < 24; essai++) {
      Vue.poser(Vue.azimutBase, Vue.ELEVATION);
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const [x, y, z] of points) {
        v.set(x, y, z).project(Vue.camera);
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
      }
      const facteur = Math.max((maxX - minX) / 2, (maxY - minY) / 2) / Vue.MARGE_ECRAN;
      Vue.distance *= 0.3 + 0.7 * facteur;

      // Recentre la carte en hauteur : avec la perspective, le bas de la carte paraît plus grand.
      const centreY = (maxY + minY) / 2;
      const ecart = centreY * Vue.distance * Math.tan((Vue.CHAMP * Math.PI) / 360);
      Vue.cible.x += hautSol[0] * ecart;
      Vue.cible.z += hautSol[1] * ecart;
    }
    Vue.poser(Vue.azimutBase, Vue.ELEVATION);

    const a = Vue.versEcran(largeurCarte / 2, hauteurCarte / 2);
    const b = Vue.tournee
      ? Vue.versEcran(largeurCarte / 2, hauteurCarte / 2 + 100)
      : Vue.versEcran(largeurCarte / 2 + 100, hauteurCarte / 2);
    Vue.echelle = Math.max(0.0001, Math.hypot(b.x - a.x, b.y - a.y) / 100);
  },

  // Convertit une position de la carte (x, y) et une hauteur en position sur l'écran.
  versEcran(x, y, hauteur = 0) {
    const v = Vue.vecteur;
    v.set(x - Vue.largeurCarte / 2, hauteur, y - Vue.hauteurCarte / 2).project(Vue.camera);
    return {
      x: ((v.x + 1) / 2) * Vue.largeurEcran,
      y: ((1 - v.y) / 2) * Vue.hauteurEcran,
    };
  },
};
