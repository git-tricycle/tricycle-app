import { useState, useCallback } from "react";
import { ConfirmModal, ConfirmModalProps } from "../components/ConfirmModal";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  icon?: ConfirmModalProps["icon"];
}

export interface UseConfirmReturn {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  ConfirmModalComponent: () => React.JSX.Element | null;
}

export function useConfirm(): UseConfirmReturn {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setVisible(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setVisible(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const ConfirmModalComponent = useCallback(() => {
    if (!visible) return null;

    return (
      <ConfirmModal
        visible={visible}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        destructive={options.destructive}
        icon={options.icon}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [visible, options, handleConfirm, handleCancel]);

  return {
    showConfirm,
    ConfirmModalComponent,
  };
}
