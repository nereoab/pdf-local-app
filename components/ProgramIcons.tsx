import React from 'react';

interface IconProps {
  className?: string;
}

export function WordIcon({ className = "w-9 h-9" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="url(#word_grad)" />
      <path d="M5 14H9.5L13.8 28.5L17.5 17H20.5L24.2 28.5L28.5 14H33L26.2 34H22.3L19 24.2L15.7 34H11.8L5 14Z" fill="white" />
      <defs>
        <linearGradient id="word_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E52B6" />
          <stop offset="1" stopColor="#103882" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ExcelIcon({ className = "w-9 h-9" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="url(#excel_grad)" />
      <path d="M11 14H16.5L24 22.5L31.5 14H37L27.5 24L37 34H31.5L24 25.5L16.5 34H11L20.5 24L11 14Z" fill="white" />
      <defs>
        <linearGradient id="excel_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#107C41" />
          <stop offset="1" stopColor="#084E28" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PowerPointIcon({ className = "w-9 h-9" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="url(#ppt_grad)" />
      <path d="M14 14H24.5C28.5 14 31.5 16.2 31.5 20.2C31.5 24.2 28.5 26.4 24.5 26.4H19.5V34H14V14ZM19.5 18.5V21.9H24C25.8 21.9 26.8 21.2 26.8 20.2C26.8 19.2 25.8 18.5 24 18.5H19.5Z" fill="white" />
      <defs>
        <linearGradient id="ppt_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D24726" />
          <stop offset="1" stopColor="#8C270F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function JpgIcon({ className = "w-9 h-9" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="url(#jpg_grad)" />
      <circle cx="17" cy="18" r="3.5" fill="white" />
      <path d="M11 34L19 23L25 30L30 22L37 34H11Z" fill="white" />
      <defs>
        <linearGradient id="jpg_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EC4899" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HtmlIcon({ className = "w-9 h-9" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="url(#html_grad)" />
      <path d="M11 11L13.5 35L24 38L34.5 35L37 11H11ZM31.5 18H18.3L18.7 22.2H31L29.8 30.5L24 32.1L18.2 30.5L17.8 25.5H21.4L21.6 27.5L24 28.2L26.4 27.5L26.8 24.2H14.5L13.3 14H32L31.5 18Z" fill="white" />
      <defs>
        <linearGradient id="html_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E34F26" />
          <stop offset="1" stopColor="#F06529" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TextIcon({ className = "w-9 h-9" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="10" fill="url(#txt_grad)" />
      <path d="M12 14H36V17.5H12V14ZM12 21H36V24.5H12V21ZM12 28H27V31.5H12V28Z" fill="white" />
      <defs>
        <linearGradient id="txt_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
