import { MetadataRoute } from 'next'
import { getLocations } from '@/lib/firestore-admin';
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locations = await getLocations(); // Get only active locations
  const siteUrl = ''; // Gunakan string kosong untuk URL relatif

  const locationEntries: MetadataRoute.Sitemap = locations.map(({ id }) => ({
    url: `${siteUrl}/cave/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
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
    ...locationEntries,
  ]
}
