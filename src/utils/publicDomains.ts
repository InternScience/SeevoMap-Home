export interface PublicDomainGroup {
  key: string;
  label: string;
  domains: string[];
  colorDomain: string;
}

export const PUBLIC_DOMAIN_GROUPS: PublicDomainGroup[] = [
  {
    key: "information_science",
    label: "Information Science",
    domains: ["information_science", "pretraining", "posttraining", "model_compression"],
    colorDomain: "pretraining",
  },
  {
    key: "chemistry",
    label: "Chemistry",
    domains: ["chemistry"],
    colorDomain: "chemistry",
  },
  {
    key: "life_science",
    label: "Life Science",
    domains: ["life_science", "life_sciences", "neuroscience"],
    colorDomain: "life_sciences",
  },
  {
    key: "physics",
    label: "Physics",
    domains: ["physics"],
    colorDomain: "physics",
  },
  {
    key: "mathematics",
    label: "Mathematics",
    domains: ["mathematics"],
    colorDomain: "mathematics",
  },
  {
    key: "medicine",
    label: "Medicine",
    domains: ["medicine"],
    colorDomain: "medicine",
  },
  {
    key: "earth_space",
    label: "Earth & Space",
    domains: ["earth_space", "earth_science", "astronomy"],
    colorDomain: "earth_space",
  },
  {
    key: "engineering",
    label: "Engineering",
    domains: ["engineering", "energy_systems", "materials_science"],
    colorDomain: "engineering",
  },
  {
    key: "economics",
    label: "Economics",
    domains: ["economics"],
    colorDomain: "economics",
  },
];

export function getPublicDomainGroup(rawDomain: string): PublicDomainGroup | null {
  return PUBLIC_DOMAIN_GROUPS.find((group) => group.domains.includes(rawDomain)) || null;
}

export function getPublicDomainLabel(rawDomain: string): string {
  return getPublicDomainGroup(rawDomain)?.label || rawDomain.replace(/_/g, " ");
}

export function getPublicDomainColorDomain(rawDomain: string): string {
  return getPublicDomainGroup(rawDomain)?.colorDomain || rawDomain;
}
