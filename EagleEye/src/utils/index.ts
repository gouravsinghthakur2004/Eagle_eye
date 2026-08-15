/**
 * Utility exports for EagleEye application
 */

export * from './dateFormatter';
export * from './responsive';
export * from './eventLifecycle';
export * from './formValidation';

export const truncateText = (text: string, maxLength: number = 30): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
