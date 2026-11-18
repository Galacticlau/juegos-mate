const die = ["1", "2", "3", "4", "5", "6"];
const coins = ["(C, C)", "(C, S)", "(S, C)", "(S, S)"];
const coinLegend = "C significa cara y S significa sello. El primer lugar del par corresponde al primer lanzamiento.";

const missions = [
  {
    prompt: "Lanzas un dado de seis caras. Construye Ω con todos los resultados posibles.",
    space: die,
    options: ["4", "0", "2", "7", "6", "3", "5", "1"]
  },
  {
    prompt: "Lanzas una moneda dos veces. Construye Ω con todos los pares ordenados posibles.",
    legend: coinLegend,
    space: coins,
    options: ["C", "(C, S)", "(S, C)", "(C, S, S)", "(C, C)", "S", "(S, S)", "(C, S, C)"]
  },
  {
    prompt: "Lanzas dos dados con caras numeradas del 1 al 4. Construye Ω con todas las sumas posibles.",
    space: ["2", "3", "4", "5", "6", "7", "8"],
    options: ["8", "1", "5", "6", "9", "2", "7", "4", "3"],
    speed: 135
  },
  {
    prompt: "Lanzas un dado de seis caras. Forma el evento A «sale un número mayor que 4».",
    space: die,
    event: { name: "A", results: ["5", "6"] },
    options: ["2", "6", "1", "4", "5", "3"],
    speed: 155
  },
  {
    prompt: "Lanzas una moneda dos veces. Forma el evento B «sale exactamente una cara».",
    legend: coinLegend,
    space: coins,
    event: { name: "B", results: ["(C, S)", "(S, C)"] },
    options: ["(S, S)", "(C, S)", "(C, C)", "(S, C)"],
    speed: 175
  }
];

const byId = id => document.getElementById(id);
const field = byId("field");
const question = byId("question");
const feedback = byId("feedback");
const next = byId("next");
const motion = byId("motion");
const omega = byId("omega");
const eventItems = byId("event-items");
const stages = [byId("stage-one"), byId("stage-two")];
const preference = matchMedia("(prefers-reduced-motion: reduce)");

let index = 0;
let state = "playing";
let paused = preference.matches;
const captured = new Set();
let particles = [];
let frame = 0;
let previousTime = 0;
let width = 0;
let height = 0;

function randomDirection(particle) {
  const angle = Math.random() * Math.PI * 2;
  particle.vx = Math.cos(angle) * particle.speed;
  particle.vy = Math.sin(angle) * particle.speed;
  particle.untilTurn = 0.85 + Math.random() * 1.35;
}

function confine(particle) {
  const maxX = Math.max(0, width - particle.size);
  const maxY = Math.max(0, height - particle.size);
  if (particle.x <= 0) particle.vx = Math.abs(particle.vx);
  if (particle.x >= maxX) particle.vx = -Math.abs(particle.vx);
  if (particle.y <= 0) particle.vy = Math.abs(particle.vy);
  if (particle.y >= maxY) particle.vy = -Math.abs(particle.vy);
  particle.x = Math.max(0, Math.min(maxX, particle.x));
  particle.y = Math.max(0, Math.min(maxY, particle.y));
}

function draw(particle) {
  particle.element.style.transform = `translate(${particle.x}px, ${particle.y}px)`;
}

function placeParticles() {
  if (!particles.length) return;
  width = field.clientWidth;
  height = field.clientHeight;
  const size = particles[0].element.offsetWidth;
  const columns = Math.max(1, Math.min(particles.length, Math.floor(width / (size + 7))));
  const rows = Math.ceil(particles.length / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  particles.forEach((particle, i) => {
    particle.size = size;
    const freeX = Math.max(0, cellWidth - size);
    const freeY = Math.max(0, cellHeight - size);
    particle.x = (i % columns) * cellWidth + freeX * (0.25 + Math.random() * 0.5);
    particle.y = Math.floor(i / columns) * cellHeight + freeY * (0.25 + Math.random() * 0.5);
    confine(particle);
    draw(particle);
  });
}

function separateParticles() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      const fixedA = captured.has(a.value);
      const fixedB = captured.has(b.value);
      if (fixedA && fixedB) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.hypot(dx, dy);
      const minimum = a.size + 4;
      if (distance >= minimum) continue;

      const nx = distance ? dx / distance : 1;
      const ny = distance ? dy / distance : 0;
      const push = (minimum - distance) / (Number(!fixedA) + Number(!fixedB));

      if (!fixedA) {
        a.x -= nx * push;
        a.y -= ny * push;
        a.vx = -nx * a.speed;
        a.vy = -ny * a.speed;
      }
      if (!fixedB) {
        b.x += nx * push;
        b.y += ny * push;
        b.vx = nx * b.speed;
        b.vy = ny * b.speed;
      }
    }
  }
}

function animate(time) {
  const seconds = previousTime ? Math.min((time - previousTime) / 1000, 0.035) : 0;
  previousTime = time;
  for (const particle of particles) {
    if (captured.has(particle.value)) continue;
    particle.untilTurn -= seconds;
    if (particle.untilTurn <= 0) randomDirection(particle);
    particle.x += particle.vx * seconds;
    particle.y += particle.vy * seconds;
    confine(particle);
  }
  separateParticles();
  for (const particle of particles) {
    confine(particle);
    draw(particle);
  }
  frame = requestAnimationFrame(animate);
}

