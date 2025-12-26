import React, { createContext, useContext, useEffect, useState } from 'react';

type ModalPayload =
  | { type: 'info'; title?: string; message: string; confirmLabel?: string }
  | { type: 'confirm'; title?: string; message: string; confirmLabel?: string; cancelLabel?: string }
  | { type: 'prompt'; title?: string; message: string; confirmLabel?: string; cancelLabel?: string; defaultValue?: string; placeholder?: string };

type AppModalContextType = {
  showMessage: (message: string, title?: string) => Promise<void>;
  showConfirm: (opts: { message: string; title?: string; confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
  showPrompt: (opts: { message: string; title?: string; confirmLabel?: string; cancelLabel?: string; defaultValue?: string; placeholder?: string }) => Promise<string | null>;
};

const AppModalContext = createContext<AppModalContextType>({
  showMessage: async () => {
    /* default no-op */
  }
});

export const AppModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<ModalPayload | null>(null);
  const [resolver, setResolver] = useState<((value?: any) => void) | null>(null);
  const [promptValue, setPromptValue] = useState<string>('');

  const showMessage = (message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setModal({
        type: 'info',
        message,
        title: title || 'Сообщение',
        confirmLabel: 'Понятно'
      });
      setResolver(() => resolve);
    });
  };

  const showConfirm = (opts: { message: string; title?: string; confirmLabel?: string; cancelLabel?: string }) => {
    return new Promise<boolean>((resolve) => {
      setModal({
        type: 'confirm',
        message: opts.message,
        title: opts.title || 'Подтверждение',
        confirmLabel: opts.confirmLabel || 'Подтвердить',
        cancelLabel: opts.cancelLabel || 'Отмена'
      });
      setResolver(() => resolve);
    });
  };

  const showPrompt = (opts: { message: string; title?: string; confirmLabel?: string; cancelLabel?: string; defaultValue?: string; placeholder?: string }) => {
    return new Promise<string | null>((resolve) => {
      setModal({
        type: 'prompt',
        message: opts.message,
        title: opts.title || 'Введите данные',
        confirmLabel: opts.confirmLabel || 'Сохранить',
        cancelLabel: opts.cancelLabel || 'Отмена',
        defaultValue: opts.defaultValue,
        placeholder: opts.placeholder
      });
      setPromptValue(opts.defaultValue || '');
      setResolver(() => resolve);
    });
  };

  const close = () => {
    setModal(null);
    if (resolver) resolver();
  };

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message?: any) => {
      showMessage(String(message ?? ''));
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <AppModalContext.Provider value={{ showMessage, showConfirm, showPrompt }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            {modal.title && <h3 className="text-lg font-bold text-gray-900 mb-2">{modal.title}</h3>}
            <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">{modal.message}</p>
            {modal.type === 'prompt' && (
              <input
                type="text"
                autoFocus
                defaultValue={modal.defaultValue}
                placeholder={modal.placeholder}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setModal(null);
                    if (resolver) resolver(promptValue);
                  }
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
              />
            )}
            <div className="flex justify-end gap-2">
              {modal.type !== 'info' && (
                <button
                  onClick={() => {
                    setModal(null);
                    if (resolver) resolver(modal.type === 'confirm' ? false : null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  {modal.type === 'confirm' || modal.type === 'prompt' ? modal.cancelLabel || 'Отмена' : 'Отмена'}
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.type === 'prompt') {
                    setModal(null);
                    if (resolver) resolver(promptValue);
                  } else if (modal.type === 'confirm') {
                    setModal(null);
                    if (resolver) resolver(true);
                  } else {
                    close();
                  }
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600"
              >
                {modal.confirmLabel || 'Ок'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppModalContext.Provider>
  );
};

export const useAppModal = () => useContext(AppModalContext);
