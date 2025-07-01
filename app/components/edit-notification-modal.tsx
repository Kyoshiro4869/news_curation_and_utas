"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NotificationForm } from "./notification-form";
import { Notification, NotificationFormData } from "@/types/notification";

interface EditNotificationModalProps {
  notification: Notification;
  onSubmit: (data: NotificationFormData & { id: string }) => void;
  onClose: () => void;
}

export function EditNotificationModal({
  notification,
  onSubmit,
  onClose,
}: EditNotificationModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>お知らせを編集</DialogTitle>
        </DialogHeader>
        <NotificationForm
          notification={notification}
          onSubmit={onSubmit}
          onCancel={onClose}
          isEdit={true}
        />
      </DialogContent>
    </Dialog>
  );
}