function updateMotion() {
  cancelAnimationFrame(frame);
  previousTime = 0;
  motion.textContent = paused ? "Activar movimiento" : "Pausar movimiento";
  if (particles.length && !paused && state === "playing" && !document.hidden) {
    frame = requestAnimationFrame(animate);
  }
}

function writeSet(container, values) {
  container.replaceChildren();
  values.forEach((value, i) => {
    if (i) container.append(" ");
    const item = document.createElement("span");
    item.textContent = value + (i < values.length - 1 ? "," : "");
    container.append(item);
  });
}

function updateProgress() {
  const stage = missions[index]?.event ? 1 : 0;
  const finished = index === missions.length;
  byId("progress").textContent = finished
    ? `${missions.length} misiones resueltas`
    : `Misión ${index + 1} de ${missions.length}`;
  stages.forEach((element, i) => {
    element.classList.toggle("done", finished || i < stage);
    if (!finished && i === stage) element.setAttribute("aria-current", "step");
    else element.removeAttribute("aria-current");
  });
}

function finishRound(result, message) {
  state = result;
  const lost = result === "lost";
  field.classList.toggle("lost", lost);
  feedback.className = lost ? "incorrect" : "correct";
  feedback.textContent = message;

  if (lost) next.textContent = "Reintentar misión";
  else if (index === missions.length - 1) next.textContent = "Ver resultado";
  else if (!missions[index].event && missions[index + 1].event) next.textContent = "Pasar a la etapa de eventos";
  else next.textContent = "Siguiente misión";

  next.classList.toggle("retry", lost);
  next.hidden = false;
  for (const orb of field.querySelectorAll(".orb")) orb.disabled = true;
  motion.hidden = true;
  updateMotion();
  next.focus({ preventScroll: true });
}

function capture(mission, value, element) {
  if (state !== "playing" || captured.has(value)) return;

  const target = mission.event?.results ?? mission.space;
  const setName = mission.event?.name ?? "Ω";
  if (!target.includes(value)) {
    element.classList.add("wrong");
    finishRound("lost", `Perdiste la ronda. ${value} no pertenece a ${setName}.`);
    return;
  }

  captured.add(value);
  element.classList.add("captured");
  element.setAttribute("aria-pressed", "true");
  writeSet(mission.event ? eventItems : omega, [...captured]);

  if (captured.size === target.length) {
    finishRound("won", mission.event ? `¡Evento ${setName} completo!` : "¡Espacio muestral completo!");
  } else {
    feedback.textContent = `${value} se agregó a ${setName}.`;
  }
}

function render(focusQuestion = false) {
  cancelAnimationFrame(frame);
  state = "playing";
  particles = [];
  captured.clear();
  feedback.textContent = "";
  feedback.className = "";
  field.replaceChildren();
  field.classList.remove("lost");
  next.hidden = true;
  updateProgress();

  const mission = missions[index];
  const moving = Boolean(mission?.speed);
  const event = mission?.event;
  field.classList.toggle("moving", moving);
  field.classList.toggle("finished", !mission);
  field.setAttribute("aria-label", mission ? "Resultados para atrapar" : "Resultado final");
  motion.hidden = !moving;
  byId("sets").hidden = !mission;
  byId("event-row").hidden = !event;
  byId("omega-row").classList.toggle("active", !event);

  if (!mission) {
    question.textContent = "¡Completaste las dos etapas!";
    byId("help").textContent = "Ω contiene todos los resultados posibles del experimento.";
    const summary = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = `${missions.length} de ${missions.length} misiones`;
    const detail = document.createElement("p");
    detail.textContent = "Un evento contiene los resultados de Ω que cumplen una condición.";
    summary.append(title, detail);
    field.append(summary);
  } else {
    question.textContent = mission.prompt;
    const instruction = event
      ? `Ω ya está dado. Atrapa solo los resultados que pertenecen a ${event.name}. Un error termina la ronda.`
      : "Cada acierto se agrega a Ω. Un error termina la ronda.";
    byId("help").textContent = [mission.legend, instruction].filter(Boolean).join(" ");
    writeSet(omega, event ? mission.space : []);
    writeSet(eventItems, []);
    if (event) byId("event-symbol").textContent = event.name;

    for (const value of mission.options) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "orb";
      element.textContent = value;
      element.setAttribute("aria-pressed", "false");
      element.addEventListener("click", () => capture(mission, value, element));
      field.append(element);

      if (moving) {
        const particle = { element, value, x: 0, y: 0, size: 0, speed: mission.speed };
        randomDirection(particle);
        particles.push(particle);
      }
    }
    if (moving) placeParticles();
  }

  updateMotion();
  if (focusQuestion) question.focus();
}

next.addEventListener("click", () => {
  if (state === "playing") return;
  if (state === "won") index++;
  render(true);
});

motion.addEventListener("click", () => {
  paused = !paused;
  updateMotion();
});

byId("reset").addEventListener("click", () => {
  index = 0;
  render(true);
});

preference.addEventListener("change", event => {
  paused = event.matches;
  updateMotion();
});
document.addEventListener("visibilitychange", updateMotion);

new ResizeObserver(() => {
  if (particles.length && (
    field.clientWidth !== width ||
    field.clientHeight !== height ||
    particles[0].element.offsetWidth !== particles[0].size
  )) placeParticles();
}).observe(field);

render();
