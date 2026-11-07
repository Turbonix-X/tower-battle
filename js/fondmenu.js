// fondmenu.js — Le fond animé de l'écran titre : des petites tours et des soldats qui marchent.

const FondMenu = {
  canvas: null,
  ctx: null,
  horloge: 0,
  // Positions en fraction de l'écran. Chaque route relie deux tours par leurs indices.
  TOURS: [
    { x: 0.1, y: 0.25, couleur: '#2f7bff' },
    { x: 0.32, y: 0.12, couleur: '#9aa0a6' },
    { x: 0.62, y: 0.16, couleur: '#e5383b' },
    { x: 0.9, y: 0.3, couleur: '#ffcf33' },
    { x: 0.14, y: 0.75, couleur: '#9aa0a6' },
    { x: 0.42, y: 0.88, couleur: '#2f7bff' },
    { x: 0.72, y: 0.82, couleur: '#9b5cf6' },
    { x: 0.92, y: 0.7, couleur: '#e5383b' },
  ],
  ROUTES: [
    [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [3, 7], [1, 5], [2, 6],
  ],
  SOLDATS_PAR_ROUTE: 5,
  ROUTES_PAR_SECONDE: 0.09,

  installer() {
    FondMenu.canvas = document.getElementById('fond-menu');
    FondMenu.ctx = FondMenu.canvas.getContext('2d');
  },

  animer(dt) {
    const { canvas, ctx } = FondMenu;
    const cadre = canvas.getBoundingClientRect();
    if (cadre.width === 0) return;

    const pixels = window.devicePixelRatio || 1;
    const largeur = Math.round(cadre.width * pixels);
    const hauteur = Math.round(cadre.height * pixels);
    if (canvas.width !== largeur || canvas.height !== hauteur) {
      canvas.width = largeur;
      canvas.height = hauteur;
    }
    ctx.setTransform(pixels, 0, 0, pixels, 0, 0);

    // Si le joueur préfère moins d'animations, le décor reste immobile.
    const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!calme) FondMenu.horloge += dt;

    ctx.clearRect(0, 0, cadre.width, cadre.height);
    const positions = FondMenu.TOURS.map((tour, i) => ({
      x: tour.x * cadre.width,
      y: tour.y * cadre.height + Math.sin(FondMenu.horloge * 0.6 + i) * 4,
      couleur: tour.couleur,
    }));

    FondMenu.ROUTES.forEach(([a, b], indice) => {
      FondMenu.dessinerRoute(ctx, positions[a], positions[b], indice);
    });
    for (const tour of positions) FondMenu.dessinerTour(ctx, tour);
  },

  dessinerRoute(ctx, a, b, indice) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Une file de soldats avance le long de la route.
    const depart = (FondMenu.horloge * FondMenu.ROUTES_PAR_SECONDE + indice * 0.37) % 1;
    for (let i = 0; i < FondMenu.SOLDATS_PAR_ROUTE; i++) {
      const avancee = (depart + i / FondMenu.SOLDATS_PAR_ROUTE) % 1;
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * avancee, a.y + (b.y - a.y) * avancee, 4, 0, Math.PI * 2);
      ctx.fillStyle = a.couleur;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  },

  dessinerTour(ctx, tour) {
    const rayon = 22;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.fillRect(
        tour.x + Math.cos(angle) * rayon - 4,
        tour.y + Math.sin(angle) * rayon - 4,
        8,
        8,
      );
    }
    ctx.beginPath();
    ctx.arc(tour.x, tour.y, rayon, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tour.x, tour.y, rayon * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = tour.couleur;
    ctx.fill();
  },
};
