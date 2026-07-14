export interface Artwork {
  id: string;
  title: string;
  artist: string;
  category: string;
  image: string;
  medium?: string;
  year?: string;
  description?: string;
  dimensions?: string;
  edition?: string;
  availability?: string;
  price?: number;
  // Added for backend integration (optional to stay backward compatible).
  slug?: string;
  status?: string;
  images?: string[];
  featured?: boolean;
}
