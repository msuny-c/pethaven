import React, { useState } from 'react';

type Props = {
  name?: string;
  src?: string | null;
  sizeClass?: string;
  className?: string;
  roundedClassName?: string;
};

export function AnimalAvatar({ name, src, sizeClass = 'w-10 h-10', className = '', roundedClassName = 'rounded-full' }: Props) {
  const [errored, setErrored] = useState(false);
  const initial = (name || 'П')[0]?.toUpperCase();
  const showFallback = !src || errored;

  if (showFallback) {
    return (
      <div
        className={`${sizeClass} ${roundedClassName} bg-amber-100 text-amber-700 flex items-center justify-center font-semibold ${className}`}
        aria-label={name}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className={`${sizeClass} ${roundedClassName} object-cover ${className}`}
    />
  );
}
