/* Team roster as queries — see lib/workspaces-query.ts for why the
   localStorage-backed stores get staleTime 0. */

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadTeam } from "./team-store";

const KEY = ["team"] as const;

export function useTeam() {
  return useQuery({ queryKey: KEY, queryFn: loadTeam, staleTime: 0 });
}

/** Same escape hatch as useInvalidateWorkspaces — addTeamMember and
    removeTeamMember still write around the query layer. */
export function useInvalidateTeam(): () => void {
  const client = useQueryClient();
  return () => void client.invalidateQueries({ queryKey: KEY });
}
