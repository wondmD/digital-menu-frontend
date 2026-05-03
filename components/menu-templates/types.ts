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
  is_featured?: boolean;
  is_popular?: boolean;
  is_signature?: boolean;
  chef_pick?: boolean;
  chef_choice?: boolean;
  is_chef_pick?: boolean;
  freshness?: string;
  freshly_made?: string | boolean;
  is_fresh?: boolean;
  discounted_price?: number;
  original_price?: number;
  discount?: {
    id?: string;
    name?: string;
    code?: string;
    discount_type?: string;
    discount_value?: number;
    label?: string;
    savings_amount?: number;
  };
  rating?: number;
  rating_count?: number;
  prep_time?: string;
  estimated_prep_time?: string;
  prep_minutes?: number | string;
  service_time?: string;
  calories?: number | string;
  calogy?: number | string;
  spice_level?: number | string;
  allergens?: string[] | string;
  dietary_tags?: string[] | string;
  ingredients?: string[] | string;
  chef_notes?: string;
  notes?: string;
  kitchen_notes?: string;
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
  template_number?: number | string;
  public_template?: number | string;
};

export type TemplateTheme = {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
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
  theme?: TemplateTheme;
}
