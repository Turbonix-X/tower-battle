# Tower Battle — Game Design

Ce document décrit le jeu complet. Il sera complété au fur et à mesure.
Une section marquée *« À compléter »* attend encore tes détails.

---

## 1. Résumé

**Tower Battle** est un jeu de stratégie en temps réel, jouable dans le navigateur.
Sur une carte vue de dessus, chaque équipe envoie des soldats depuis ses tours
pour capturer les tours neutres et ennemies.

## 2. Plateforme

- **Technologies :** HTML, CSS et JavaScript, avec Three.js pour la 3D (WebGL)
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

- Les tours des équipes produisent des soldats selon leur type (voir « Types de tours »), jusqu'à leur capacité. Une tour pleine arrête de produire.
- Les tours neutres ne produisent rien : elles ont un nombre fixe de soldats et de PV.

### Envoyer des soldats

- Le joueur trace une ligne en glissant de sa tour vers une autre tour, à la souris ou au doigt.
- Des petits soldats partent en file le long de la ligne, environ **2 par seconde**.
- **Attaquer coûte moins que ce qu'on gagne :** un fantassin envoyé sur un adversaire ne coûte que 0,4 à la tour de départ (ce coût dépend du type de soldat). Avec une ligne, une caserne perd 0,8 par seconde et en gagne 1 : son compteur continue de monter.
- **Un renfort coûte un soldat entier :** entre deux tours d'une même équipe, chaque envoi retire 1, sinon on pourrait fabriquer des soldats à l'infini.

### Arrêter une ligne

- Le joueur coupe une ligne en la barrant d'un trait, à la souris ou au doigt. Les soldats déjà en route continuent.
- Une ligne s'arrête toute seule si la tour de départ n'a plus de soldats.

### Combats sur une ligne

- Si deux tours ennemies s'envoient des soldats l'une vers l'autre, les soldats se rencontrent sur la ligne et se battent 1 contre 1, avec une petite animation de combat.
- Au combat, les soldats d'une tour de niveau plus élevé que l'adversaire **comptent double**, en plus de la force de leur type (voir « Types de soldats »).

### Arrivée d'un soldat

**Sur une tour ennemie ou neutre :**

- S'il reste des soldats dans la tour, il en combat un et les deux disparaissent (sauf si l'un des camps compte double).
- S'il n'y a plus de soldats dans la tour, il retire des PV selon son type et ses améliorations (1 PV sur une caserne de base).
- À 0 PV, la tour change d'équipe, perd ses améliorations et ses PV reviennent au maximum. Les soldats qui arrivent ensuite comptent comme nouveaux soldats.

**Sur sa propre tour :** il ajoute 1 au compteur de soldats, sans dépasser la capacité, mais ne soigne pas les PV.

### Précisions choisies pendant le développement

Ces points n'étaient pas précisés dans la demande. Ils peuvent changer.

- **Lieu de la rencontre :** les soldats se battent là où ils se croisent. C'est le milieu de la ligne si les deux tours commencent en même temps, sinon plus près de la tour qui a commencé en dernier.
- **Niveau d'un soldat :** il garde le niveau qu'avait sa tour au moment de son départ.
- **Un combat sur une ligne :** chacun vaut sa force, doublée s'il vient d'une tour de niveau plus élevé. Le plus fort survit avec ce qu'il lui reste. Par exemple, un chevalier (2) qui bat un fantassin (1) continue avec une force de 1.
- **« Compter double » à l'arrivée :** un attaquant plus fort tue 2 défenseurs. Si la tour est plus forte, il faut 2 attaquants pour tuer 1 défenseur.
- **PV :** un soldat retire toujours 1 PV, même s'il compte double. Un soldat qui tue le dernier défenseur ne retire pas de PV en plus.
- **Trop de lignes :** si le niveau baisse, les lignes en trop du joueur (les plus récentes) se mettent en pause et s'affichent plus pâles. Elles repartent si le niveau remonte. Celles d'un ordi disparaissent tout de suite, pour qu'il ne dépasse jamais sa limite.
- **Ligne impossible :** si la tour n'a plus de place ou plus de soldats, la ligne n'est pas créée et les pointillés du tracé sont rouges.
- **Faire un geste :** un geste qui part d'une de mes tours trace une ligne. Partout ailleurs, il coupe. Seules les lignes du joueur peuvent être coupées.

### Fin de partie

