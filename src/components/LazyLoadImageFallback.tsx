import React, { useEffect, useState } from "react";
import {
  LazyLoadImage,
  LazyLoadImageProps,
} from "react-lazy-load-image-component";
import { getIcon } from "../bucket";

export function FallbackLazyImage({ src, ...props }: LazyLoadImageProps) {
  const [needsFallback, setNeedsFallback] = useState(false);

  useEffect(() => {
    setNeedsFallback(false);
  }, [src]);

  return (
    <LazyLoadImage
      {...props}
      src={needsFallback ? getIcon("icons/0.webp") : src}
      onError={() => setNeedsFallback(true)}
    />
  );
}
