// deblocages.js — Ce qui est débloqué à chaque niveau, et ce que le joueur n'a pas encore découvert.

const Deblocages = {
  // Toutes les choses à débloquer, sous la forme { genre, type, niveau, fiche }.
  liste() {
    const entrees = [];
    for (const [type, fiche] of Object.entries(TYPES_DE_TOURS)) {
      entrees.push({ genre: 'tour', type, niveau: fiche.debloqueAu, fiche });
    }
    for (const [type, fiche] of Object.entries(TYPES_DE_SOLDATS)) {
      entrees.push({ genre: 'soldat', type, niveau: fiche.debloqueAu, fiche });
    }
    return entrees.sort((a, b) => a.niveau - b.niveau);
  },

  cle(entree) {
    return `${entree.genre}:${entree.type}`;
  },

  // Un type de tour ou de soldat existe-t-il déjà à ce niveau ?
  tourDisponible(type, numero) {
    return TYPES_DE_TOURS[type].debloqueAu <= numero;
  },

  soldatDisponible(type, numero) {
    return TYPES_DE_SOLDATS[type].debloqueAu <= numero;
  },

  // Ce qui apparaît exactement à ce niveau : c'est lui qui sert à l'apprendre.
  auNiveau(numero) {
    return Deblocages.liste().filter((e) => e.niveau === numero);
  },

  // Ce qui vient d'être débloqué et que le joueur n'a pas encore vu présenté.
  nouveaux() {
    const { niveauAtteint, deblocagesVus } = Sauvegarde.donnees;
    return Deblocages.liste().filter(
      (e) => e.niveau > 1 && e.niveau <= niveauAtteint && !deblocagesVus.includes(Deblocages.cle(e)),
    );
  },

  marquerVus(entrees) {
    for (const entree of entrees) Sauvegarde.donnees.deblocagesVus.push(Deblocages.cle(entree));
    Sauvegarde.enregistrer();
  },
};
