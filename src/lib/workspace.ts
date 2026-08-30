export type Iteration = {
  id: number;
  request: string;
  summary: string;
  status: string;
  created_at: string;
};

export type Project = {
  id: number;
  name: string;
  repo: string;
};

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export function workspaceApiUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

export const seedIterations: Iteration[] = [
  { id: 1, request: "Make the hero section feel more alive", summary: "Added a kinetic product demo with a clearer call to action.", status: "complete", created_at: "" },
  { id: 2, request: "Add a pricing section with three tiers", summary: "Created responsive pricing cards and highlighted the Pro tier.", status: "complete", created_at: "" },
  { id: 3, request: "Make the visual language warmer", summary: "Adjusted palette, type scale, and added a softer editorial rhythm.", status: "complete", created_at: "" },
];
