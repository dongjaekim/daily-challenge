"use client";

import { useState, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ChallengeFormValues {
  title: string;
  description: string;
}

interface IChallengeFormProps {
  initialData?: ChallengeFormValues;
  isSubmitting: boolean;
  onSubmit: (values: ChallengeFormValues) => void;
  onClose?: () => void;
  mode?: "create" | "edit";
}

export function ChallengeForm({
  initialData,
  isSubmitting,
  onSubmit,
  onClose,
  mode = "create",
}: IChallengeFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("챌린지 제목을 입력해주세요.");
      return;
    }

    onSubmit({ title, description });
  };

  const isEditMode = mode === "edit";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">
          {isEditMode ? "챌린지 수정" : "새 챌린지 생성"}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "챌린지의 이름과 설명을 수정합니다."
            : "멤버들과 함께 달성할 새로운 목표를 만들어보세요."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="challenge-title">챌린지 제목 (필수)</Label>
          <Input
            id="challenge-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 매일 30분 책 읽기"
            required
            disabled={isSubmitting}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="challenge-description">챌린지 설명 (선택)</Label>
          <Textarea
            id="challenge-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="챌린지 목표에 대해 간단히 설명해주세요."
            disabled={isSubmitting}
            className="resize-none min-h-[100px]"
          />
        </div>
        <DialogFooter className="pt-4">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="min-w-[110px]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditMode ? (
              "수정 완료"
            ) : (
              "챌린지 생성"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
