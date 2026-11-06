# Tower Battle — Game Design

Ce document décrit le jeu complet. Il sera complété au fur et à mesure.
Une section marquée *« À compléter »* attend encore tes détails.

---

## 1. Résumé

**Tower Battle** est un jeu de stratégie en temps réel, jouable dans le navigateur.
Sur une carte vue de dessus, chaque équipe envoie des soldats depuis ses tours
pour capturer les tours neutres et ennemies.

## 2. Plateforme

- **Technologies :** HTML, CSS et JavaScript
- **Où y jouer :** dans le navigateur
- **Publication :** GitHub Pages

## 3. Principe de jeu

- La carte est vue de dessus et contient des tours.
- Chaque tour a un **compteur de soldats** qui monte avec le temps.
- Le joueur **trace des lignes** entre les tours pour envoyer des soldats.
- Les soldats servent à **capturer** les tours neutres et ennemies.

### Les deux valeurs d'une tour

1. **Le compteur de soldats**, affiché au-dessus : c'est son attaque, les soldats qu'elle peut envoyer.
2. **La barre de PV**, affichée sous le compteur : c'est sa durabilité.

### Production

- Les tours bleues et rouges gagnent **1 soldat par seconde**.
- Les tours neutres ne produisent rien : elles ont un nombre fixe de soldats et de PV.

### Envoyer des soldats

- Le joueur trace une ligne en glissant de sa tour vers une autre tour, à la souris ou au doigt.
- Des petits soldats partent en file le long de la ligne, environ **2 par seconde**.
- Chaque soldat envoyé retire 1 au compteur de la tour de départ.

### Arrivée d'un soldat

**Sur une tour ennemie ou neutre :**

- S'il reste des soldats dans la tour, il en combat un et les deux disparaissent.
- S'il n'y a plus de soldats dans la tour, il retire 1 PV.
- À 0 PV, la tour change d'équipe et ses PV reviennent au maximum. Les soldats qui arrivent ensuite comptent comme nouveaux soldats.

**Sur sa propre tour :** il ajoute 1 au compteur de soldats, mais ne soigne pas les PV.

## 4. Équipes

| Couleur | Qui joue ?            |
|---------|-----------------------|
| Bleu    | Le joueur             |
| Rouge   | L'ordi                |
| Jaune   | Équipe supplémentaire |
| Vert    | Équipe supplémentaire |
| Orange  | Équipe supplémentaire |
| Violet  | Équipe supplémentaire |

Les équipes supplémentaires ne sont présentes que dans certaines parties.

---

## 5. Types de tours

*À compléter*

## 6. Améliorations

*À compléter*

## 7. Argent

*À compléter*

## 8. Décors

*À compléter*

## 9. Obstacles

*À compléter*

## 10. Brouillard

*À compléter*

## 11. Avions

*À compléter*

## 12. Niveaux

*À compléter*

## 13. Ordis

*À compléter*
