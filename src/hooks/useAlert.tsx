import { useState, useCallback } from "react";
import { AlertModal, AlertType } from "../components/AlertModal";

export interface AlertOptions {
  type: AlertType;
  title: string;
  message?: string;
  buttonText?: string;
}

export interface UseAlertReturn {
  showAlert: (options: AlertOptions) => Promise<void>;
  AlertModalComponent: () => React.JSX.Element | null;
}

export function useAlert(): UseAlertReturn {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    type: "info",
    title: "",
  });
  const [resolvePromise, setResolvePromise] = useState<(() => void) | null>(null);

  const showAlert = useCallback((opts: AlertOptions): Promise<void> => {
    setOptions(opts);
    setVisible(true);

    return new Promise<void>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (resolvePromise) {
      resolvePromise();
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const AlertModalComponent = useCallback(() => {
    if (!visible) return null;

    return (
      <AlertModal
        visible={visible}
        type={options.type}
        title={options.title}
        message={options.message}
        buttonText={options.buttonText}
        onClose={handleClose}
      />
    );
  }, [visible, options, handleClose]);

  return {
    showAlert,
    AlertModalComponent,
  };
}
