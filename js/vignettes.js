// vignettes.js — Les petites images 3D des tours et des soldats, pour les écrans du menu.
// Elles utilisent leur propre petite zone de dessin, séparée de la carte du jeu.

const Vignettes = {
  TAILLE: 256,
  renderer: null,
  scene: null,
  camera: null,
  images: new Map(),
  objetTournant: null,
  angle: 0,

  installer() {
    if (Vignettes.renderer !== null) return Vignettes.renderer !== false;
    try {
      Vignettes.renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('vignette-3d'),
        alpha: true,
        antialias: true,
      });
    } catch (erreur) {
      Vignettes.renderer = false; // sans image, les écrans restent utilisables
      return false;
    }
    Vignettes.renderer.setSize(Vignettes.TAILLE, Vignettes.TAILLE, false);
    Vignettes.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    Vignettes.scene = new THREE.Scene();
    Vignettes.scene.add(new THREE.HemisphereLight('#ffffff', '#6b7a55', 1.5));
    const soleil = new THREE.DirectionalLight('#fff0d0', 2.4);
    soleil.position.set(-1, 2, 1.5);
    Vignettes.scene.add(soleil);
    Vignettes.camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
    return true;
  },

  // Fabrique l'objet 3D d'une entrée : { genre: 'tour' | 'soldat', type, skin }.
  fabriquer({ genre, type, skin }) {
    const groupe = new THREE.Group();
    const couleur = EQUIPES[EQUIPE_JOUEUR].couleur;
    const materiau = Modeles3D.materiau;

    if (genre === 'tour') {
      const modele = Modeles3D.tour({
        type,
        points: { renforcement: 0, production: 0, capacite: 0 },
        couleur,
        foncee: EQUIPES[EQUIPE_JOUEUR].foncee,
        boss: false,
        skin: skin || 'classique',
      });
      groupe.add(new THREE.Mesh(modele.geometrie, materiau));
      if (modele.canon) {
        const fut = new THREE.Mesh(Modeles3D.futDeCanon(), materiau);
        fut.position.set(...modele.canon);
        groupe.add(fut);
      }
      if (modele.cristal) {
        const cristal = new THREE.Mesh(new THREE.OctahedronGeometry(9, 0), Scene3D.materiauCristal());
        cristal.position.set(...modele.cristal);
        groupe.add(cristal);
      }
    } else {
      const armure = SKINS_SOLDATS[skin || 'classique'].armure;
      const corps = new THREE.InstancedMesh(Modeles3D.soldat(type, armure), Modeles3D.materiauSoldat, 1);
      corps.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 8, 0));
      corps.setColorAt(0, new THREE.Color(couleur));
      corps.frustumCulled = false;
      groupe.add(corps);
      for (const cote of [-1, 1]) {
        const jambe = new THREE.Mesh(Modeles3D.jambe(), materiau);
        jambe.position.set(cote * 2, 5.5, 0);
        jambe.rotation.x = cote * 0.3;
        groupe.add(jambe);
      }
    }
    return groupe;
  },

  // Place la caméra pour que l'objet remplisse l'image, vu un peu de dessus.
  cadrer(objet) {
    objet.updateMatrixWorld(true);
    const boite = new THREE.Box3().setFromObject(objet);
    // Les corps de soldats sont des instances : on compte aussi leur forme de base.
    objet.traverse((morceau) => {
      if (morceau.isInstancedMesh) {
        morceau.geometry.computeBoundingBox();
        boite.union(morceau.geometry.boundingBox.clone().translate(new THREE.Vector3(0, 8, 0)));
      }
    });
    const sphere = boite.getBoundingSphere(new THREE.Sphere());
    const distance = (sphere.radius / Math.sin((Vignettes.camera.fov * Math.PI) / 360)) * 0.82;
    Vignettes.camera.position.set(
      sphere.center.x,
      sphere.center.y + distance * 0.42,
      sphere.center.z + distance * 0.91,
    );
    Vignettes.camera.lookAt(sphere.center);
  },

  // Renvoie l'image d'une entrée, fabriquée une seule fois. Renvoie '' si c'est impossible.
  image(entree) {
    const cle = `${entree.genre}|${entree.type}|${entree.skin || ''}`;
    if (Vignettes.images.has(cle)) return Vignettes.images.get(cle);
    if (!Vignettes.installer()) return '';

    const enCours = Vignettes.objetTournant;
    if (enCours) Vignettes.scene.remove(enCours);

    const objet = Vignettes.fabriquer(entree);
    objet.rotation.y = -0.5;
    Vignettes.scene.add(objet);
    Vignettes.cadrer(objet);
    Vignettes.renderer.render(Vignettes.scene, Vignettes.camera);
    const image = Vignettes.renderer.domElement.toDataURL('image/png');
    Vignettes.scene.remove(objet);

    if (enCours) Vignettes.scene.add(enCours);
    Vignettes.images.set(cle, image);
    return image;
  },

  // L'écran de déblocage : le nouveau type tourne sur lui-même.
  faireTourner(entree) {
    if (!Vignettes.installer()) return;
    Vignettes.arreter();
    Vignettes.objetTournant = Vignettes.fabriquer(entree);
    Vignettes.scene.add(Vignettes.objetTournant);
    Vignettes.cadrer(Vignettes.objetTournant);
    Vignettes.angle = 0;
  },

  arreter() {
    if (Vignettes.objetTournant) Vignettes.scene.remove(Vignettes.objetTournant);
    Vignettes.objetTournant = null;
  },

  animer(dt) {
    if (!Vignettes.objetTournant) return;
    Vignettes.angle += dt * 1.1;
    Vignettes.objetTournant.rotation.y = Vignettes.angle;
    Vignettes.renderer.render(Vignettes.scene, Vignettes.camera);
  },
};
