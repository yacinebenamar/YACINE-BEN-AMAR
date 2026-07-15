import { Toaster } from 'react-hot-toast';

export default function ToasterSetup() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        className: 'font-cairo',
        style: {
          background: '#000839',
          color: '#fff',
          border: '1px solid rgba(118, 188, 33, 0.3)',
          borderRadius: '16px',
        },
        success: {
          iconTheme: {
            primary: '#76bc21',
            secondary: '#000839',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}
