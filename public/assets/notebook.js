(() => {
  const arrangements = ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'];
  const tiles = [...document.querySelectorAll('.nb-letter')];
  let current = 0;
  const arrange = () => {
    const step = 1 + Math.floor(Math.random() * (arrangements.length - 1));
    current = (current + step) % arrangements.length;
    arrangements[current].split('').forEach((letter, i) => { tiles[i].textContent = letter; });
    document.getElementById('arrangement-status').textContent = 'Ahora tienes ' + arrangements[current].split('').join(' · ') + '. ¿Es el mismo orden?';
  };
  document.getElementById('shuffle-letters').addEventListener('click', arrange);
  document.getElementById('reveal-arrangements').addEventListener('click', event => {
    const solution = document.getElementById('arrangements-solution');
    solution.hidden = !solution.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!solution.hidden));
    event.currentTarget.textContent = solution.hidden ? 'Descubrir las posibilidades' : 'Guardar la respuesta';
  });
})();
