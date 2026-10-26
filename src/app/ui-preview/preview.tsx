"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";

export function UIPreview() {
  const notify = useToast();
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  return (
    <div className="site-container section-space space-y-10">
      <h1 className="text-heading">UI primitives — môi trường phát triển</h1>
      <section aria-label="Buttons" className="flex flex-wrap gap-3">
        <Button onClick={() => setResult("Đã bấm nút")}>Nút chính</Button>
        <Button variant="secondary">Nút phụ</Button>
        <Button variant="ghost">Nút ghost</Button>
        <Button variant="danger">Xóa</Button>
        <Button disabled>Vô hiệu hóa</Button>
        <Button loading>Đang lưu</Button>
        <p role="status">{result}</p>
      </section>
      <form
        className="grid max-w-xl gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("algorithm");
          setError(value ? "" : "Vui lòng nhập thuật toán.");
        }}
      >
        <Input
          name="algorithm"
          label="Thuật toán"
          hint="Ví dụ: R U R' U'"
          error={error}
          required
        />
        <Input label="Không cho nhập" disabled defaultValue="Giá trị khóa" />
        <Button type="submit">Kiểm tra input</Button>
      </form>
      <section aria-label="Overlays" className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Mở dialog</Button>
          </DialogTrigger>
          <DialogContent
            title="Hộp thoại mẫu"
            description="Nội dung để kiểm tra focus và Escape."
          >
            <Input label="Tên trong dialog" />
            <DialogClose asChild>
              <Button variant="secondary" className="mt-4">
                Hoàn tất
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Mở sheet</Button>
          </DialogTrigger>
          <DialogContent
            variant="sheet"
            title="Bảng điều khiển mẫu"
            description="Sheet ở dưới mobile, bên phải desktop."
          >
            {Array.from({ length: 12 }, (_, index) => (
              <p key={index} className="mb-4">
                Nội dung mẫu {index + 1}: kiểm tra phần nội dung cuộn bên trong
                bảng điều khiển.
              </p>
            ))}
            <Input label="Tên trong sheet" />
          </DialogContent>
        </Dialog>
      </section>
      <Tabs defaultValue="first" className="max-w-xl">
        <TabsList aria-label="Nội dung mẫu">
          <TabsTrigger value="first">Tab thứ nhất</TabsTrigger>
          <TabsTrigger value="second">Tab thứ hai</TabsTrigger>
          <TabsTrigger value="disabled" disabled>
            Tab khóa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="first">Nội dung tab một</TabsContent>
        <TabsContent value="second">Nội dung tab hai</TabsContent>
      </Tabs>
      <section aria-label="Notifications" className="flex flex-wrap gap-3">
        <Button
          onClick={() =>
            notify({
              title: "Thành công",
              description: "Thông báo dùng token thành công.",
              variant: "success",
            })
          }
        >
          Hiện thông báo
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            notify({
              title: "Có lỗi",
              description: "Bạn có thể thử lại.",
              variant: "error",
            })
          }
        >
          Hiện lỗi
        </Button>
      </section>
      <section aria-label="States" className="grid gap-4 md:grid-cols-3">
        <LoadingState />
        <EmptyState description="Dữ liệu sẽ xuất hiện ở đây." />
        <ErrorState
          description="Ví dụ trạng thái lỗi, không gọi dịch vụ ngoài."
          onRetry={() => notify({ title: "Đã thử lại" })}
        />
      </section>
    </div>
  );
}
