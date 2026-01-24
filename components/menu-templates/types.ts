export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: any;
  images?: any[];
  image_url?: string;
  image_urls?: string[];
  category_id: string;
  is_available?: boolean;
  available?: boolean;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  items?: MenuItem[];
};

export type Restaurant = {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  is_published?: boolean;
  image_url?: string | string[];
  public_template?: number | string;
};

export interface TemplateProps {
  hotel: Restaurant;
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  onItemClick: (item: MenuItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  itemsLoading: boolean;
}
