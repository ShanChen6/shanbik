"use client";

import * as Primitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef } from "react";
import { Button } from "./button";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

type DialogContentProps = ComponentPropsWithoutRef<typeof Primitive.Content> & {
  title: string;
  description: string;
  variant?: "dialog" | "sheet";
};

export function DialogContent({
  title,
  description,
  variant = "dialog",
  children,
  className = "",
  ...props
}: DialogContentProps) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="ui-overlay" />
      <Primitive.Content
        {...props}
        className={`ui-dialog ui-dialog--${variant} ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <Primitive.Title className="text-heading">{title}</Primitive.Title>
          <Primitive.Close asChild>
            <Button variant="ghost" aria-label="Đóng hộp thoại">
              ×
            </Button>
          </Primitive.Close>
        </div>
        <Primitive.Description className="mt-3 text-muted">
          {description}
        </Primitive.Description>
        <div className="mt-6">{children}</div>
      </Primitive.Content>
    </Primitive.Portal>
  );
}
