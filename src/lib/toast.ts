import toast, { Toast } from 'react-hot-toast';

const toastStyles = {
  success: {
    style: {
      background: 'var(--background)',
      color: 'var(--foreground)',
      border: '1px solid #10B981',
    },
    iconTheme: {
      primary: '#10B981',
      secondary: 'var(--background)',
    },
  },
  error: {
    style: {
      background: 'var(--background)',
      color: 'var(--foreground)',
      border: '1px solid #EF4444',
    },
    iconTheme: {
      primary: '#EF4444',
      secondary: 'var(--background)',
    },
  },
  loading: {
    style: {
      background: 'var(--background)',
      color: 'var(--foreground)',
      border: '1px solid #6366F1',
    },
    iconTheme: {
      primary: '#6366F1',
      secondary: 'var(--background)',
    },
  },
};

export const showToast = {
  success: (message: string) => {
    return toast.success(message, {
      ...toastStyles.success,
      duration: 4000,
      position: 'bottom-right',
    });
  },
  error: (message: string) => {
    return toast.error(message, {
      ...toastStyles.error,
      duration: 4000,
      position: 'bottom-right',
    });
  },
  loading: (message: string) => {
    return toast.loading(message, {
      ...toastStyles.loading,
      duration: 4000,
      position: 'bottom-right',
    });
  },
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
};

export default showToast; 