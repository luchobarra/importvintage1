export type ProductImage = {
  id: string;
  image_url: string;
  image_path: string;
  position: number;
};

export type Product = {
  id: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  price: number;
  description: string | null;
  status: "available";
  product_images: ProductImage[];
};

export type ProductImageInput = {
  imageUrl: string;
  imagePath: string;
  position: number;
};

