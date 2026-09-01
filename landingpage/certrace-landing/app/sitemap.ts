import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://certrace.co";

  const routes = [
    "",
    "/pricing",
    "/backlog",
    "/solutions/exporters",
    "/solutions/importers",
    "/solutions/legal-compliance",
    "/solutions/suppliers",
    "/privacy",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
