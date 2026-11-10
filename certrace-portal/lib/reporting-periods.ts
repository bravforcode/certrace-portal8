"use client";
import { accountStorage } from "./account-storage";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ReportingPeriod = {
  installationId: string;
  year: number;
  createdAt: string;
};

const STORAGE_KEY = "certrace:reporting-periods";
const QUERY_KEY = ["reporting-periods"] as const;

export function listReportingPeriods(): ReportingPeriod[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(
      accountStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is ReportingPeriod =>
        typeof item === "object" &&
        item !== null &&
        typeof item.installationId === "string" &&
        Number.isInteger(item.year) &&
        typeof item.createdAt === "string",
    );
  } catch {
    return [];
  }
}

export function createReportingPeriod(
  installationId: string,
  year: number,
): ReportingPeriod {
  if (
    !installationId.trim() ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  )
    throw new Error("Choose a valid installation and year.");
  const all = listReportingPeriods();
  const existing = all.find(
    (period) =>
      period.installationId === installationId && period.year === year,
  );
  if (existing) return existing;
  const next = { installationId, year, createdAt: new Date().toISOString() };
  accountStorage.setItem(STORAGE_KEY, JSON.stringify([...all, next]));
  return next;
}

export function useReportingPeriods(installationId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, installationId],
    queryFn: () =>
      listReportingPeriods().filter(
        (period) => period.installationId === installationId,
      ),
    staleTime: 0,
  });
}

export function useCreateReportingPeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      installationId,
      year,
    }: {
      installationId: string;
      year: number;
    }) => Promise.resolve(createReportingPeriod(installationId, year)),
    onSuccess: () => void client.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
