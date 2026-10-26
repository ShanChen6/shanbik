"use client";

import * as Primitive from "@radix-ui/react-toast";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Button } from "./button";

type ToastMessage = {
  title: string;
  description?: string;
  variant?: "info" | "success" | "error";
};
type ToastItem = ToastMessage & { id: number };
const ToastContext = createContext<((message: ToastMessage) => void) | null>(
  null,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const notify = useCallback((message: ToastMessage) => {
    const id = ++nextId.current;
    setItems((current) => [...current.slice(-2), { ...message, id }]);
  }, []);
  const remove = useCallback(
    (id: number) =>
      setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {items.length > 0 && (
        <Primitive.Provider
          duration={6000}
          swipeDirection="right"
          label="Thông báo"
        >
          {items.map((item) => (
            <Primitive.Root
              key={item.id}
              className={`ui-toast ui-toast--${item.variant ?? "info"}`}
              type={item.variant === "error" ? "foreground" : "background"}
              onOpenChange={(open) => {
                if (!open) remove(item.id);
              }}
            >
              <div className="min-w-0 flex-1">
                <Primitive.Title className="font-semibold">
                  {item.title}
                </Primitive.Title>
                {item.description && (
                  <Primitive.Description className="mt-1 text-sm text-muted">
                    {item.description}
                  </Primitive.Description>
                )}
              </div>
              <Primitive.Close asChild>
                <Button variant="ghost" aria-label="Đóng thông báo">
                  ×
                </Button>
              </Primitive.Close>
            </Primitive.Root>
          ))}
          <Primitive.Viewport
            className="ui-toast-viewport"
            label="Thông báo ({hotkey})"
          />
        </Primitive.Provider>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used within ToastProvider");
  return notify;
}
