import Link from 'next/link';
import { product } from '@/config/product';
export function Logo() {
  return (
    <Link className="logo" href="/" aria-label={`${product.name} home`}>
      <svg width="30" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M5 5h22v22H5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path
          d="m5 7 11 9L27 7M5 26l8-12m14 12-8-12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="m17 5 10 9V5H17Z" fill="#0B625D" />
      </svg>
      <span>{product.name}</span>
    </Link>
  );
}
