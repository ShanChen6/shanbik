"use client";

import { Button } from "./button";

export function LoadingState({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div
      role="status"
      className="ui-state flex items-center justify-center gap-3"
    >
      <span aria-hidden="true" className="ui-spinner" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title = "Chưa có dữ liệu",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className="ui-state">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-muted">{description}</p>
    </div>
  );
}

export function ErrorState({
  title = "Không thể tải dữ liệu",
  description,
  onRetry,
  retrying = false,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div role="alert" className="ui-state">
      <p className="text-lg font-semibold text-danger">{title}</p>
      <p className="mt-2 text-muted">{description}</p>
      {onRetry && (
        <Button
          className="mt-4"
          variant="secondary"
          onClick={onRetry}
          loading={retrying}
        >
          Thử lại
        </Button>
      )}
    </div>
  );
}
