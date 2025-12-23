import { MetadataRoute } from 'next';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = ''; // Using an empty string for relative URLs, adaptable for any domain.

  // For robustness, especially during build when DB access can be tricky,
  // we are using a static list of essential pages.
  // Dynamic routes like `/cave/[id]` can be added back later if the build environment
  // is guaranteed to have secure database access.
  const staticRoutes = [
    {
      url: siteUrl || '/',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
     {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // If you have a small, fixed number of important locations, you could add them manually:
  // const manualLocationEntries = [
  //   { url: `${siteUrl}/cave/ID_LOKASI_PENTING_1`, lastModified: new Date(), priority: 0.8 },
  //   { url: `${siteUrl}/cave/ID_LOKASI_PENTING_2`, lastModified: new Date(), priority: 0.8 },
  // ];

  return [
    ...staticRoutes,
    // ...manualLocationEntries,
  ];
}
