(function() {
       const cardsData = [
           { id: 'primaire4', title: '4ᵉ année primaire', type: 'coming' },
           { id: 'primaire5', title: '5ᵉ année primaire', type: 'coming' },
           { id: 'primaire6', title: '6ᵉ année primaire', type: 'coming' },
           { id: 'primaire7', title: '7ᵉ année primaire', type: 'coming' },
           { id: 'primaire8', title: '8ᵉ année primaire', type: 'coming' },
           { id: 'primaire9', title: '9ᵉ année primaire', type: 'coming' },
           { id: 'secondaire1', title: '1ʳᵉ année secondaire', type: 'coming' },
           { id: 'secondaire2', title: '2ᵉ année secondaire', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Économie'] },
           { id: 'secondaire3', title: '3ᵉ année secondaire', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Mathématiques'] },
           { id: 'secondaire4', title: '4ᵉ année secondaire (Bac)', type: 'secondary', sections: ['Section Lettres', 'Section Sciences', 'Section Techniques'] },
           { id: 'revision', title: '📖 Révision générale', type: 'revision', link: 'revision.html' }
       ];
       const grid = document.getElementById('cardGrid');
       if (!grid) return;

       cardsData.forEach(card => {
           const cardEl = document.createElement('div');
           cardEl.className = 'card' + (card.type === 'revision' ? ' revision' : '');
           const header = document.createElement('div');
           header.className = 'card-header';
           header.innerHTML = (card.type === 'revision' ? '⭐ ' : '📘 ') + card.title;
           cardEl.appendChild(header);
           const body = document.createElement('div');
           body.className = 'card-body';
           if (card.type === 'coming') {
               body.innerHTML = '<span class="coming-soon">⏳ Contenu à venir</span>';
           } else if (card.type === 'secondary') {
               body.innerHTML = '<p>Sections disponibles (à venir) :</p>';
               const ul = document.createElement('ul');
               ul.className = 'sections-list';
               card.sections.forEach(sec => {
                   const li = document.createElement('li');
                   li.textContent = sec + ' (prochainement)';
                   ul.appendChild(li);
               });
               body.appendChild(ul);
           } else if (card.type === 'revision') {
               body.innerHTML = `<p>Un programme complet de 8 semaines pour consolider les bases avant le Bac.</p><a href="${card.link}">Accéder au programme →</a>`;
           }
           cardEl.appendChild(body);
           grid.appendChild(cardEl);
       });
   })();
