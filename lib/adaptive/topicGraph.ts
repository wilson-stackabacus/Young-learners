/**
 * Topic tree: prerequisite graph, BFS-based unlock evaluation.
 *
 * A topic is unlocked if it has no prerequisites, or if every prerequisite
 * mastery row for the user is at or above `unlockRating` (default 1100).
 */

export const UNLOCK = {
  rating: 1100,
} as const;

export interface TopicNode {
  id: string;
  slug: string;
  name: string;
  baseRating: number;
  order: number;
  /** Prerequisite topic ids. */
  prereqs: string[];
}

export interface MasteryRow {
  topicId: string;
  rating: number;
  solved: number;
  attempts: number;
}

/** Adjacency list representation. */
export class TopicGraph {
  private byId = new Map<string, TopicNode>();
  private outgoing = new Map<string, string[]>(); // prereq -> [dependents]
  private incoming = new Map<string, string[]>(); // topic -> [prereqs]
  private order: TopicNode[] = [];

  constructor(nodes: TopicNode[]) {
    for (const n of nodes) {
      this.byId.set(n.id, n);
      this.outgoing.set(n.id, []);
      this.incoming.set(n.id, [...n.prereqs]);
    }
    for (const n of nodes) {
      for (const p of n.prereqs) {
        this.outgoing.get(p)!.push(n.id);
      }
    }
    // Topological-ish order: prereqs first, then dependents, stable on `order`.
    this.order = [...nodes]
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .sort((a, b) => depth(this.incoming, a.id) - depth(this.incoming, b.id));
  }

  all(): TopicNode[] {
    return this.order;
  }

  get(id: string): TopicNode | undefined {
    return this.byId.get(id);
  }

  /**
   * Return topics unlocked for a user given their mastery rows.
   * A topic is unlocked when every prerequisite's mastery rating >= UNLOCK.rating,
   * OR when the topic has no prerequisites.
   */
  unlocked(masteries: MasteryRow[]): Set<string> {
    const ratingByTopic = new Map(masteries.map((m) => [m.topicId, m.rating]));
    const unlocked = new Set<string>();
    for (const n of this.order) {
      const prereqs = this.incoming.get(n.id)!;
      const ok = prereqs.every(
        (p) => (ratingByTopic.get(p) ?? 0) >= UNLOCK.rating,
      );
      if (ok) unlocked.add(n.id);
    }
    return unlocked;
  }

  /** Return the next topic that would be unlocked if a given mastery bumps to `proposedRating`. */
  wouldUnlock(masteries: MasteryRow[], topicId: string, proposedRating: number): string[] {
    const next = new Map(masteries.map((m) => [m.topicId, m.rating]));
    next.set(topicId, proposedRating);
    const currentlyUnlocked = this.unlocked(masteries);
    const after = this.unlocked([...next.values()].map((r) => ({
      topicId: [...next.entries()].find(([, v]) => v === r)![0],
      rating: r,
      solved: 0,
      attempts: 0,
    })));
    const newly = [...after].filter((id) => !currentlyUnlocked.has(id));
    return newly;
  }

  /** Shortest path in prerequisite counts from `from` to `to`. Returns -1 if unreachable. */
  prereqDistance(from: string, to: string): number {
    if (from === to) return 0;
    const visited = new Set<string>([from]);
    const queue: Array<[string, number]> = [[from, 0]];
    while (queue.length) {
      const [cur, d] = queue.shift()!;
      for (const next of this.outgoing.get(cur) ?? []) {
        if (visited.has(next)) continue;
        if (next === to) return d + 1;
        visited.add(next);
        queue.push([next, d + 1]);
      }
    }
    return -1;
  }
}

function depth(incoming: Map<string, string[]>, id: string, cache = new Map<string, number>()): number {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;
  const prereqs = incoming.get(id) ?? [];
  if (prereqs.length === 0) {
    cache.set(id, 0);
    return 0;
  }
  const d = 1 + Math.max(...prereqs.map((p) => depth(incoming, p, cache)));
  cache.set(id, d);
  return d;
}
