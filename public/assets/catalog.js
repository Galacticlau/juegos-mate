(() => {
  const cards = [...document.querySelectorAll('[data-resource]')];
  const filters = [...document.querySelectorAll('.pc-filter')];
  const search = document.getElementById('resource-search');
  const count = document.getElementById('resource-count');
  const empty = document.getElementById('resource-empty');
  let category = 'all';
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function update() {
    const query = normalize(search.value.trim());
    let visible = 0;
    for (const card of cards) {
      const matches = (category === 'all' || card.dataset.categories.split(' ').includes(category)) && normalize(card.textContent).includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = visible === cards.length ? '3 juegos + 1 herramienta' : `${visible} ${visible === 1 ? 'recurso' : 'recursos'}`;
    empty.hidden = visible > 0;
  }
  for (const button of filters) button.addEventListener('click', () => {
    category = button.dataset.filter;
    for (const other of filters) other.setAttribute('aria-pressed', String(other === button));
    update();
  });
  search.addEventListener('input', update);
  document.getElementById('clear-search').addEventListener('click', () => {
    search.value = '';
    filters.find(button => button.dataset.filter === 'all').click();
    search.focus();
  });
  document.getElementById('surprise').addEventListener('click', () => {
    const games = cards.filter(card => card.dataset.game === 'true');
    const game = games[Math.floor(Math.random() * games.length)];
    location.assign(game.querySelector('a').href);
  });
})();
