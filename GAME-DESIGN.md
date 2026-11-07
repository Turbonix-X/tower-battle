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

### Niveau d'une tour

- Chaque tour a un niveau (1, 2 ou 3), affiché avec des points sous le compteur.
- Le niveau monte tout seul à **10** puis **30 soldats**, et redescend si la tour perd des soldats.
- Le niveau fixe combien de lignes peuvent partir de la tour en même temps :

| Niveau | Soldats      | Lignes en même temps |
|--------|--------------|----------------------|
| 1      | moins de 10  | 1                    |
| 2      | de 10 à 29   | 2                    |
| 3      | 30 et plus   | 3                    |

Ce nombre de lignes est rangé par type de tour, car il changera plus tard selon le type.

### Production

- Les tours bleues et rouges gagnent **1 soldat par seconde**.
- Les tours neutres ne produisent rien : elles ont un nombre fixe de soldats et de PV.

### Envoyer des soldats

- Le joueur trace une ligne en glissant de sa tour vers une autre tour, à la souris ou au doigt.
- Des petits soldats partent en file le long de la ligne, environ **2 par seconde**.
- Chaque soldat envoyé retire 1 au compteur de la tour de départ.

### Arrêter une ligne

- Le joueur coupe une ligne en la barrant d'un trait, à la souris ou au doigt. Les soldats déjà en route continuent.
- Une ligne s'arrête toute seule si la tour de départ n'a plus de soldats.

### Combats sur une ligne

- Si deux tours ennemies s'envoient des soldats l'une vers l'autre, les soldats se rencontrent sur la ligne et se battent 1 contre 1, avec une petite animation de combat.
- Au combat, les soldats d'une tour de niveau plus élevé que l'adversaire **comptent double**.

### Arrivée d'un soldat

**Sur une tour ennemie ou neutre :**

- S'il reste des soldats dans la tour, il en combat un et les deux disparaissent (sauf si l'un des camps compte double).
- S'il n'y a plus de soldats dans la tour, il retire 1 PV.
- À 0 PV, la tour change d'équipe et ses PV reviennent au maximum. Les soldats qui arrivent ensuite comptent comme nouveaux soldats.

**Sur sa propre tour :** il ajoute 1 au compteur de soldats, mais ne soigne pas les PV.

### Précisions choisies pendant le développement

Ces points n'étaient pas précisés dans la demande. Ils peuvent changer.

- **Lieu de la rencontre :** les soldats se battent là où ils se croisent. C'est le milieu de la ligne si les deux tours commencent en même temps, sinon plus près de la tour qui a commencé en dernier.
- **Niveau d'un soldat :** il garde le niveau qu'avait sa tour au moment de son départ.
- **« Compter double » sur une ligne :** le soldat le plus fort survit à son premier combat et tue son adversaire. Au combat suivant, il compte pour un seul soldat.
- **« Compter double » à l'arrivée :** un attaquant plus fort tue 2 défenseurs. Si la tour est plus forte, il faut 2 attaquants pour tuer 1 défenseur.
- **PV :** un soldat retire toujours 1 PV, même s'il compte double. Un soldat qui tue le dernier défenseur ne retire pas de PV en plus.
- **Trop de lignes :** si le niveau baisse, les lignes en trop (les plus récentes) se mettent en pause et s'affichent plus pâles. Elles repartent si le niveau remonte.
- **Ligne impossible :** si la tour n'a plus de place ou plus de soldats, la ligne n'est pas créée et les pointillés du tracé sont rouges.
- **Faire un geste :** un geste qui part d'une de mes tours trace une ligne. Partout ailleurs, il coupe. Seules les lignes du joueur peuvent être coupées.

### Fin de partie

- **Victoire** si toutes les tours rouges sont à moi.
- **Défaite** si je n'ai plus de tours.
- La partie s'arrête tout de suite, même s'il reste des soldats en route.
- L'écran de victoire ou de défaite montre le temps de la partie (sans les pauses), avec les boutons **Rejouer** et **Menu**.

### Interface

- Un bouton **Pause** et un bouton **Recommencer** en haut de l'écran.
- Une barre en haut montre la part de soldats de chaque équipe : ceux dans ses tours et ceux en route. Les tours neutres ne comptent pas.
- Le jeu s'ouvre sur un menu très simple avec un bouton **Jouer**, en attendant le vrai menu.

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

### L'ordi rouge

- Il joue tout seul toutes les **2 à 3 secondes**.
- Il capture d'abord les tours neutres proches qu'il peut battre.
- Il attaque ensuite mes tours les plus faibles.
- Il se défend quand une de ses tours est attaquée.
- Il a un réglage de **force de 1 à 10**. Pour l'instant, il est à **force 3**.

### Précisions choisies pendant le développement

Ces points n'étaient pas précisés dans la demande. Ils peuvent changer.

- **Priorités :** à chaque tour, il se défend d'abord, puis il capture une tour neutre, puis il m'attaque.
- **Se défendre :** la tour attaquée riposte vers la tour qui l'attaque si elle a au moins 3 soldats. Sinon, une tour voisine ayant au moins 5 soldats envoie des renforts.
- **Peut battre :** il compte les soldats, les PV et les niveaux, et il peut réunir plusieurs tours pour une même attaque.
- **Couper ses lignes :** il coupe une ligne quand assez de soldats sont partis, ou quand l'attaque ne peut plus réussir.
- **Effet de la force :** plus elle est haute, plus il fait d'actions par tour (1 à force 3, 3 à force 10). Plus elle est basse, plus il prend parfois son deuxième meilleur choix (35 % du temps à force 3).
