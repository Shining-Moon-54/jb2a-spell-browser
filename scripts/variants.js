/*
 * JB2A Spell Browser: frei konfigurierbare Effektvarianten
 * Foundry V14 / Sequencer 4.x
 * Keine eigenen Medien, nur referenzierte JB2A-Datenbankpfade.
 */
const ID = "jb2a-spell-browser";
const SETTING = "spellVariants";
const PREFIX = "jbs_vfx_";
const MAX_LAYERS = 24;

Hooks.once("init", () => {
  game.settings.register(ID, SETTING, {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
});

export function storedVariants(spellKey) {
  const store = game.settings.get(ID, SETTING) || {};
  const variants = store[spellKey];
  return Array.isArray(variants) ? structuredClone(variants) : [];
}

export async function writeVariants(spellKey, variants) {
  if (!game.user.isGM) throw new Error("Nur die Spielleitung darf Effektvarianten ändern.");
  const store = game.settings.get(ID, SETTING) || {};
  await game.settings.set(ID, SETTING, {
    ...store, [spellKey]: structuredClone(variants)
  });
}

export function availableEffects() {
  const db = globalThis.Sequencer?.Database;
  const paths = db?.flattenedEntries || [];
  return [...new Set(paths.filter(p => typeof p === "string" && p.startsWith("jb2a.")))].sort();
}

export function validEffect(path) {
  if (!path || typeof path !== "string" || !path.startsWith("jb2a.")) return false;
  const db = globalThis.Sequencer?.Database;
  return !!(db?.entryExists(path) || availableEffects().some(p => p.startsWith(path + ".")));
}

export function effectRow(path = "", role = "target") {
  return {path, role, delay: 0, scale: 1, clip: role === "area"};
}

export function makeDefaultVariant(spell, mapping) {
  const config = mapping || {};
  const isArea = ["area", "fireball"].includes(config.mode);
  const mode = config.mode === "fireball" || config.mode === "missiles" ||
    ["projectile", "line", "cone"].includes(config.mode)
    ? "projectile"
    : config.mode === "wall" ? "wall"
    : config.mode === "teleport" ? "teleport"
    : isArea ? "area" : "point";
  const effects = [];
  if (config.beam) effects.push(effectRow(config.beam, "travel"));
  if (config.path) {
    const role = config.mode === "teleport" ? "origin"
      : config.mode === "wall" ? "travel"
      : isArea ? "area"
      : mode === "projectile" ? "travel" : "target";
    effects.push(effectRow(config.path, role));
    if (role === "origin") effects.push(effectRow(config.path, "target"));
  }
  if (config.impact && validEffect(config.impact)) effects.push(effectRow(config.impact, "target"));
  return {
    id: foundry.utils.randomID(),
    name: "Neue Variante",
    mode,
    radius: Number(config.size || spell.size || 10),
    persistent: !!config.persistent,
    effects
  };
}

export function validateVariant(variant) {
  if (!variant || !["point", "projectile", "area", "wall", "teleport"].includes(variant.mode)) {
    throw new Error("Ungültige Platzierungsart.");
  }
  variant.name = String(variant.name || "").trim();
  if (!variant.name || variant.name.length > 80) throw new Error("Variantenname muss 1 bis 80 Zeichen haben.");
  if (!Array.isArray(variant.effects) || !variant.effects.length || variant.effects.length > MAX_LAYERS) {
    throw new Error("Eine Variante benötigt zwischen 1 und 24 Effekte.");
  }
  const radius = Number(variant.radius);
  if (!Number.isFinite(radius) || radius < 1 || radius > 500) throw new Error("Radius muss zwischen 1 und 500 Fuß liegen.");
  variant.radius = radius;
  variant.persistent = !!variant.persistent;
  variant.effects = variant.effects.map((effect, i) => {
    const path = String(effect.path || "").trim();
    if (!validEffect(path)) throw new Error("JB2A-Effekt " + (i + 1) + " fehlt: " + path);
    if (!["origin", "travel", "target", "area"].includes(effect.role)) throw new Error("Ungültige Effektposition.");
    const delay = Number(effect.delay);
    const scale = Number(effect.scale);
    if (!Number.isFinite(delay) || delay < 0 || delay > 30000) throw new Error("Verzögerung muss zwischen 0 und 30000 ms liegen.");
    if (!Number.isFinite(scale) || scale < 0.1 || scale > 10) throw new Error("Größenfaktor muss zwischen 0.1 und 10 liegen.");
    return {path, role: effect.role, delay, scale, clip: !!effect.clip};
  });
  return variant;
}

export async function runVariant(spell, variant, persistent) {
  const cfg = validateVariant(structuredClone(variant));
  if (!game.user.isGM || !canvas.ready || !globalThis.Sequencer?.Crosshair) {
    ui.notifications.warn("Eine aktive Szene und Spielleiterrechte sind erforderlich.");
    return;
  }
  const gd = Number(canvas.scene.grid.distance) || 5;
  const gs = Number(canvas.grid.size) || 100;
  const px = feet => feet * gs / gd;
  const choose = async (message, radius = gd / 2) => {
    ui.notifications.info(spell.name + ": " + message);
    const result = await Sequencer.Crosshair.show({
      t: "circle", distance: radius,
      gridHighlight: radius > gd,
      label: {text: message}
    });
    return result ? {x: result.x, y: result.y} : null;
  };
  let start, target;
  if (["projectile", "wall", "teleport"].includes(cfg.mode)) {
    start = await choose("1/2 – Ausgangspunkt");
    if (!start) return;
    target = await choose("2/2 – Zielpunkt");
    if (!target) return;
  } else {
    target = await choose("Zielpunkt wählen", cfg.mode === "area" ? cfg.radius : gd / 2);
    if (!target) return;
    start = target;
  }

  // Projektile und gerade Wände stoßen an den nächstgelegenen blockierenden Punkt.
  if (cfg.mode === "projectile") {
    try {
      const hit = foundry.canvas.geometry.ClockwiseSweepPolygon.testCollision(
        start, target, {type: "move", mode: "closest"}
      );
      if (hit && Number.isFinite(hit.x) && Number.isFinite(hit.y)) {
        const dx = target.x - start.x, dy = target.y - start.y, length = Math.hypot(dx, dy);
        target = length ? {x: hit.x - dx / length * 3, y: hit.y - dy / length * 3} : target;
      }
    } catch (err) { console.warn(ID, "Wandkollision nicht verfügbar:", err); }
  }

  const seq = new Sequence();
  for (let i = 0; i < cfg.effects.length; i++) {
    const item = cfg.effects[i];
    const effect = seq.effect().file(item.path);
    const position = item.role === "origin" ? start : target;
    if (item.role === "travel") {
      const stretch = cfg.mode === "wall" ? {onlyX: true} : {};
      effect.atLocation(start).stretchTo(target, stretch);
    } else if (item.role === "area") {
      effect.atLocation(position).size(px(cfg.radius * 2) * item.scale);
    } else {
      effect.atLocation(position).size(gs * 1.5 * item.scale);
    }
    if (item.role === "travel" && item.scale !== 1) effect.scale(item.scale);
    if (item.clip && item.role !== "travel") {
      effect.constrainedByWalls({
        type: "move",
        origin: position,
        radius: item.role === "area" ? px(cfg.radius) : gs * 2 * item.scale
      });
    }
    if (item.delay) effect.delay(item.delay);
    if (persistent) {
      effect.persist().name(PREFIX + spell.slug + "__" + foundry.utils.randomID());
    }
    // Projektile beenden, bevor ein danach platzierter Einschlag erscheint.
    if (item.role === "travel" && i < cfg.effects.length - 1 &&
        cfg.effects[i + 1].role !== "travel") effect.waitUntilFinished(-100);
  }
  try {
    await seq.play();
    ui.notifications.info(spell.name + ": " + cfg.name + (persistent ? " platziert" : " abgespielt"));
  } catch (err) {
    console.error(ID, "Effektvariante", cfg.name, err);
    ui.notifications.error(spell.name + ": " + (err?.message || String(err)));
  }
}