- **Victoire** si toutes les tours ennemies sont à moi (ou prises par quelqu'un d'autre, tant qu'il ne reste aucun ennemi).
- **Défaite** si je n'ai plus de tours.
- La partie s'arrête tout de suite, même s'il reste des soldats en route.
- L'écran de victoire ou de défaite montre le temps de la partie (sans les pauses) et les étoiles, avec les boutons **Niveau suivant** (après une victoire), **Rejouer** et **Menu**.

### Interface

- Un bouton **Pause** et un bouton **Recommencer** en haut de l'écran, avec le numéro du niveau.
- **Échap** (ou le bouton Pause) ouvre un mini menu qui met le jeu en pause : Reprendre, Recommencer, Menu, avec le numéro de version. Échap referme le mini menu.
- Une barre en haut montre la part de soldats de chaque équipe : ceux dans ses tours et ceux en route. Les tours neutres ne comptent pas.
- L'or de partie est affiché en haut de l'écran pendant la partie, et les pièces sur l'écran titre.
- Toucher une de mes tours sans glisser ouvre le menu rond d'amélioration.
- Garder le doigt ou la souris sur une tour affiche sa fiche d'info.

### Affichage en 3D

- Le jeu est en 3D, sur une île au milieu de la mer. Sur un écran en hauteur, la caméra tourne pour que le joueur soit en bas.
- Animations : arrivée de la caméra sur la carte, tours qui sortent de terre, soldats qui trottinent, lignes aux chevrons qui avancent, drapeaux, fumée, roue de la mine et feu de camp.
- Effets : éclairs et étincelles en combat, tour qui tremble sous les coups, colonne de lumière et onde de choc à la capture, secousse de caméra, spirale d'étincelles à l'amélioration, feu d'artifice à la victoire, lumière qui baisse à la défaite.
- Derrière le menu, une vraie bataille se joue toute seule. Elle ne touche pas à la sauvegarde.
- Les compteurs, points de niveau et barres de PV restent écrits à plat pour être lisibles.
- Sur un appareil qui peine, la qualité baisse toute seule. Si le navigateur ne sait pas afficher de 3D, un message l'explique.

### Menu

- **Écran titre** : le nom du jeu, un fond animé avec des petites tours et des soldats qui marchent, et les boutons **Jouer**, **Niveaux**, **Paramètres** et **Crédits** (« Turbonix Entertainment »).
- **Jouer** lance le dernier niveau débloqué.
- **Paramètres** : volume de la musique, volume des effets, vitesse du jeu (×1, ×2), langue (français, anglais).
- Des transitions en fondu relient les écrans.

### Sauvegarde

- Tout est gardé dans le navigateur (localStorage, toujours dans un try/catch) : niveau atteint, étoiles, paramètres, et pour plus tard l'argent et les tours débloquées.
- Un bouton dans les paramètres efface la sauvegarde, après une confirmation.
- Une sauvegarde abîmée ou un stockage bloqué ne font pas planter le jeu : il repart avec les valeurs par défaut.

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

Toutes les valeurs sont rangées dans `js/donnees-tours.js` : pour ajouter un type, il suffit d'y ajouter une fiche.

| Type | Débloqué au niveau | Soldats par seconde | Soldats ennemis pour retirer des PV | Capacité | Lignes (niveaux 1, 2, 3) | Soldats produits |
|------|------|------|------|------|------|------|
| **Caserne** | 1 | 1 | 1 soldat = 1 PV | 50 | 1, 2, 3 | Fantassin, bouclier |
| **Mine d'or** | 10 | 0 | 1 soldat = 1 PV | 20 | 0 | Aucun |
| **Forteresse** | 15 | 0,5 | 2 soldats = 1 PV | 70 | 1, 2, 3 | Chevalier, fantassin |
| **Campement** | 25 | 1 | 1 soldat = 2 PV | 35 | 1, 2, 3 | Coureur, éclaireur |
| **Archers** | 30 | 0,4 | 1 soldat = 1 PV | 40 | 1, 2, 2 | Fantassin |
| **Canon** | 45 | 0,4 | 1 soldat = 1 PV | 40 | 1, 2, 2 | Fantassin |
| **Soin** | 60 | 0,6 | 1 soldat = 1 PV | 30 | 4, 4, 4 | Soigneur |
| **Piège** | 75 | (comme une caserne) | 1 soldat = 1 PV | 50 | 1, 2, 3 | Fantassin |
| **Géante** | 120 | 1,5 | 1 soldat = 1 PV | 250 | 2, 3, 4 | Tous sauf le soigneur |

### Les tours d'attaque

- **Archers :** tirent des flèches sur les soldats ennemis dans leur cercle de portée, même s'ils attaquent une autre tour. Elles n'attaquent pas les tours. Portée de 170, 220 ou 270 selon le niveau, 1 flèche par seconde.
- **Canon :** tire des boulets en arc sur les tours ennemies à portée (230, 290 ou 350) et leur retire 2 PV toutes les 3,2 secondes. Il n'attaque pas les soldats.
- Le cercle de portée s'affiche quand on sélectionne la tour (menu rond ou fiche d'info).

