import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Ícono oficial de WhatsApp
 * Verde oficial #25D366 con globo de diálogo y auricular blanco
 */
export function WhatsAppIcon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" fill="url(#wa_grad)" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 10C16.268 10 10 16.268 10 24C10 26.702 10.767 29.23 12.095 31.385L10.5 37.5L16.822 35.938C18.91 37.197 21.365 37.935 24 37.935C31.732 37.935 38 31.667 38 23.935C38 16.203 31.732 10 24 10ZM31.867 29.588C31.543 30.501 30.258 31.258 29.336 31.458C28.706 31.593 27.887 31.698 25.122 30.551C21.586 29.083 19.31 25.501 19.133 25.267C18.962 25.033 17.701 23.361 17.701 21.629C17.701 19.897 18.583 19.053 18.937 18.694C19.232 18.394 19.721 18.259 20.193 18.259C20.346 18.259 20.482 18.266 20.6 18.273C20.948 18.288 21.125 18.309 21.355 18.859C21.644 19.553 22.346 21.266 22.434 21.443C22.523 21.62 22.611 21.861 22.487 22.102C22.37 22.343 22.275 22.449 22.1 22.655C21.923 22.861 21.758 23.014 21.575 23.238C21.404 23.438 21.21 23.65 21.416 24.004C21.622 24.351 22.334 25.514 23.384 26.449C24.741 27.658 25.844 28.046 26.239 28.211C26.534 28.335 26.882 28.305 27.094 28.076C27.365 27.781 27.701 27.299 28.043 26.816C28.285 26.474 28.591 26.433 28.909 26.551C29.234 26.663 30.962 27.516 31.316 27.693C31.67 27.869 31.905 27.958 31.994 28.111C32.082 28.264 32.082 29.006 31.867 29.588Z"
        fill="white"
      />
      <defs>
        <linearGradient id="wa_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#29E26F" />
          <stop offset="1" stopColor="#1EBE5D" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Ícono oficial de Telegram
 * Azul oficial #229ED9 con avión de papel blanco en vuelo
 */
export function TelegramIcon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" fill="url(#tg_grad)" />
      <path
        d="M33.64 15.68C33.34 14.98 32.61 14.52 31.85 14.65L12.56 22.1C11.75 22.42 11.23 23.2 11.28 24.06C11.33 24.92 11.95 25.62 12.8 25.87L17.29 27.27L30.68 18.89C30.98 18.7 31.35 18.96 31.24 19.3L20.36 29.24L19.98 33.72C19.95 34.13 20.19 34.5 20.57 34.66C20.95 34.82 21.39 34.73 21.68 34.43L24.81 31.33L29.35 34.68C29.74 34.97 30.24 35.05 30.7 34.89C31.16 34.73 31.5 34.36 31.62 33.88L34.96 17.58C35.1 16.94 34.84 16.27 33.64 15.68Z"
        fill="white"
      />
      <defs>
        <linearGradient id="tg_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2AABEE" />
          <stop offset="1" stopColor="#229ED9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Ícono oficial de Google Drive
 * Triángulo icónico con los 3 colores oficiales: Amarillo, Verde y Azul
 */
export function GoogleDriveIcon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Fondo circular oscuro suave para alto contraste */}
      <circle cx="24" cy="24" r="22" fill="#1A1C23" stroke="#2D3039" strokeWidth="1" />
      {/* Lado Amarillo / Ámbar (Superior) */}
      <path d="M29.5 14H18.5L12 25.25L17.5 34.75H28.5L35 23.5L29.5 14Z" fill="none" />
      {/* Amarillo */}
      <path d="M19.167 14L13 24.667L18.417 34L24.583 23.333L19.167 14Z" fill="#FFBA00" />
      {/* Verde */}
      <path d="M29.083 14H18.75L24.167 23.333H34.5L29.083 14Z" fill="#00AC47" />
      {/* Azul */}
      <path
        d="M34.833 23.333L29.417 14L23.25 24.667L28.667 34H34.833C35.583 34 36.25 33.583 36.667 32.917L37.833 30.917C38.25 30.25 38.25 29.417 37.833 28.75L34.833 23.333Z"
        fill="#0066DA"
      />
      {/* Trapecios refinados exactos Google Drive */}
      <path d="M17.2 33.7H30.8L35.5 25.5H21.9L17.2 33.7Z" fill="#0066DA" />
      <path d="M12.5 25.5L17.2 33.7L24 22L19.3 13.8L12.5 25.5Z" fill="#00AC47" />
      <path d="M19.3 13.8H32.9L28.2 22H14.6L19.3 13.8Z" fill="#FFBA00" />
    </svg>
  );
}

/**
 * Ícono oficial de Facebook
 * Círculo azul oficial #1877F2 con la letra "f" blanca
 */
export function FacebookIcon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" fill="#1877F2" />
      <path
        d="M27.086 25.048L27.674 21.214H24.004V18.724C24.004 17.675 24.516 16.653 26.16 16.653H27.833V13.388C27.833 13.388 26.315 13.129 24.864 13.129C21.833 13.129 19.851 14.966 19.851 18.291V21.214H16.486V25.048H19.851V34.316C20.527 34.423 21.22 34.478 21.927 34.478C22.635 34.478 23.328 34.423 24.004 34.316V25.048H27.086Z"
        fill="white"
      />
    </svg>
  );
}

