// scene3d.js — Tout ce qui est dessiné en 3D : île, mer, tours, lignes, soldats et effets.
// Ce fichier ne change aucune règle : il regarde la partie et l'affiche.

const Scene3D = {
  SOLDATS_PAR_LOT: 400, // par type de soldat
  JAMBES_MAX: 1600,
  MORTS_MAX: 120,
  DUREE_CHUTE: 1.6, // le temps qu'un soldat tombé reste à terre, en secondes
  formes: {},
  lots: new Map(),
  morts: [],
  PARTICULES_MAX: 700,
  DUREE_INTRO: 1.7,
  ECHELLE_TOURS: 1.3, // les tours sont dessinées un peu plus grandes pour bien se voir
  ELEVATION_MENU: (32 * Math.PI) / 180,

  renderer: null,
  scene: null,
  soleil: null,
  ciel: null,
  ile: null,
  decor: null,
  mer: null,
  texturePlage: null,
  textureLigne: null,
  soldats: null,
  partie: null,
  horloge: 0,
  tempsCarte: 0,
  tempsFin: 0,
  fin: null,
  secousse: 0,
  objetsTours: new Map(),
  objetsLignes: new Map(),
  materiauxLignes: new Map(),
  materiauxBannieres: new Map(),
  nuages: [],
  mesures: { total: 0, images: 0, niveau: 0 },

  // Renvoie false si le navigateur ne sait pas afficher de 3D.
  installer(canvas) {
    try {
      Scene3D.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch (erreur) {
      return false;
    }

    const { renderer } = Scene3D;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    Modeles3D.installer();
    Scene3D.scene = new THREE.Scene();
    Scene3D.ciel = new THREE.Color('#8fd0ea');
    Scene3D.scene.background = Scene3D.ciel;
    Scene3D.scene.fog = new THREE.Fog('#8fd0ea', 1800, 5200);

    Scene3D.creerLumieres();
    Scene3D.creerMer();
    Scene3D.creerNuages();
    Scene3D.outils = {
      matrice: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      penche: new THREE.Quaternion(),
      echelle: new THREE.Vector3(),
      haut: new THREE.Vector3(0, 1, 0),
      cote: new THREE.Vector3(1, 0, 0),
      couleur: new THREE.Color(),
    };
    Scene3D.creerSoldats();
    Scene3D.creerProjectiles();
    Scene3D.creerCerclePortee();
    Effets.installer(Scene3D.scene);

    Scene3D.textureLigne = Scene3D.creerTextureLigne();
    return true;
  },

  creerLumieres() {
    const { scene } = Scene3D;
    scene.add(new THREE.HemisphereLight('#dff3ff', '#4c6b3c', 1.15));

    const soleil = new THREE.DirectionalLight('#fff0d0', 2.6);
    soleil.position.set(-500, 900, 450);
    soleil.castShadow = true;
    soleil.shadow.mapSize.set(2048, 2048);
    soleil.shadow.bias = -0.0006;
    soleil.shadow.normalBias = 1.2;
    soleil.shadow.camera.near = 100;
    soleil.shadow.camera.far = 2500;
    scene.add(soleil);
    scene.add(soleil.target);
    Scene3D.soleil = soleil;
  },

  textureCanvas(taille, dessin) {
    const canvas = document.createElement('canvas');
    canvas.width = taille;
    canvas.height = taille;
    dessin(canvas.getContext('2d'), taille);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  },

  creerMer() {
    const texture = Scene3D.textureCanvas(256, (ctx, t) => {
      ctx.fillStyle = '#2e93c4';
      ctx.fillRect(0, 0, t, t);
      for (let i = 0; i < 220; i++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 + Math.random() * 0.13})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        const x = Math.random() * t;
        const y = Math.random() * t;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 12, y - 5, x + 26, y);
        ctx.stroke();
      }
    });
    texture.repeat.set(26, 26);
    Scene3D.mer = new THREE.Mesh(
      new THREE.PlaneGeometry(9000, 9000),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35, metalness: 0.1 }),
    );
    Scene3D.mer.rotation.x = -Math.PI / 2;
    Scene3D.mer.position.y = -34;
    Scene3D.scene.add(Scene3D.mer);
  },

  creerNuages() {
    const materiau = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      flatShading: true,
      roughness: 1,
      transparent: true,
      opacity: 0.9,
    });
    for (let i = 0; i < 9; i++) {
      const nuage = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const boule = new THREE.Mesh(new THREE.IcosahedronGeometry(38 + Math.random() * 28, 0), materiau);
        boule.position.set(j * 52 - 80, Math.random() * 18, Math.random() * 40 - 20);
        boule.scale.y = 0.62;
        nuage.add(boule);
      }
      // Les nuages passent loin autour de la carte, jamais devant elle.
      const angle = (i / 9) * Math.PI * 2;
      const rayon = 1200 + Math.random() * 500;
      nuage.position.set(Math.cos(angle) * rayon, 130 + Math.random() * 120, Math.sin(angle) * rayon);
      nuage.userData = { angle, rayon, vitesse: 0.008 + Math.random() * 0.008 };
      Scene3D.scene.add(nuage);
      Scene3D.nuages.push(nuage);
    }
  },

  creerSoldats() {
    // Les corps sont créés à la demande, un lot par type de soldat et par couleur d'armure.
    Scene3D.jambes = new THREE.InstancedMesh(Modeles3D.jambe(), Modeles3D.materiau, Scene3D.JAMBES_MAX);
    Scene3D.jambes.frustumCulled = false;
    Scene3D.jambes.castShadow = true;
    Scene3D.jambes.count = 0;
    Scene3D.jambes.setColorAt(0, new THREE.Color('#ffffff'));
    Scene3D.scene.add(Scene3D.jambes);
  },

  // Le lot de corps pour ce type de soldat et cette armure.
  lotDeCorps(type, armure) {
    const cle = `${type}|${armure}`;
    if (!Scene3D.lots.has(cle)) {
      const lot = new THREE.InstancedMesh(Modeles3D.soldat(type, armure), Modeles3D.materiauSoldat, Scene3D.SOLDATS_PAR_LOT);
      lot.frustumCulled = false;
      lot.castShadow = true;
      lot.count = 0;
      lot.setColorAt(0, new THREE.Color('#ffffff'));
      Scene3D.scene.add(lot);
      Scene3D.lots.set(cle, lot);
    }
    return Scene3D.lots.get(cle);
  },

  // Une bande claire avec des chevrons qui avancent, pour montrer le sens de la ligne.
  creerTextureLigne() {
    const texture = Scene3D.textureCanvas(64, (ctx, t) => {
      ctx.clearRect(0, 0, t, t);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(0, t * 0.22, t, t * 0.56);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.moveTo(t * 0.2, t * 0.14);
      ctx.lineTo(t * 0.5, t * 0.14);
      ctx.lineTo(t * 0.82, t * 0.5);
      ctx.lineTo(t * 0.5, t * 0.86);
      ctx.lineTo(t * 0.2, t * 0.86);
      ctx.lineTo(t * 0.52, t * 0.5);
      ctx.closePath();
      ctx.fill();
    });
    texture.colorSpace = THREE.NoColorSpace;
    return texture;
  },

  // --- Le terrain ---

  // L'île : un dessus d'herbe et des falaises, à la taille de la carte.
  construireIle(partie) {
    const { scene } = Scene3D;
    if (Scene3D.ile) {
      scene.remove(Scene3D.ile);
      Scene3D.ile.geometry.dispose();
    }
    if (Scene3D.decor) {
      scene.remove(Scene3D.decor);
      Scene3D.decor.geometry.dispose();
      Scene3D.decor = null;
    }

    const marge = 70;
    const lx = partie.largeur / 2 + marge;
    const lz = partie.hauteur / 2 + marge;
    const arrondi = 90;
    const forme = new THREE.Shape();
    forme.moveTo(-lx + arrondi, -lz);
    forme.lineTo(lx - arrondi, -lz);
    forme.quadraticCurveTo(lx, -lz, lx, -lz + arrondi);
    forme.lineTo(lx, lz - arrondi);
    forme.quadraticCurveTo(lx, lz, lx - arrondi, lz);
    forme.lineTo(-lx + arrondi, lz);
    forme.quadraticCurveTo(-lx, lz, -lx, lz - arrondi);
    forme.lineTo(-lx, -lz + arrondi);
    forme.quadraticCurveTo(-lx, -lz, -lx + arrondi, -lz);

    const geometrie = new THREE.ExtrudeGeometry(forme, {
      depth: 44,
      bevelEnabled: true,
      bevelSize: 16,
      bevelThickness: 12,
      bevelSegments: 2,
      curveSegments: 10,
    });
    geometrie.rotateX(Math.PI / 2);
    geometrie.translate(0, -12, 0); // le dessus de l'île reste exactement au niveau du sol

    if (!Scene3D.texturePlage) {
      Scene3D.texturePlage = Scene3D.textureCanvas(256, (ctx, t) => {
        ctx.fillStyle = '#5da34c';
        ctx.fillRect(0, 0, t, t);
        for (let i = 0; i < 3200; i++) {
          const clair = Math.random() < 0.5;
          ctx.fillStyle = clair
            ? `rgba(160, 215, 110, ${Math.random() * 0.25})`
            : `rgba(30, 80, 40, ${Math.random() * 0.22})`;
          ctx.fillRect(Math.random() * t, Math.random() * t, 1 + Math.random() * 3, 1 + Math.random() * 3);
        }
      });
      Scene3D.texturePlage.repeat.set(1 / 180, 1 / 180);
    }

    const herbe = new THREE.MeshStandardMaterial({ map: Scene3D.texturePlage, roughness: 0.95 });
    const falaise = new THREE.MeshStandardMaterial({ color: '#7a6548', flatShading: true, roughness: 1 });
    Scene3D.ile = new THREE.Mesh(geometrie, [herbe, falaise]);
    Scene3D.ile.receiveShadow = true;
    scene.add(Scene3D.ile);

    const decor = Modeles3D.decor(partie.niveau, partie.largeur, partie.hauteur);
    if (decor) {
      Scene3D.decor = new THREE.Mesh(decor, Modeles3D.materiau);
      Scene3D.decor.castShadow = true;
      Scene3D.decor.receiveShadow = true;
      scene.add(Scene3D.decor);
    }

    // L'ombre du soleil couvre toute la carte.
    const ombre = Scene3D.soleil.shadow.camera;
    const portee = Math.max(lx, lz) + 140;
    ombre.left = -portee;
    ombre.right = portee;
    ombre.top = portee;
    ombre.bottom = -portee;
    ombre.updateProjectionMatrix();
  },

  // Change de partie : on repart d'une carte propre.
  charger(partie) {
    for (const objet of Scene3D.objetsTours.values()) Scene3D.scene.remove(objet.groupe);
    Scene3D.objetsTours.clear();
    for (const mesh of Scene3D.objetsLignes.values()) {
      Scene3D.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    Scene3D.objetsLignes.clear();
    Scene3D.morts = [];
    Effets.vider();

    Scene3D.partie = partie;
    Scene3D.tempsCarte = 0;
    Scene3D.tempsFin = 0;
    Scene3D.fin = null;
    Scene3D.secousse = 0;
    Scene3D.soleil.intensity = 2.6;
    Scene3D.construireIle(partie);
  },

  finDePartie(victoire) {
    Scene3D.fin = { victoire };
    Scene3D.tempsFin = 0;
    if (victoire) Effets.feuDArtifice();
  },

  redimensionner(largeur, hauteur) {
    Scene3D.renderer.setSize(largeur, hauteur, false);
  },

  // --- Les tours ---

  materiauBanniere(couleur) {
    if (!Scene3D.materiauxBannieres.has(couleur)) {
      Scene3D.materiauxBannieres.set(
        couleur,
        new THREE.MeshStandardMaterial({
          color: couleur,
          side: THREE.DoubleSide,
          flatShading: true,
          roughness: 0.7,
        }),
      );
    }
    return Scene3D.materiauxBannieres.get(couleur);
  },

  // Construit (ou reconstruit) la tour quand son équipe ou ses améliorations changent.
  construireTour(partie, tour, ancien) {
    const couleurs = partie.palette[tour.equipe];
    const modele = Modeles3D.tour({
      type: tour.type,
      points: tour.points,
      couleur: couleurs.couleur,
      foncee: couleurs.foncee,
      boss: tour.boss,
      skin: Scene3D.skinDeLaTour(tour),
    });

    const groupe = new THREE.Group();
    const corps = new THREE.Mesh(modele.geometrie, Modeles3D.materiau);
    corps.castShadow = true;
    corps.receiveShadow = true;
    groupe.add(corps);

    const objet = {
      groupe,
      corps,
      modele,
      cle: Scene3D.cleTour(tour, couleurs),
      banniere: null,
      roue: null,
      feu: null,
      fut: null,
      cristal: null,
      angleFut: 0,
      tempsAnneauSoin: Math.random() * 2,
      tempsFumee: Math.random(),
      apparition: ancien ? ancien.apparition : 0,
      pop: ancien ? ancien.pop : 0,
      tremble: ancien ? ancien.tremble : 0,
      retard: ancien ? 0 : Scene3D.objetsTours.size * 0.05,
    };

    if (modele.drapeau) {
      const [x, y, z] = modele.drapeau;
      const mat = new THREE.Mesh(Scene3D.geometrieMat(), Modeles3D.materiau);
      mat.position.set(x, y, z);
      mat.castShadow = true;
      groupe.add(mat);

      const banniere = new THREE.Mesh(Scene3D.geometrieBanniere(), Scene3D.materiauBanniere(couleurs.couleur));
      banniere.position.set(x, y + 20, z);
      banniere.castShadow = true;
      groupe.add(banniere);
      objet.banniere = banniere;
    }
    if (modele.roue) {
      const roue = new THREE.Mesh(Scene3D.geometrieRoue(), Modeles3D.materiau);
      roue.position.set(...modele.roue);
      groupe.add(roue);
      objet.roue = roue;
    }
    if (modele.feu) {
      const feu = new THREE.Mesh(Scene3D.geometrieFeu(), Scene3D.materiauFeu());
      feu.position.set(...modele.feu);
      groupe.add(feu);
      objet.feu = feu;
    }
    if (modele.canon) {
      const fut = new THREE.Mesh(Scene3D.geometrie('fut', Modeles3D.futDeCanon), Modeles3D.materiau);
      fut.position.set(...modele.canon);
      fut.castShadow = true;
      groupe.add(fut);
      objet.fut = fut;
      objet.angleFut = ancien ? ancien.angleFut : 0;
    }
    if (modele.cristal) {
      const cristal = new THREE.Mesh(Scene3D.geometrie('cristal', () => new THREE.OctahedronGeometry(9, 0)), Scene3D.materiauCristal());
      cristal.position.set(...modele.cristal);
      cristal.castShadow = true;
      groupe.add(cristal);
      objet.cristal = cristal;
    }

    tour.hauteurVisuelle = modele.hauteur * Scene3D.ECHELLE_TOURS;
    groupe.position.set(tour.x - partie.largeur / 2, 0, tour.y - partie.hauteur / 2);
    Scene3D.scene.add(groupe);
    return objet;
  },

  cleTour(tour, couleurs) {
    const { renforcement, production, capacite } = tour.points;
    return `${tour.type}|${renforcement}|${production}|${capacite}|${couleurs.couleur}|${tour.boss}|${Scene3D.skinDeLaTour(tour)}`;
  },

  // Les skins ne concernent que le joueur.
  skinDeLaTour(tour) {
    return tour.equipe === EQUIPE_JOUEUR ? Sauvegarde.donnees.skinTour : 'classique';
  },

  // Une forme partagée, fabriquée une seule fois.
  geometrie(nom, fabriquer) {
    if (!Scene3D.formes[nom]) Scene3D.formes[nom] = fabriquer();
    return Scene3D.formes[nom];
  },

  materiauCristal() {
    if (!Scene3D._materiauCristal) {
      Scene3D._materiauCristal = new THREE.MeshStandardMaterial({
        color: '#7dffb0',
        emissive: '#22d36a',
        emissiveIntensity: 1.1,
        flatShading: true,
        roughness: 0.3,
      });
    }
    return Scene3D._materiauCristal;
  },

  geometrieMat() {
    if (!Scene3D._mat) Scene3D._mat = new THREE.CylinderGeometry(0.8, 0.9, 22, 5).translate(0, 11, 0);
    if (!Scene3D._mat.attributes.color) {
      const nombre = Scene3D._mat.attributes.position.count;
      const couleurs = new Float32Array(nombre * 3).fill(0.3);
      Scene3D._mat.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));
    }
    return Scene3D._mat;
  },

  geometrieBanniere() {
    if (!Scene3D._banniere) {
      const g = new THREE.PlaneGeometry(18, 10, 4, 1);
      g.translate(9, -3, 0);
      Scene3D._banniere = g;
    }
    return Scene3D._banniere;
  },

  geometrieRoue() {
    if (!Scene3D._roue) Scene3D._roue = Modeles3D.roue();
    return Scene3D._roue;
  },

  geometrieFeu() {
    if (!Scene3D._feu) Scene3D._feu = new THREE.ConeGeometry(4, 11, 6).translate(0, 5.5, 0);
    return Scene3D._feu;
  },

  materiauFeu() {
    if (!Scene3D._materiauFeu) Scene3D._materiauFeu = new THREE.MeshBasicMaterial({ color: '#ffb02e' });
    return Scene3D._materiauFeu;
  },

  synchroniserTours(partie, dt) {
    for (const tour of partie.tours) {
      const couleurs = partie.palette[tour.equipe];
      let objet = Scene3D.objetsTours.get(tour);
      if (!objet || objet.cle !== Scene3D.cleTour(tour, couleurs)) {
        const ancien = objet;
        objet = Scene3D.construireTour(partie, tour, ancien);
        if (ancien) Scene3D.scene.remove(ancien.groupe);
        Scene3D.objetsTours.set(tour, objet);
      }
      Scene3D.animerTour(tour, objet, dt);
    }
  },

  animerTour(tour, objet, dt) {
    const t = Scene3D.horloge;
    objet.apparition = Math.min(1, objet.apparition + dt / 0.7 * (Scene3D.tempsCarte > objet.retard ? 1 : 0));
    objet.pop = Math.max(0, objet.pop - dt * 1.8);
    objet.tremble = Math.max(0, objet.tremble - dt * 3.5);

    // À l'arrivée sur la carte, la tour sort de terre avec un petit rebond.
    const a = objet.apparition;
    const rebond = 1 + 2.7 * Math.pow(a - 1, 3) + 1.7 * Math.pow(a - 1, 2);
    const echelleApparition = Math.max(0.001, rebond);

    // Quand elle est améliorée ou capturée, elle gonfle et reprend sa forme.
    const pop = 1 + Math.sin(objet.pop * Math.PI) * 0.28 * objet.pop;
    objet.groupe.scale.setScalar(Scene3D.ECHELLE_TOURS * echelleApparition);
    objet.corps.scale.set(pop, 2 - pop, pop);

    // Quand elle prend des coups, elle tremble.
    const tremble = objet.tremble * 3;
    objet.corps.position.x = Math.sin(t * 60) * tremble;
    objet.corps.position.z = Math.cos(t * 53) * tremble;

    if (objet.banniere) {
      objet.banniere.rotation.y = Math.sin(t * 3 + tour.x) * 0.45;
      objet.banniere.rotation.z = Math.sin(t * 5 + tour.y) * 0.06;
    }
    if (objet.roue) objet.roue.rotation.z = t * 1.6;
    if (objet.fut) Scene3D.animerFut(tour, objet, dt);
    if (objet.cristal) {
      objet.cristal.rotation.y = t * 1.5;
      objet.cristal.position.y = objet.modele.cristal[1] + Math.sin(t * 2.4) * 2.5;
      objet.cristal.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
      objet.tempsAnneauSoin -= dt;
      if (objet.tempsAnneauSoin <= 0 && EQUIPES[tour.equipe].produit) {
        objet.tempsAnneauSoin = 2.4;
        Effets.anneau(objet.groupe.position.x, 5, objet.groupe.position.z, '#6dffa8', Tours.fiche(tour).aura.portee, 1.4);
      }
    }
    if (objet.feu) {
      objet.feu.scale.set(1 + Math.sin(t * 17) * 0.18, 1 + Math.sin(t * 23) * 0.3, 1 + Math.cos(t * 19) * 0.18);
    }

    // La fumée des cheminées.
    objet.tempsFumee -= dt;
    if (objet.tempsFumee <= 0 && EQUIPES[tour.equipe].produit && objet.modele.fumees.length > 0) {
      objet.tempsFumee = 0.34;
      const [x, y, z] = objet.modele.fumees[Math.floor(Math.random() * objet.modele.fumees.length)];
      const e = Scene3D.ECHELLE_TOURS;
      Effets.fumee(objet.groupe.position.x + x * e, y * e, objet.groupe.position.z + z * e);
    }
  },

  // Le canon pivote doucement vers sa cible, et recule à chaque tir.
  animerFut(tour, objet, dt) {
    if (tour.visee) {
      const voulu = Math.atan2(tour.visee.x - tour.x, tour.visee.y - tour.y);
      let ecart = voulu - objet.angleFut;
      ecart = Math.atan2(Math.sin(ecart), Math.cos(ecart));
      objet.angleFut += ecart * Math.min(1, dt * 5);
    }
    objet.fut.rotation.y = objet.angleFut;

    const depuisTir = Scene3D.partie.temps - tour.dernierTir;
    const recul = depuisTir >= 0 && depuisTir < 0.3 ? (1 - depuisTir / 0.3) * 8 : 0;
    const [x, y, z] = objet.modele.canon;
    objet.fut.position.set(
      x - Math.sin(objet.angleFut) * recul,
      y,
      z - Math.cos(objet.angleFut) * recul,
    );
  },

  // Le cercle de portée de la tour sélectionnée.
  afficherPortee(partie) {
    const tour = InterfaceTours.tourSelectionnee();
    const portee = tour ? Tours.porteeAffichee(tour) : 0;
    Scene3D.cerclePortee.visible = portee > 0;
    if (portee <= 0) return;
    Scene3D.cerclePortee.position.set(tour.x - partie.largeur / 2, 5, tour.y - partie.hauteur / 2);
    Scene3D.cerclePortee.scale.setScalar(portee);
    const couleur = Tours.fiche(tour).aura ? '#7dffb0' : partie.palette[tour.equipe].couleur;
    for (const morceau of Scene3D.cerclePortee.children) morceau.material.color.set(couleur);
  },

  creerCerclePortee() {
    const groupe = new THREE.Group();
    const disque = new THREE.CircleGeometry(1, 48);
    disque.rotateX(-Math.PI / 2);
    const bord = new THREE.RingGeometry(0.975, 1, 64);
    bord.rotateX(-Math.PI / 2);
    groupe.add(
      new THREE.Mesh(disque, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.14, depthWrite: false })),
      new THREE.Mesh(bord, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, depthWrite: false })),
    );
    groupe.visible = false;
    groupe.renderOrder = 2;
    Scene3D.scene.add(groupe);
    Scene3D.cerclePortee = groupe;
  },

  // --- Les flèches et les boulets ---

  creerProjectiles() {
    const creer = (geometrie, nombre) => {
      const instances = new THREE.InstancedMesh(geometrie, Modeles3D.materiau, nombre);
      instances.frustumCulled = false;
      instances.castShadow = true;
      instances.count = 0;
      Scene3D.scene.add(instances);
      return instances;
    };
    Scene3D.fleches = creer(Modeles3D.fleche(), 240);
    Scene3D.boulets = creer(Modeles3D.boulet(), 60);
  },

  // La position d'un projectile en vol. Le boulet décrit un grand arc de cercle.
  lieuProjectile(partie, p, avancee, cible) {
    const fleche = p.genre === 'fleche';
    const hauteurDepart = (p.depart.hauteurVisuelle || 70) * (fleche ? 0.8 : 0.7);
    const hauteurFin = fleche ? 9 : 30;
    const arc = (fleche ? 26 : 170) * 4 * avancee * (1 - avancee);
    cible.set(
      p.x + (p.cibleX - p.x) * avancee - partie.largeur / 2,
      hauteurDepart + (hauteurFin - hauteurDepart) * avancee + arc,
      p.y + (p.cibleY - p.y) * avancee - partie.hauteur / 2,
    );
    return cible;
  },

  synchroniserProjectiles(partie) {
    const lieu = new THREE.Vector3();
    const suivant = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const avant = new THREE.Vector3(0, 0, 1);
    const rotation = new THREE.Quaternion();
    const un = new THREE.Vector3(1, 1, 1);
    const matrice = new THREE.Matrix4();
    let nbFleches = 0;
    let nbBoulets = 0;

    for (const p of partie.projectiles) {
      const avancee = Math.min(1, p.temps / p.duree);
      Scene3D.lieuProjectile(partie, p, avancee, lieu);
      Scene3D.lieuProjectile(partie, p, Math.min(1, avancee + 0.04), suivant);
      direction.subVectors(suivant, lieu);
      if (direction.lengthSq() > 0.0001) rotation.setFromUnitVectors(avant, direction.normalize());
      matrice.compose(lieu, rotation, un);

      if (p.genre === 'fleche' && nbFleches < 240) {
        Scene3D.fleches.setMatrixAt(nbFleches, matrice);
        nbFleches += 1;
      } else if (p.genre === 'boulet' && nbBoulets < 60) {
        Scene3D.boulets.setMatrixAt(nbBoulets, matrice);
        nbBoulets += 1;
        if (Math.random() < 0.5) Effets.traineeBoulet(lieu.x, lieu.y, lieu.z);
      }
    }
    Scene3D.fleches.count = nbFleches;
    Scene3D.boulets.count = nbBoulets;
    Scene3D.fleches.instanceMatrix.needsUpdate = true;
    Scene3D.boulets.instanceMatrix.needsUpdate = true;
  },

  // --- Les lignes ---

  materiauLigne(couleur, enPause) {
    const cle = `${couleur}|${enPause}`;
    if (!Scene3D.materiauxLignes.has(cle)) {
      Scene3D.materiauxLignes.set(
        cle,
        new THREE.MeshBasicMaterial({
          color: couleur,
          map: Scene3D.textureLigne,
          transparent: true,
          opacity: enPause ? 0.28 : 1,
          depthWrite: false,
        }),
      );
    }
    return Scene3D.materiauxLignes.get(cle);
  },

  synchroniserLignes(partie, dt) {
    Scene3D.textureLigne.offset.x -= dt * 2.1;

    for (const [ligne, mesh] of Scene3D.objetsLignes) {
      if (!partie.lignes.includes(ligne)) {
        Scene3D.scene.remove(mesh);
        mesh.geometry.dispose();
        Scene3D.objetsLignes.delete(ligne);
      }
    }

    for (const ligne of partie.lignes) {
      // Quand deux tours s'envoient des soldats, chacune dessine sa moitié de la ligne.
      const face = partie.lignes.some((l) => l.depart === ligne.arrivee && l.arrivee === ligne.depart);
      let mesh = Scene3D.objetsLignes.get(ligne);
      if (!mesh || mesh.userData.face !== face) {
        if (mesh) {
          Scene3D.scene.remove(mesh);
          mesh.geometry.dispose();
        }
        mesh = Scene3D.creerLigne(partie, ligne, face);
        Scene3D.objetsLignes.set(ligne, mesh);
      }
      // Une ligne de soin est verte, quelle que soit l'équipe.
      const couleur = Tours.fiche(ligne.depart).aura ? '#6dffa8' : partie.palette[ligne.depart.equipe].couleur;
      mesh.material = Scene3D.materiauLigne(couleur, ligne.enPause);
    }
  },

  creerLigne(partie, ligne, face) {
    const { depart, arrivee } = ligne;
    const part = face ? 0.5 : 1;
    const ax = depart.x - partie.largeur / 2;
    const az = depart.y - partie.hauteur / 2;
    const dx = (arrivee.x - depart.x) * part;
    const dz = (arrivee.y - depart.y) * part;
    const longueur = Math.hypot(dx, dz);

    const geometrie = new THREE.PlaneGeometry(longueur, 15);
    const uv = geometrie.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) * longueur) / 26);

    const mesh = new THREE.Mesh(geometrie);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -Math.atan2(dz, dx);
    mesh.position.set(ax + dx / 2, 3.5, az + dz / 2);
    mesh.renderOrder = 1;
    mesh.userData.face = face;
    Scene3D.scene.add(mesh);
    return mesh;
  },

  // --- Les soldats ---

  armureDeLEquipe(equipe) {
    const skin = equipe === EQUIPE_JOUEUR ? Sauvegarde.donnees.skinSoldat : 'classique';
    return SKINS_SOLDATS[skin].armure;
  },

  // Ajoute un corps à son lot, penché selon l'angle demandé (pour se battre ou tomber).
  poserCorps(type, equipe, couleur, x, y, z, direction, penche, taille) {
    const v = Scene3D.outils;
    const lot = Scene3D.lotDeCorps(type, Scene3D.armureDeLEquipe(equipe));
    if (lot.count >= Scene3D.SOLDATS_PAR_LOT) return null;
    v.rotation.setFromAxisAngle(v.haut, direction);
    v.penche.setFromAxisAngle(v.cote, penche);
    v.rotation.multiply(v.penche);
    v.position.set(x, y, z);
    v.echelle.setScalar(taille);
    v.matrice.compose(v.position, v.rotation, v.echelle);
    lot.setMatrixAt(lot.count, v.matrice);
    lot.setColorAt(lot.count, v.couleur.set(couleur));
    lot.count += 1;
    return lot;
  },

  synchroniserSoldats(partie, dt) {
    const v = Scene3D.outils;
    const t = Scene3D.horloge;
    for (const lot of Scene3D.lots.values()) lot.count = 0;
    let jambes = 0;

    for (const s of partie.soldats) {
      if (s.mort) continue;
      const lieu = Soldats.position(s);
      const x = lieu.x - partie.largeur / 2;
      const z = lieu.y - partie.hauteur / 2;
      const couleur = partie.palette[s.equipe].couleur;
      const direction = Math.atan2(s.arrivee.x - s.depart.x, s.arrivee.y - s.depart.y);
      const taille = 1.15 + s.niveau * 0.16;

      // Ils marchent : le corps sautille à chaque pas et les jambes se balancent.
      const pas = t * (s.vitesse / 7) + s.phase;
      const hanche = 5.2 * taille + Math.abs(Math.sin(pas)) * 1.6;
      // Face à un ennemi, ils se penchent et frappent. Le coureur court toujours penché.
      let penche = Soldats.fiche(s).vitesse > 1.5 ? 0.3 : 0.04;
      if (s.engage) penche = 0.4 + Math.sin(t * 22 + s.phase) * 0.3;
      Scene3D.poserCorps(s.type, s.equipe, couleur, x, hanche + 3, z, direction + Math.sin(pas) * 0.14, penche, taille);

      // Deux jambes, en opposition.
      for (const cote of [-1, 1]) {
        if (jambes >= Scene3D.JAMBES_MAX) break;
        v.rotation.setFromAxisAngle(v.haut, direction);
        v.penche.setFromAxisAngle(v.cote, s.engage ? 0.2 : Math.sin(pas) * cote * 0.75);
        v.rotation.multiply(v.penche);
        v.position.set(
          x + Math.cos(direction) * 1.9 * taille * cote,
          hanche,
          z - Math.sin(direction) * 1.9 * taille * cote,
        );
        v.echelle.setScalar(taille);
        v.matrice.compose(v.position, v.rotation, v.echelle);
        Scene3D.jambes.setMatrixAt(jambes, v.matrice);
        Scene3D.jambes.setColorAt(jambes, v.couleur.set(couleur));
        jambes += 1;
      }
    }

    // Ceux qui viennent de mourir tombent à la renverse, restent un instant, puis disparaissent.
    Scene3D.morts = Scene3D.morts.filter((m) => {
      m.temps += dt;
      if (m.temps >= Scene3D.DUREE_CHUTE) return false;
      const chute = Math.min(1, m.temps / 0.32);
      const fin = Math.max(0, m.temps - (Scene3D.DUREE_CHUTE - 0.5)) / 0.5;
      const taille = 1.3 * (1 - fin);
      Scene3D.poserCorps(
        m.soldat,
        m.equipe,
        partie.palette[m.equipe].couleur,
        m.x,
        3 + (1 - chute) * 7 - fin * 3,
        m.z,
        m.direction,
        -chute * (Math.PI / 2),
        Math.max(0.01, taille),
      );
      return true;
    });

    for (const lot of Scene3D.lots.values()) {
      lot.instanceMatrix.needsUpdate = true;
      if (lot.instanceColor) lot.instanceColor.needsUpdate = true;
    }
    Scene3D.jambes.count = jambes;
    Scene3D.jambes.instanceMatrix.needsUpdate = true;
    if (Scene3D.jambes.instanceColor) Scene3D.jambes.instanceColor.needsUpdate = true;
  },

  // --- Les événements de la partie deviennent des effets ---

  lireEvenements(partie) {
    const couleur = (equipe) => partie.palette[equipe].couleur;
    const lieuTour = (tour, hauteur = 30) => [tour.x - partie.largeur / 2, hauteur, tour.y - partie.hauteur / 2];

    for (const e of partie.evenements) {
      const objet = e.tour ? Scene3D.objetsTours.get(e.tour) : null;
      switch (e.type) {
        case 'combat':
          Effets.combat(e.x - partie.largeur / 2, 9, e.y - partie.hauteur / 2, couleur(e.equipes[0]), couleur(e.equipes[1]));
          break;
        case 'impact':
          Effets.impact(...lieuTour(e.tour, 18), couleur(e.equipe), 3);
          if (objet) objet.tremble = Math.max(objet.tremble, 0.25);
          break;
        case 'degat':
          Effets.impact(...lieuTour(e.tour, 22), '#c9b89a', 5);
          if (objet) objet.tremble = 0.6;
          break;
        case 'renfort':
          Effets.impact(...lieuTour(e.tour, 12), couleur(e.tour.equipe), 2);
          break;
        case 'capture':
          Effets.capture(...lieuTour(e.tour, 2), couleur(e.equipe));
          if (objet) objet.pop = 1;
          Scene3D.secousse = Math.max(Scene3D.secousse, e.equipe === EQUIPE_JOUEUR || e.tour.equipe === EQUIPE_JOUEUR ? 1 : 0.35);
          break;
        case 'amelioration':
          Effets.amelioration(...lieuTour(e.tour, 2), e.statistique);
          if (objet) objet.pop = 1;
          break;
        case 'coupe':
          Effets.impact(e.x - partie.largeur / 2, 8, e.y - partie.hauteur / 2, '#ffffff', 10);
          break;
        case 'mort':
          if (Scene3D.morts.length < Scene3D.MORTS_MAX) {
            Scene3D.morts.push({
              x: e.x - partie.largeur / 2,
              z: e.y - partie.hauteur / 2,
              soldat: e.soldat,
              equipe: e.equipe,
              direction: e.direction,
              temps: 0,
            });
          }
          break;
        case 'tir':
          if (e.genre === 'boulet') {
            const hauteur = (e.tour.hauteurVisuelle || 70) * 0.7;
            Effets.departCanon(...lieuTour(e.tour, hauteur));
          }
          break;
        case 'fleche':
          Effets.impact(e.x - partie.largeur / 2, 10, e.y - partie.hauteur / 2, e.bloquee ? '#ffe9a8' : '#ffffff', e.bloquee ? 5 : 3);
          break;
        case 'boulet':
          Effets.explosion(e.x - partie.largeur / 2, 28, e.y - partie.hauteur / 2);
          if (objet) objet.tremble = 1;
          Scene3D.secousse = Math.max(Scene3D.secousse, 0.3);
          break;
        case 'soin':
          Effets.soin(...lieuTour(e.tour, 20));
          break;
        case 'piege':
          Effets.piege(...lieuTour(e.tour, 10));
          if (objet) objet.tremble = 1;
          Scene3D.secousse = 1;
          break;
        default:
          break;
      }
    }
    partie.evenements.length = 0;
  },

  // --- La caméra ---

  animerCamera(etat, dt) {
    const base = Vue.azimutBase;
    const calme = Scene3D.mouvementReduit();
    Scene3D.secousse = Math.max(0, Scene3D.secousse - dt * 2.6);
    const force = calme ? 0 : Scene3D.secousse * Scene3D.secousse * 9;
    const sx = Math.sin(Scene3D.horloge * 71) * force;
    const sy = Math.cos(Scene3D.horloge * 83) * force;

    if (etat === 'menu') {
      const tour = calme ? 0 : Scene3D.horloge * 0.05;
      Vue.poser(base + tour, Scene3D.ELEVATION_MENU, 0.92);
    } else if (etat === 'fin') {
      Scene3D.tempsFin += dt;
      const p = Math.min(1, Scene3D.tempsFin / 2.5);
      const adouci = p * p * (3 - 2 * p);
      const tour = calme ? 0 : Scene3D.tempsFin * 0.07;
      Vue.poser(base + tour, Vue.ELEVATION - adouci * 0.3, 1 - adouci * 0.07, sx, sy);
    } else if (Scene3D.tempsCarte < Scene3D.DUREE_INTRO && !calme && etat === 'enJeu') {
      // L'arrivée sur la carte : la caméra descend en tournant.
      const p = Scene3D.tempsCarte / Scene3D.DUREE_INTRO;
      const adouci = 1 - Math.pow(1 - p, 3);
      Vue.poser(
        base + (1 - adouci) * 0.85,
        Scene3D.ELEVATION_MENU + (Vue.ELEVATION - Scene3D.ELEVATION_MENU) * adouci,
        1 + (1 - adouci) * 0.5,
      );
    } else {
      Vue.poser(base, Vue.ELEVATION, 1, sx, sy);
    }
  },

  mouvementReduit() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // --- L'image ---

  dessiner(partie, dt, etat) {
    if (partie !== Scene3D.partie) Scene3D.charger(partie);
    Scene3D.horloge += dt;
    Scene3D.tempsCarte += dt;

    Scene3D.synchroniserTours(partie, dt);
    Scene3D.synchroniserLignes(partie, dt);
    Scene3D.lireEvenements(partie);
    Scene3D.synchroniserSoldats(partie, dt);
    Scene3D.synchroniserProjectiles(partie);
    Scene3D.afficherPortee(partie);
    Scene3D.animerCamera(etat, dt);
    Scene3D.animerDecor(dt);
    Effets.mettreAJour(dt);
    if (Scene3D.fin && Scene3D.fin.victoire) Effets.continuerFete(dt);
    if (Scene3D.fin && !Scene3D.fin.victoire) {
      Scene3D.soleil.intensity = Math.max(0.9, Scene3D.soleil.intensity - dt * 1.2);
    }

    Scene3D.renderer.render(Scene3D.scene, Vue.camera);
    Scene3D.adapterQualite(dt);
  },

  animerDecor(dt) {
    Scene3D.mer.material.map.offset.x += dt * 0.012;
    Scene3D.mer.material.map.offset.y += dt * 0.006;
    Scene3D.mer.position.y = -34 + Math.sin(Scene3D.horloge * 0.6) * 1.5;

    for (const nuage of Scene3D.nuages) {
      nuage.userData.angle += nuage.userData.vitesse * dt;
      nuage.position.x = Math.cos(nuage.userData.angle) * nuage.userData.rayon;
      nuage.position.z = Math.sin(nuage.userData.angle) * nuage.userData.rayon;
    }
  },

  // Sur un appareil qui peine, on baisse la qualité plutôt que de saccader.
  adapterQualite(dt) {
    const m = Scene3D.mesures;
    if (document.visibilityState !== 'visible' || dt <= 0 || dt >= 0.1) return;
    m.total += dt;
    m.images += 1;
    if (m.images < 90) return;

    const moyenne = m.total / m.images;
    m.total = 0;
    m.images = 0;
    if (moyenne > 0.03 && m.niveau === 0) {
      m.niveau = 1;
      Scene3D.renderer.setPixelRatio(1);
      Moteur.redimensionner();
    } else if (moyenne > 0.04 && m.niveau === 1) {
      m.niveau = 2;
      Scene3D.renderer.shadowMap.enabled = false;
      Scene3D.soleil.castShadow = false;
    }
  },
};