### Les tours spéciales

- **Piège :** ressemble à une caserne neutre, même dans sa fiche d'info. Une petite marque rouge au-dessus de la porte permet de la repérer. Quand un soldat qui combat arrive dessus, elle explose et détruit jusqu'à 8 soldats qui arrivent, puis devient une caserne neutre normale.
- **Soin :** soigne toutes les tours alliées dans sa portée (210), à 0,5 PV par seconde. Elle peut être reliée à 4 tours alliées : ses lignes envoient des soigneurs, qui rendent 1,5 PV au lieu d'attaquer. Ses lignes sont vertes.
- **Géante :** capacité énorme et presque tous les soldats, mais elle prend double dégât des canons. Rare : au plus une par carte, à peu près une carte sur dix.

### Sur les cartes

Le générateur place ces types de plus en plus souvent au fil des niveaux, seulement une fois débloqués. Les ennemis ne commencent avec des types variés qu'à partir du niveau 80. Le joueur démarre toujours avec une caserne.

### Précisions choisies pendant le développement

Ces points n'étaient pas précisés dans la demande. Ils peuvent changer.

- **Tours neutres :** une tour d'archers ou un canon neutre ne tire pas. Il faut d'abord le capturer. Le canon ne vise pas non plus les tours neutres.
- **Limite du canon :** un boulet ne peut pas achever une tour : il s'arrête à 1 PV. Il faut des soldats pour la capturer, sinon elle changerait de camp avec ses défenseurs encore dedans.
- **Renforcement :** il réduit aussi les dégâts des boulets.
- **Éclaireurs et soigneurs :** ils ne déclenchent pas un piège.

## 6. Améliorations

Chaque tour a **6 points d'amélioration** au total, à répartir librement entre 3 statistiques (par exemple 3-2-1, 1-5-0 ou 2-2-2).

