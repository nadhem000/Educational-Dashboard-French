# Révisions Tunisie — Programme de révision 4ᵉ année secondaire

Site statique de révision pour le Baccalauréat tunisien.  
Il contient des leçons interactives de grammaire, conjugaison, orthographe, expression écrite et étude de texte, organisées sur 8 semaines.

## Structure du projet
- `index.html` → page d’accueil et choix du niveau
- `revision.html` → programme complet des 8 semaines
- `semaineX-*.html` → leçons hebdomadaires (grammaire, conjugaison, orthographe, etc.)
- `ED-French-header.html` / `ED-French-footer.html` → composants réutilisables
- `ED-French-ini.js` → script d’initialisation (thème sombre, injection header/footer)
- `sw.js` → service worker pour le cache hors‑ligne
- `manifest.json` → configuration PWA
- `netlify.toml` → déploiement Netlify

## Utilisation locale
Ouvrir `index.html` dans un navigateur.  
Pour les fonctionnalités PWA, lancer un serveur local (ex : `npx serve .`) et accéder à l’URL.

## Déploiement
Le site est prévu pour être hébergé sur **GitHub Pages** et **Netlify**.  
Le fichier `netlify.toml` est déjà configuré. Pour GitHub Pages, il suffit de pousser le dossier sur la branche `main`.

## Auteur
Développé par Mejri Ziad.
