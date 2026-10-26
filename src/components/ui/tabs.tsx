"use client";

import * as Primitive from "@radix-ui/react-tabs";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";

export const Tabs = Primitive.Root;
export const TabsList = forwardRef<
  ComponentRef<typeof Primitive.List>,
  ComponentPropsWithoutRef<typeof Primitive.List>
>(function TabsList({ className = "", ...props }, ref) {
  return (
    <Primitive.List
      {...props}
      ref={ref}
      className={`ui-tabs-list ${className}`}
    />
  );
});
export const TabsTrigger = forwardRef<
  ComponentRef<typeof Primitive.Trigger>,
  ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(function TabsTrigger({ className = "", ...props }, ref) {
  return (
    <Primitive.Trigger
      {...props}
      ref={ref}
      className={`ui-tabs-trigger ${className}`}
    />
  );
});
export const TabsContent = forwardRef<
  ComponentRef<typeof Primitive.Content>,
  ComponentPropsWithoutRef<typeof Primitive.Content>
>(function TabsContent({ className = "", ...props }, ref) {
  return (
    <Primitive.Content
      {...props}
      ref={ref}
      className={`ui-tabs-content ${className}`}
    />
  );
});