// --- Les effets : particules, flashs, ondes de choc et colonnes de lumière ---

const Effets = {
  particules: null,
  vivantes: [],
  anneaux: [],
  flashs: [],
  colonnes: [],
  scene: null,
  tempsFete: 0,

  installer(scene) {
    Effets.scene = scene;
    Effets.particules = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      Scene3D.PARTICULES_MAX,
    );
    Effets.particules.frustumCulled = false;
    Effets.particules.count = 0;
    Effets.particules.setColorAt(0, new THREE.Color('#ffffff'));
    scene.add(Effets.particules);

    const anneau = new THREE.RingGeometry(0.82, 1, 40);
    anneau.rotateX(-Math.PI / 2);
    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(
        anneau,
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      );
      mesh.visible = false;
      scene.add(mesh);
      Effets.anneaux.push({ mesh, vie: 0, duree: 1, rayon: 1 });
    }

    const texture = Scene3D.textureCanvas(64, (ctx, t) => {
      const degrade = ctx.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
      degrade.addColorStop(0, 'rgba(255, 255, 255, 1)');
      degrade.addColorStop(0.3, 'rgba(255, 255, 255, 0.55)');
      degrade.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = degrade;
      ctx.fillRect(0, 0, t, t);
    });
    for (let i = 0; i < 24; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      sprite.visible = false;
      scene.add(sprite);
      Effets.flashs.push({ sprite, vie: 0, duree: 1, taille: 1 });
    }

    const colonne = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true);
    colonne.translate(0, 0.5, 0);
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(
        colonne,
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      );
      mesh.visible = false;
      scene.add(mesh);
      Effets.colonnes.push({ mesh, vie: 0, duree: 1 });
    }
  },

  vider() {
    Effets.vivantes.length = 0;
    Effets.tempsFete = 0;
    for (const a of Effets.anneaux) {
      a.vie = 0;
      a.mesh.visible = false;
    }
    for (const f of Effets.flashs) {
      f.vie = 0;
      f.sprite.visible = false;
    }
    for (const c of Effets.colonnes) {
      c.vie = 0;
      c.mesh.visible = false;
    }
  },

  ajouter(p) {
    if (Effets.vivantes.length >= Scene3D.PARTICULES_MAX) Effets.vivantes.shift();
    Effets.vivantes.push(p);
  },

  gerbe(x, y, z, couleur, nombre, { vitesse = 60, montee = 60, gravite = 180, taille = 2, vie = 0.7 } = {}) {
    const c = new THREE.Color(couleur);
    for (let i = 0; i < nombre; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = vitesse * (0.3 + Math.random() * 0.7);
      const duree = vie * (0.6 + Math.random() * 0.6);
      Effets.ajouter({
        x,
        y,
        z,
        vx: Math.cos(angle) * v,
        vy: montee * (0.4 + Math.random()),
        vz: Math.sin(angle) * v,
        gravite,
        taille: taille * (0.6 + Math.random() * 0.8),
        vie: duree,
        duree,
        r: c.r,
        g: c.g,
        b: c.b,
        grossit: false,
      });
    }
  },

  fumee(x, y, z) {
    const gris = 0.55 + Math.random() * 0.25;
    Effets.ajouter({
      x: x + (Math.random() - 0.5) * 2,
      y,
      z: z + (Math.random() - 0.5) * 2,
      vx: 5 + Math.random() * 5,
      vy: 20 + Math.random() * 9,
      vz: -2 + Math.random() * 4,
      gravite: 0,
      taille: 2.5,
      vie: 1.6,
      duree: 1.6,
      r: gris,
      g: gris,
      b: gris,
      grossit: true,
    });
  },

  anneau(x, y, z, couleur, rayon, duree) {
    const a = Effets.anneaux.find((e) => e.vie <= 0);
    if (!a) return;
    a.vie = duree;
    a.duree = duree;
    a.rayon = rayon;
    a.mesh.position.set(x, y, z);
    a.mesh.material.color.set(couleur);
    a.mesh.visible = true;
  },

  flash(x, y, z, couleur, taille, duree) {
    const f = Effets.flashs.find((e) => e.vie <= 0);
    if (!f) return;
    f.vie = duree;
    f.duree = duree;
    f.taille = taille;
    f.sprite.position.set(x, y, z);
    f.sprite.material.color.set(couleur);
    f.sprite.visible = true;
  },

  colonne(x, z, couleur, rayon, hauteur, duree) {
    const c = Effets.colonnes.find((e) => e.vie <= 0);
    if (!c) return;
    c.vie = duree;
    c.duree = duree;
    c.mesh.position.set(x, 0, z);
    c.mesh.scale.set(rayon, hauteur, rayon);
    c.mesh.material.color.set(couleur);
    c.mesh.visible = true;
  },

  combat(x, y, z, couleurA, couleurB) {
    Effets.flash(x, y + 4, z, '#fff3c4', 42, 0.22);
    Effets.anneau(x, 4, z, '#ffffff', 26, 0.35);
    Effets.gerbe(x, y, z, couleurA, 7, { vitesse: 80, montee: 80 });
    Effets.gerbe(x, y, z, couleurB, 7, { vitesse: 80, montee: 80 });
    Effets.gerbe(x, y, z, '#fff6b0', 4, { vitesse: 110, montee: 90, taille: 1.2, vie: 0.35 });
  },

  impact(x, y, z, couleur, nombre) {
    Effets.gerbe(x, y, z, couleur, nombre, { vitesse: 50, montee: 50, taille: 1.7, vie: 0.45 });
  },

  capture(x, y, z, couleur) {
    Effets.flash(x, 40, z, '#ffffff', 190, 0.5);
    Effets.anneau(x, 5, z, couleur, 125, 0.7);
    Effets.anneau(x, 5, z, '#ffffff', 80, 0.5);
    Effets.colonne(x, z, couleur, 36, 460, 0.95);
    Effets.gerbe(x, y + 10, z, couleur, 46, { vitesse: 140, montee: 210, gravite: 260, taille: 3.2, vie: 1.1 });
    Effets.gerbe(x, y + 10, z, '#c9b89a', 16, { vitesse: 95, montee: 130, gravite: 340, taille: 2.8, vie: 0.8 });
    Effets.gerbe(x, y + 20, z, '#ffffff', 14, { vitesse: 100, montee: 260, gravite: 200, taille: 1.4, vie: 0.9 });
  },

  // Une spirale d'étincelles autour de la tour améliorée.
  amelioration(x, y, z, statistique) {
    const couleur = { renforcement: '#a9d8ff', production: '#ff9d4d', capacite: '#ffe066' }[statistique];
    Effets.flash(x, 45, z, couleur, 120, 0.45);
    Effets.anneau(x, 4, z, couleur, 72, 0.6);
    Effets.colonne(x, z, couleur, 30, 200, 0.6);
    const c = new THREE.Color(couleur);
    const or = new THREE.Color('#ffd84d');
    for (let i = 0; i < 44; i++) {
      const angle = i * 0.62;
      const vitesse = 34;
      const teinte = i % 3 === 0 ? or : c;
      Effets.ajouter({
        x: x + Math.cos(angle) * 34,
        y: y + i * 1.6,
        z: z + Math.sin(angle) * 34,
        vx: -Math.sin(angle) * vitesse,
        vy: 62,
        vz: Math.cos(angle) * vitesse,
        gravite: -20,
        taille: 2.1,
        vie: 0.9,
        duree: 0.9,
        r: teinte.r,
        g: teinte.g,
        b: teinte.b,
        grossit: false,
      });
    }
  },

  departCanon(x, y, z) {
    Effets.flash(x, y, z, '#ffd27a', 70, 0.2);
    Effets.gerbe(x, y, z, '#b8b8b8', 6, { vitesse: 45, montee: 45, gravite: -10, taille: 3, vie: 0.7 });
  },

  traineeBoulet(x, y, z) {
    Effets.ajouter({
      x,
      y,
      z,
      vx: 0,
      vy: 4,
      vz: 0,
      gravite: 0,
      taille: 2.2,
      vie: 0.45,
      duree: 0.45,
      r: 0.5,
      g: 0.5,
      b: 0.5,
      grossit: true,
    });
  },

  // La petite explosion à l'arrivée d'un boulet.
  explosion(x, y, z) {
    Effets.flash(x, y + 6, z, '#ffb347', 120, 0.3);
    Effets.anneau(x, 5, z, '#ffb347', 62, 0.45);
    Effets.gerbe(x, y, z, '#ff8a2b', 16, { vitesse: 90, montee: 120, gravite: 240, taille: 2.6, vie: 0.65 });
    Effets.gerbe(x, y, z, '#ffd27a', 8, { vitesse: 60, montee: 90, gravite: 180, taille: 1.6, vie: 0.45 });
    Effets.gerbe(x, y, z, '#5b5650', 10, { vitesse: 70, montee: 110, gravite: 290, taille: 2.2, vie: 0.8 });
  },

  soin(x, y, z) {
    Effets.gerbe(x, y, z, '#6dffa8', 5, { vitesse: 18, montee: 42, gravite: -12, taille: 1.7, vie: 0.8 });
  },

  // Le piège : une grosse explosion, avec une colonne de feu et des débris partout.
  piege(x, y, z) {
    Effets.flash(x, 50, z, '#ff7a33', 300, 0.55);
    Effets.anneau(x, 5, z, '#ff5a1f', 190, 0.8);
    Effets.anneau(x, 5, z, '#ffd27a', 110, 0.55);
    Effets.colonne(x, z, '#ff6a2b', 44, 320, 0.8);
    Effets.gerbe(x, y, z, '#ff6a2b', 60, { vitesse: 190, montee: 260, gravite: 300, taille: 3.8, vie: 1.1 });
    Effets.gerbe(x, y, z, '#ffd27a', 26, { vitesse: 130, montee: 200, gravite: 220, taille: 2.2, vie: 0.8 });
    Effets.gerbe(x, y, z, '#4d4843', 26, { vitesse: 150, montee: 220, gravite: 380, taille: 3, vie: 1.2 });
  },

  feuDArtifice() {
    Effets.tempsFete = 6;
  },

  // Tant que dure la fête : des fusées et des confettis au-dessus de la carte.
  continuerFete(dt) {
    if (Effets.tempsFete <= 0) return;
    Effets.tempsFete -= dt;
    if (Math.random() > dt * 3.2) return;
    const partie = Scene3D.partie;
    const x = (Math.random() - 0.5) * partie.largeur * 0.8;
    const z = (Math.random() - 0.5) * partie.hauteur * 0.8;
    const y = 190 + Math.random() * 130;
    const couleur = ['#ffd84d', '#ff6b6b', '#6be0ff', '#a6ff6b', '#ff8bf0'][Math.floor(Math.random() * 5)];
    Effets.flash(x, y, z, couleur, 170, 0.35);
    Effets.gerbe(x, y, z, couleur, 34, { vitesse: 170, montee: 120, gravite: 130, taille: 2.3, vie: 1.3 });
  },

  mettreAJour(dt) {
    const instances = Effets.particules;
    const matrice = Effets._matrice || (Effets._matrice = new THREE.Matrix4());
    const couleur = Effets._couleur || (Effets._couleur = new THREE.Color());

    let n = 0;
    for (let i = Effets.vivantes.length - 1; i >= 0; i--) {
      const p = Effets.vivantes[i];
      p.vie -= dt;
      if (p.vie <= 0) {
        Effets.vivantes[i] = Effets.vivantes[Effets.vivantes.length - 1];
        Effets.vivantes.pop();
        continue;
      }
      p.vy -= p.gravite * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 1 && p.gravite > 0) {
        p.y = 1;
        p.vy *= -0.35;
        p.vx *= 0.6;
        p.vz *= 0.6;
      }
      const reste = p.vie / p.duree;
      const taille = p.grossit ? p.taille * (1 + (1 - reste) * 2.6) * Math.min(1, reste * 3) : p.taille * reste;
      matrice.makeScale(taille, taille, taille);
      matrice.setPosition(p.x, p.y, p.z);
      instances.setMatrixAt(n, matrice);
      instances.setColorAt(n, couleur.setRGB(p.r, p.g, p.b));
      n += 1;
    }
    instances.count = n;
    instances.instanceMatrix.needsUpdate = true;
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true;

    for (const a of Effets.anneaux) {
      if (a.vie <= 0) continue;
      a.vie -= dt;
      const p = 1 - Math.max(0, a.vie) / a.duree;
      a.mesh.scale.setScalar(a.rayon * (0.2 + p * 0.8));
      a.mesh.material.opacity = 1 - p;
      a.mesh.visible = a.vie > 0;
    }
    for (const f of Effets.flashs) {
      if (f.vie <= 0) continue;
      f.vie -= dt;
      const p = 1 - Math.max(0, f.vie) / f.duree;
      f.sprite.scale.setScalar(f.taille * (0.5 + p * 0.5));
      f.sprite.material.opacity = 1 - p;
      f.sprite.visible = f.vie > 0;
    }
    for (const c of Effets.colonnes) {
      if (c.vie <= 0) continue;
      c.vie -= dt;
      c.mesh.material.opacity = (Math.max(0, c.vie) / c.duree) * 0.65;
      c.mesh.visible = c.vie > 0;
    }
  },
};