/**
 * Ícono oficial de Gmail (Google Workspace)
 * La icónica "M" multicolor de Google (Rojo, Azul, Verde, Amarillo)
 */
export function GmailIcon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" fill="#1A1C23" stroke="#2D3039" strokeWidth="1" />
      {/* Pliegue central rojo */}
      <path
        d="M13 18.5V31C13 32.1 13.9 33 15 33H18V22.5L24 27L30 22.5V33H33C34.1 33 35 32.1 35 31V18.5L29 23L24 19L19 23L13 18.5Z"
        fill="none"
      />
      {/* Pata izquierda Azul */}
      <path d="M14 18V31C14 32.1 14.9 33 16 33H19V22.5L14 18.7V18Z" fill="#4285F4" />
      {/* Pata derecha Verde */}
      <path d="M34 18V31C34 32.1 33.1 33 32 33H29V22.5L34 18.7V18Z" fill="#34A853" />
      {/* Techo y ala superior Roja */}
      <path d="M29 17L24 20.8L19 17V22.5L24 26.3L29 22.5V17Z" fill="#EA4335" />
      {/* Hombro izquierdo Rojo */}
      <path d="M14 18.7L19 22.5V17L16.2 14.9C15.1 14.1 14 14.9 14 16.2V18.7Z" fill="#C5221F" />
      {/* Hombro derecho Amarillo */}
      <path d="M34 18.7L29 22.5V17L31.8 14.9C32.9 14.1 34 14.9 34 16.2V18.7Z" fill="#FBBC05" />
    </svg>
  );
}

/**
 * Ícono oficial de Código QR Móvil
 * Matriz estilizada de precisión en oro blanco/platino de lujo
 */
export function QrBrandIcon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" fill="url(#qr_grad)" />
      {/* Esquina superior izquierda */}
      <rect
        x="13"
        y="13"
        width="9"
        height="9"
        rx="2"
        stroke="#FAF6EE"
        strokeWidth="2"
        fill="none"
      />
      <rect x="16" y="16" width="3" height="3" rx="0.5" fill="#FAF6EE" />
      {/* Esquina superior derecha */}
      <rect
        x="26"
        y="13"
        width="9"
        height="9"
        rx="2"
        stroke="#FAF6EE"
        strokeWidth="2"
        fill="none"
      />
      <rect x="29" y="16" width="3" height="3" rx="0.5" fill="#FAF6EE" />
      {/* Esquina inferior izquierda */}
      <rect
        x="13"
        y="26"
        width="9"
        height="9"
        rx="2"
        stroke="#FAF6EE"
        strokeWidth="2"
        fill="none"
      />
      <rect x="16" y="29" width="3" height="3" rx="0.5" fill="#FAF6EE" />
      {/* Puntos de datos centrales e inferiores */}
      <rect x="26" y="26" width="3" height="3" rx="0.5" fill="#FAF6EE" />
      <rect x="32" y="26" width="3" height="3" rx="0.5" fill="#FAF6EE" />
      <rect x="29" y="29" width="3" height="3" rx="0.5" fill="#FAF6EE" />
      <rect x="26" y="32" width="3" height="3" rx="0.5" fill="#FAF6EE" />
      <rect x="32" y="32" width="3" height="3" rx="0.5" fill="#FAF6EE" />
      <defs>
        <linearGradient id="qr_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2A2A33" />
          <stop offset="1" stopColor="#15151A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Ícono de Más Apps / Compartir del Sistema
 * Apple AirDrop + Android Quick Share con degradado púrpura neón
 */
export function SystemShareBrandIcon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" fill="url(#share_sys_grad)" />
      {/* Nodos de compartición interconectados */}
      <circle cx="32" cy="17" r="3.5" fill="white" />
      <circle cx="16" cy="24" r="3.5" fill="white" />
      <circle cx="32" cy="31" r="3.5" fill="white" />
      <path d="M19.2 22.4L28.8 18.6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19.2 25.6L28.8 29.4" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <defs>
        <linearGradient
          id="share_sys_grad"
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9333EA" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Ícono de Copiar Archivo / Portapapeles
 * Hoja doble con micro-check de verificación en gris plateado platino
 */
export function CopyFileBrandIcon({ className = 'w-6 h-6', size }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" fill="url(#copy_grad)" />
      {/* Documento base trasero */}
      <path
        d="M20 15H31C32.1 15 33 15.9 33 17V28"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Documento frontal */}
      <rect
        x="15"
        y="19"
        width="14"
        height="15"
        rx="2.5"
        stroke="white"
        strokeWidth="2"
        fill="#1E2028"
      />
      {/* Líneas de texto */}
      <path d="M19 24H25" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 28H23" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" />
      <defs>
        <linearGradient id="copy_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#334155" />
          <stop offset="1" stopColor="#1E293B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
