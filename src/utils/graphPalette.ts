const DOMAIN_COLORS: Record<string, string> = {
  pretraining: "#639aff",
  posttraining: "#ff7474",
  model_compression: "#ffbf57",
  chemistry: "#56c271",
  life_sciences: "#ef7fb6",
  physics: "#67bff6",
  mathematics: "#b7d95a",
  medicine: "#f18faf",
  earth_space: "#ef9a58",
  engineering: "#a589ff",
  economics: "#54c5ba",
  astronomy: "#b39bff",
  neuroscience: "#7f93ff",
  materials_science: "#61d8c8",
  energy_systems: "#e2c062",
  earth_science: "#f0a66d",
  life_science: "#ef7fb6",
};

function findDomainColor(domain: string): string {
  const normalized = (domain || "").toLowerCase();
  for (const [key, value] of Object.entries(DOMAIN_COLORS)) {
    if (normalized.includes(key)) return value;
  }
  return "#9aa0ae";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value.split("").map((char) => `${char}${char}`).join("")
      : value;
  const int = Number.parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function toRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getGraphDomainColor(domain: string): string {
  return findDomainColor(domain);
}

export function getGraphDomainGlow(domain: string, alpha = 0.34): string {
  return toRgba(findDomainColor(domain), alpha);
}

export function getGraphDomainTint(domain: string, alpha = 0.12): string {
  return toRgba(findDomainColor(domain), alpha);
}

export function getGraphDomainBorder(domain: string, alpha = 0.24): string {
  return toRgba(findDomainColor(domain), alpha);
}
