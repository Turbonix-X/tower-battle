// donnees-liens.js — Combien de lignes une tour peut recevoir, selon la tour qui envoie.
//
// Le nombre de lignes qu'une tour peut ENVOYER est dans donnees-tours.js (lignesParNiveau).
// Ce tableau règle le nombre de lignes qu'une tour peut RECEVOIR à la fois d'une même équipe,
// venant de tours d'un même type : RECEPTIONS[type qui envoie][type qui reçoit].
// "defaut" s'applique à tous les types qui ne sont pas écrits. Facile à modifier !

const RECEPTIONS = {
  defaut: { defaut: 6, mine: 3 },
  soin: { defaut: 2, forteresse: 1, geante: 4 },
  canon: { defaut: 3 },
  archers: { defaut: 3 },
};

function receptionsMax(typeQuiEnvoie, typeQuiRecoit) {
  const regles = RECEPTIONS[typeQuiEnvoie] || RECEPTIONS.defaut;
  return regles[typeQuiRecoit] ?? regles.defaut;
}
