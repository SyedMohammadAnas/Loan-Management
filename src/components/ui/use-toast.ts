/**
 * Toast Utility
 *
 * This is a simplified adapter for Sonner's toast API
 * It provides compatibility with components expecting the shadcn toast interface
 */

import { toast as sonnerToast, toast, type ToastT } from 'sonner';

// Define the toast options type
export type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: React.ReactNode;
  cancel?: React.ReactNode;
};

// Main useToast hook
export function useToast() {
  // Create the toast function
  const showToast = ({ title, description, variant, duration, action, cancel }: ToastProps) => {
    // Determine variant styling based on variant type
    const variantClass = variant === 'destructive' ? 'destructive' : 'default';

    // Use the Sonner toast API
    return toast(title, {
      description,
      duration,
      className: `toast-${variantClass}`,
      action,
      cancel,
    });
  };

  // Return the toast function and helpers
  return {
    toast: showToast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
    success: (title: string, options?: Omit<ToastProps, 'title' | 'variant'>) =>
      sonnerToast.success(title, options),
    error: (title: string, options?: Omit<ToastProps, 'title' | 'variant'>) =>
      sonnerToast.error(title, options),
    warning: (title: string, options?: Omit<ToastProps, 'title' | 'variant'>) =>
      sonnerToast.warning(title, options),
    info: (title: string, options?: Omit<ToastProps, 'title' | 'variant'>) =>
      sonnerToast.info(title, options),
  };
}

// Re-export the Toaster component
export { toast, Toaster } from 'sonner';