| Statistique | Effet d'un point |
|-------------|------------------|
| **Renforcement** | +25 % des PV de base, et +25 % de soldats ennemis nécessaires pour retirer des PV |
| **Production** | +30 % de soldats par seconde (+30 % d'or sur une mine) |
| **Capacité** | +20 % de la capacité de base. Une tour pleine arrête de produire |

- **Prix :** chaque point coûte de l'or de partie, 1,5 fois plus cher que le précédent sur cette tour. Sur une caserne : 5, 8, 11, 17, 25, puis 38 or.
- **Menu rond :** toucher une de mes tours ouvre un menu autour d'elle, avec les 3 améliorations, leur prix et leur effet. Le jeu continue pendant ce temps.
- **Apparence :** murs plus épais pour le renforcement, cheminées puis atelier pour la production, tour plus haute et plus large, puis réserves, pour la capacité. Une belle animation accompagne chaque achat.

### Précisions choisies pendant le développement

Ces points n'étaient pas précisés dans la demande. Ils peuvent changer.

- **Capture :** une tour capturée perd toutes ses améliorations.
- **Renfort :** le point de renforcement ajoute aussi ses PV à la tour tout de suite.
- **Tours trop remplies :** une tour ne perd jamais de soldats à cause de sa capacité : si elle commence avec plus de soldats que prévu, sa capacité monte à ce nombre. Les renforts au-delà de la capacité sont perdus.
- **Ordis :** les ordis moyens et forts dépensent aussi leur or. Le défenseur renforce, le rusé augmente la capacité, les autres la production.

## 7. Argent

Il y a deux sortes d'argent.

### L'or de partie

- Gagné pendant un niveau, il sert à améliorer les tours pendant ce niveau, puis disparaît.
- Chaque tour rapporte un tout petit peu d'or : 0,1 par seconde. Une mine d'or en rapporte 1 par seconde.
- Le joueur démarre chaque niveau avec 5 or (20 au niveau 10 du tutoriel).

### Les pièces

- Gagnées à la fin de chaque niveau gagné : 10 pièces par étoile, le double sur un boss.
- Sauvegardées, elles se dépensent dans la Boutique du menu.

## 8. Décors

*À compléter*

## 9. Obstacles

*À compléter*

## 10. Brouillard

*À compléter*

## 11. Avions

*À compléter*

## 12. Niveaux

Il y a **1000 niveaux**. Ils ne sont pas écrits un par un : un générateur fabrique chaque niveau à partir de son numéro, avec un hasard à graine. Le niveau 57 est donc toujours le même.

### Tutoriel (niveaux 1 à 10)

Faits à la main, avec une main animée et une bulle de conseil : tracer une ligne, soldats et PV, attaquer, niveaux des tours, deux lignes, couper une ligne, renforts, compter double, combat sur une ligne, deux ennemis.

### Difficulté

Elle monte doucement avec le numéro : nombre de tours (8 à 22, plus 2 pour un boss), soldats de départ, taille de la carte et donc distance entre les tours, force des ordis, nombre d'équipes ennemies (2 à partir du niveau 60, 3 à partir de 250, 4 à partir de 600, 5 à partir de 850).

### Vérifications du générateur

Un niveau est refusé, et refait avec une autre graine, si des tours se chevauchent, si une tour sort de la carte, si un ennemi démarre trop près du joueur, ou si aucune tour neutre n'est à la portée du joueur.

### Boss

Tous les 50 niveaux, un niveau « boss » : un seul ennemi, un peu plus fort que d'habitude, avec une tour couronnée qui a beaucoup de soldats et de PV et qui produit 1,5 fois plus vite.

### Étoiles

3 étoiles si je gagne vite, 2 en temps moyen, 1 si je gagne lentement. Les temps sont propres à chaque niveau, et le meilleur score est gardé. La vitesse ×2 ne change pas le calcul : le temps compté est celui du jeu.

### Carte des niveaux

Un chemin qui serpente, par pages de 50 niveaux. Les niveaux se débloquent un par un, avec les étoiles affichées.

### Réglages prévus pour plus tard

Le générateur a déjà des réglages vides : décor, obstacles, brouillard.

## 13. Ordis

### Force

Chaque ordi a une **force de 1 à 10**, choisie par le générateur selon le numéro du niveau. Il joue toutes les **2 à 3 secondes**.

Sa couleur montre sa force, pour toutes les équipes (rouge, jaune, vert, orange, violet) : très pâle = ordi nul, très foncée et intense = ordi très fort.

| Force | Catégorie | Comportement |
|-------|-----------|--------------|
| 1 à 3 | Faible | Attaque au hasard, oublie souvent de se défendre |
| 4 à 7 | Moyen | Prend les tours neutres proches, attaque les tours faibles, se défend |
| 8 à 10 | Fort | Attend d'avoir assez de soldats, attaque les tours qui se vident, attaque par plusieurs côtés à la fois, change de cible selon la situation |

### Personnalités

- **L'agressif :** attaque plus tôt et cherche les tours ennemies avant les neutres, mais se défend moins.
- **Le défenseur :** attend une plus grosse marge avant d'attaquer et se défend toujours.
- **Le rusé :** profite des tours déjà occupées à se battre contre quelqu'un d'autre.

### Plusieurs ennemis

Dans certains niveaux, plusieurs équipes ennemies s'affrontent : elles m'attaquent, mais s'attaquent aussi entre elles.

### Précisions choisies pendant le développement

Ces points n'étaient pas précisés dans la demande. Ils peuvent changer.

- **Priorités des ordis moyens et forts :** ils se défendent d'abord. Ensuite, ils capturent les tours neutres puis attaquent (l'ordre inverse pour l'agressif).
- **Se défendre :** la tour attaquée riposte vers la tour qui l'attaque si elle a au moins 3 soldats. Sinon, une tour voisine ayant au moins 5 soldats envoie des renforts.
- **Peut battre :** l'ordi compte les soldats, les PV et les niveaux, et peut réunir plusieurs tours pour une même attaque. Il ne compte que les soldats qu'il a vraiment, même si envoyer coûte moins cher.
- **Couper ses lignes :** il coupe une ligne quand assez de soldats sont partis, ou quand l'attaque ne peut plus réussir.
- **Effet de la force :** plus elle est haute, plus il fait d'actions par tour (1 à force 3, 3 à force 10). Plus elle est basse, plus il prend parfois son deuxième meilleur choix.
- **Pour laisser sa chance au joueur :** les ordis ne l'attaquent pas pendant les 20 premières secondes (sauf pour riposter), se méfient davantage de lui, préfèrent leurs voisins et évitent une tour déjà visée par une autre équipe.

### Comment les ordis utilisent les nouveautés

- **Tours qui tirent :** ils préfèrent capturer les tours neutres qui tirent et s'en prennent en priorité aux tours ennemies qui tirent.
- **Éviter les archers :** les ordis moyens et forts comptent les soldats qu'ils perdront sous les flèches sur le chemin, et peuvent renoncer à une attaque.
- **Canons :** ils préfèrent attaquer une cible déjà sous leurs propres canons.
- **Pièges :** à partir de la force 6, ils repèrent les pièges et les évitent. Les plus faibles tombent dedans.
- **Soin :** leurs tours soin relient leur tour la plus abîmée.
- **Soldats :** ils choisissent des boucliers contre les archers, des chevaliers quand ils sont forts, et des coureurs s'ils le peuvent.

## 14. Types de soldats

Toutes les valeurs sont rangées dans `js/donnees-soldats.js`. Les soldats sont dessinés en détail et animés : ils marchent, se penchent pour frapper et tombent à la renverse.

| Type | Débloqué au niveau | Vitesse | Force au combat | PV retirés | Flèches encaissées | Coût d'envoi |
|------|------|------|------|------|------|------|
| **Fantassin** | 1 | ×1 | 1 | 1 | 1 | ×1 |
| **Chevalier** | 15 | ×0,6 | 2 | 2 | 2 | ×2 |
| **Coureur** | 25 | ×1,6 | 0,5 | 1 | 1 | ×0,6 |
| **Bouclier** | 35 | ×0,8 | 1 | 1 | 5 | ×1,5 |
| **Éclaireur** | 52 | ×1,8 | Ne combat pas | 0 | 1 | ×0,5 |
| **Soigneur** | 60 | ×1 | Ne combat pas | 0 (rend 1,5 PV) | 1 | ×1 |

- Chaque type de tour ne peut produire que certains soldats (voir le tableau des tours).
- Quand une tour peut en produire plusieurs, je choisis lequel dans son menu rond.
- L'éclaireur servira à révéler le brouillard. Pour l'instant, il traverse les combats et disparaît en arrivant chez l'ennemi.

### Précisions choisies pendant le développement

- **Compteur de la tour :** il reste un simple nombre, sans types. C'est le choix au moment de l'envoi qui décide du soldat qui part.
- **Coût d'envoi :** il ne compte que pour les attaques. Un renfort coûte toujours un soldat entier et ajoute 1 au compteur.
- **Le soigneur :** c'est un sixième type, ajouté pour montrer ce que la tour soin envoie dans ses lignes.

## 15. Déblocages et collection

- Les types de tours et de soldats apparaissent au fil des niveaux. Avant leur niveau de déblocage, ils ne sont sur aucune carte.
- Quand une victoire débloque un type, un écran le présente, avec le modèle 3D qui tourne, puis l'écran de fin s'affiche.
- Le niveau suivant sert à l'apprendre : le joueur reçoit une tour de ce type (ou une tour neutre juste à côté pour la mine et le piège), et un conseil explique à quoi elle sert.
- **Collection :** un écran du menu avec tous les types de tours et de soldats, leurs statistiques, et un cadenas sur ceux pas encore débloqués.
- Une sauvegarde plus ancienne ne présente que les nouveautés à venir, pas tout ce qui est déjà accessible.

## 16. Règles des liens

Le nombre de lignes dépend des deux tours reliées :

- **Ce qu'une tour peut envoyer :** dans `js/donnees-tours.js` (lignes par niveau).
- **Ce qu'une tour peut recevoir :** dans le tableau de `js/donnees-liens.js`, selon le type qui envoie et le type qui reçoit. Par exemple, une forteresse ne reçoit qu'une ligne de soin à la fois, une tour normale deux, une tour géante quatre.

Une ligne impossible n'est pas créée, et les pointillés du tracé deviennent rouges. Ces limites comptent les lignes d'une même équipe, venant de tours d'un même type.

## 17. Boutique

Un écran du menu pour dépenser ses pièces en skins. Ils ne changent que l'apparence, et seulement pour les tours et soldats du joueur. Tout est rangé dans `js/donnees-skins.js`.

| Skins de tours | Prix | | Skins de soldats | Prix |
|------|------|---|------|------|
| Classique | Gratuit | | Classique | Gratuit |
| Sable | 150 | | Bronze | 120 |
| Ombre | 300 | | Ombre | 280 |
| Glace | 500 | | Doré | 700 |
| Royal | 900 | | | |
