import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  preload?: boolean;
  sizes?: string;
};

export function BrandLogo({ className, preload, sizes }: BrandLogoProps) {
  return (
    <Image
      alt="Retro Campus"
      className={className}
      fetchPriority={preload ? "high" : undefined}
      height={816}
      loading={preload ? "eager" : undefined}
      sizes={sizes}
      src="/brand/retro-campus-logo.png"
      unoptimized
      width={720}
    />
  );
}
