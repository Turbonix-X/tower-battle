// textes.js — Tous les textes du jeu, en français et en anglais.

const TEXTES = {
  fr: {
    jouer: 'Jouer',
    niveaux: 'Niveaux',
    parametres: 'Paramètres',
    credits: 'Crédits',
    retour: 'Retour',
    pause: 'Pause',
    reprendre: 'Reprendre',
    recommencer: 'Recommencer',
    menu: 'Menu',
    rejouer: 'Rejouer',
    suivant: 'Niveau suivant',
    victoire: 'Victoire !',
    defaite: 'Défaite',
    temps: 'Temps : {temps}',
    niveau: 'Niveau {n}',
    niveauBoss: 'Niveau {n} — Boss',
    pageNiveaux: 'Niveaux {a} à {b}',
    pagePrecedente: 'Page précédente',
    pageSuivante: 'Page suivante',
    verrouille: 'Niveau {n}, verrouillé',
    musique: 'Volume de la musique',
    effets: 'Volume des effets',
    vitesse: 'Vitesse du jeu',
    langue: 'Langue',
    francais: 'Français',
    anglais: 'English',
    effacer: 'Effacer la sauvegarde',
    confirmerEffacer: 'Effacer toute ta progression ? Cette action ne peut pas être annulée.',
    annuler: 'Annuler',
    ouiEffacer: 'Oui, effacer',
    sauvegardeEffacee: 'Sauvegarde effacée.',
    creditsPar: 'Un jeu de',
    partsAria: 'Part de soldats de chaque équipe',
    carteAria: 'Carte de Tower Battle',
    pauseAria: 'Mettre en pause',

    tut1a: 'Glisse de ta tour bleue vers la tour grise pour envoyer des soldats.',
    tut1b: 'Tes soldats combattent ceux de la tour, puis retirent ses PV. À 0 PV, elle est à toi !',
    tut1c: 'Maintenant, attaque la tour rouge. Prends toutes ses tours pour gagner.',
    tut2a: 'Le nombre, c\'est ton attaque : tes soldats. Il monte tout seul avec le temps.',
    tut2b: 'La barre verte, ce sont les PV de la tour : sa durabilité. Capture cette tour.',
    tut2c: 'Une nouvelle tour produit aussi des soldats. Prends la dernière tour grise puis la rouge.',
    tut3a: 'Une tour rouge produit des soldats, comme les tiennes. Attaque-la sans attendre !',
    tut4a: 'Regarde les points jaunes : c\'est le niveau de ta tour. Attends d\'avoir 10 soldats.',
    tut4b: 'Niveau 2 ! Ta tour envoie maintenant 2 lignes en même temps. À 30 soldats, c\'est le niveau 3.',
    tut5a: 'Ta tour est de niveau 2 : trace une première ligne.',
    tut5b: 'Trace une deuxième ligne depuis la même tour.',
    tut5c: 'Parfait. Finis le travail en prenant la tour rouge.',
    tut6a: 'Envoie des soldats vers cette tour grise.',
    tut6b: 'Pour arrêter, barre la ligne d\'un trait. Les soldats déjà en route continuent.',
    tut6c: 'Bien joué ! Attaque maintenant la tour rouge.',
    tut7a: 'Ta tour du haut est bien remplie : relie-la à ta tour du bas pour la renforcer.',
    tut7b: 'Un renfort ajoute des soldats, mais ne soigne pas les PV. Attaque la tour rouge !',
    tut8a: 'Si ta tour a un niveau plus élevé que l\'adversaire, tes soldats comptent double. Attaque !',
    tut9a: 'Quand deux tours s\'attaquent, les soldats se battent sur la ligne. Envoie tes soldats !',
    tut10a: 'Deux ennemis cette fois, et ils s\'attaquent aussi entre eux. À toi de jouer !',
  },
  en: {
    jouer: 'Play',
    niveaux: 'Levels',
    parametres: 'Settings',
    credits: 'Credits',
    retour: 'Back',
    pause: 'Pause',
    reprendre: 'Resume',
    recommencer: 'Restart',
    menu: 'Menu',
    rejouer: 'Play again',
    suivant: 'Next level',
    victoire: 'Victory!',
    defaite: 'Defeat',
    temps: 'Time: {temps}',
    niveau: 'Level {n}',
    niveauBoss: 'Level {n} — Boss',
    pageNiveaux: 'Levels {a} to {b}',
    pagePrecedente: 'Previous page',
    pageSuivante: 'Next page',
    verrouille: 'Level {n}, locked',
    musique: 'Music volume',
    effets: 'Effects volume',
    vitesse: 'Game speed',
    langue: 'Language',
    francais: 'Français',
    anglais: 'English',
    effacer: 'Erase save',
    confirmerEffacer: 'Erase all your progress? This cannot be undone.',
    annuler: 'Cancel',
    ouiEffacer: 'Yes, erase',
    sauvegardeEffacee: 'Save erased.',
    creditsPar: 'A game by',
    partsAria: 'Share of soldiers for each team',
    carteAria: 'Tower Battle map',
    pauseAria: 'Pause the game',

    tut1a: 'Drag from your blue tower to the gray tower to send soldiers.',
    tut1b: 'Your soldiers fight the tower\'s soldiers, then remove its HP. At 0 HP, it\'s yours!',
    tut1c: 'Now attack the red tower. Take all its towers to win.',
    tut2a: 'The number is your attack: your soldiers. It goes up by itself over time.',
    tut2b: 'The green bar is the tower\'s HP: its durability. Capture this tower.',
    tut2c: 'A new tower produces soldiers too. Take the last gray tower, then the red one.',
    tut3a: 'A red tower produces soldiers, just like yours. Attack it right away!',
    tut4a: 'See the yellow dots: that\'s your tower\'s level. Wait until you have 10 soldiers.',
    tut4b: 'Level 2! Your tower can now send 2 lines at once. At 30 soldiers, it reaches level 3.',
    tut5a: 'Your tower is level 2: draw a first line.',
    tut5b: 'Draw a second line from the same tower.',
    tut5c: 'Perfect. Finish the job by taking the red tower.',
    tut6a: 'Send soldiers to this gray tower.',
    tut6b: 'To stop, cross the line with a stroke. Soldiers already on the way keep going.',
    tut6c: 'Well done! Now attack the red tower.',
    tut7a: 'Your top tower is well filled: link it to your bottom tower to reinforce it.',
    tut7b: 'Reinforcements add soldiers but don\'t heal HP. Attack the red tower!',
    tut8a: 'If your tower has a higher level than the enemy, your soldiers count double. Attack!',
    tut9a: 'When two towers attack each other, the soldiers fight on the line. Send yours!',
    tut10a: 'Two enemies this time, and they fight each other too. Your turn!',
  },
};

const Textes = {
  langue: 'fr',

  t(cle, valeurs = {}) {
    let texte = TEXTES[Textes.langue][cle] ?? cle;
    for (const [nom, valeur] of Object.entries(valeurs)) {
      texte = texte.replace(`{${nom}}`, valeur);
    }
    return texte;
  },

  // Met à jour les textes écrits dans la page (attributs data-texte et data-texte-aria).
  appliquer(langue) {
    Textes.langue = langue;
    document.documentElement.lang = langue;
    for (const element of document.querySelectorAll('[data-texte]')) {
      element.textContent = Textes.t(element.dataset.texte);
    }
    for (const element of document.querySelectorAll('[data-texte-aria]')) {
      element.setAttribute('aria-label', Textes.t(element.dataset.texteAria));
    }
  },
};
