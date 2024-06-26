import React, { useEffect } from "react";
import LazyLoad, { ILazyLoadInstance } from "vanilla-lazyload";

declare global {
  interface Document {
    lazyLoadInstance: ILazyLoadInstance;
  }
}

if (!document.lazyLoadInstance) {
  document.lazyLoadInstance = new LazyLoad({
    elements_selector: ".lazy",
  });
}

type Props = {
  alt?: string;
  src?: string;
  srcset?: string;
  sizes?: string;
  width?: string;
  height?: string;
  className?: string;
  placeholder?: string;
};

function LazyImage({
  placeholder,
  className,
  alt,
  src,
  srcset,
  sizes,
  width,
  height,
}: Props) {
  useEffect(() => {
    document.lazyLoadInstance.update();
  }, []);

  const clazzName = ["lazy", className].join(" ");

  return (
    <img
      alt={alt}
      className={clazzName}
      src={placeholder}
      data-src={src}
      data-srcset={srcset}
      data-sizes={sizes}
      width={width}
      height={height}
    />
  );
}

export default LazyImage;
