"use client";

import { useState, ChangeEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { usePostsStore } from "@/store/posts";

interface IAuthor {
  id: string;
  clerkId: string;
  name: string;
  avatar_url?: string;
}

interface IPost {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  created_at: string;
  author: IAuthor;
  challengeId: string;
  groupId: string;
}

interface IChallenge {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  group_id?: string;
  created_by?: string;
}

interface IImage {
  url: string;
  file?: File;
  uploading: boolean;
  index: number;
}

interface PostEditFormProps {
  post: IPost;
  groupId: string;
  challengeId: string;
}

export function PostEditForm({
  post,
  groupId,
  challengeId,
}: PostEditFormProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [selectedChallengeId, setSelectedChallengeId] = useState(challengeId);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<IImage[]>([]);
  const [challenges, setChallenges] = useState<IChallenge[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  // 게시글 스토어 접근
  const updatePost = usePostsStore((state) => state.updatePost);

  // 초기 이미지 설정
  useEffect(() => {
    if (post.imageUrls && post.imageUrls.length > 0) {
      const initialImages = post.imageUrls.map((url, index) => ({
        url,
        uploading: false,
        index,
      }));
      setImages(initialImages);
    }
  }, [post.imageUrls]);

  // 그룹의 챌린지 목록 조회
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const { data, error } = await supabase
          .from("challenges")
          .select("id, title")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setChallenges(data);
        }
      } catch (error) {
        console.error("챌린지 목록 조회 오류:", error);
        toast({
          title: "챌린지 목록 조회 실패",
          description: "챌린지 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      }
    };

    fetchChallenges();
  }, [groupId, toast]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 모든 이미지가 업로드 중인지 확인
    if (images.some((img) => img.uploading)) {
      toast({
        title: "이미지 업로드 중",
        description: "이미지 업로드가 완료될 때까지 기다려주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 이미지 URL 배열 추출
      const imageUrls = images.map((img) => img.url);

      // 게시글 업데이트 API 호출
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          imageUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("게시글 수정에 실패했습니다");
      }

      // 수정된 게시글 데이터 받기
      const data = await response.json();

      // 스토어 업데이트
      updatePost(groupId, post.id, {
        title,
        content,
        image_urls: imageUrls,
        updated_at: new Date().toISOString(),
      });

      toast({
        title: "게시글이 수정되었습니다",
      });

      // 수정 완료 후 상세 페이지로 이동
      router.push(`/groups/${groupId}/posts/${post.id}`);
      router.refresh();
    } catch (error) {
      console.error("게시글 수정 오류:", error);
      toast({
        title: "오류",
        description:
          error instanceof Error ? error.message : "게시글 수정에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const maxImages = 5;

    // 이미지 최대 개수 확인
    if (images.length + e.target.files.length > maxImages) {
      toast({
        title: "이미지 개수 초과",
        description: `이미지는 최대 ${maxImages}개까지 업로드할 수 있습니다.`,
        variant: "destructive",
      });
      return;
    }

    const newImages: IImage[] = [];

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];

      // 파일 유형 검사
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "지원하지 않는 파일 형식",
          description:
            "JPG, PNG, GIF, WEBP 형식의 이미지만 업로드할 수 있습니다.",
          variant: "destructive",
        });
        continue;
      }

      // 파일 크기 검사
      if (file.size > maxFileSize) {
        toast({
          title: "파일 크기 초과",
          description: "이미지 크기는 5MB 이하여야 합니다.",
          variant: "destructive",
        });
        continue;
      }

      const index = images.length + newImages.length;

      newImages.push({
        url: URL.createObjectURL(file),
        file,
        uploading: true,
        index,
      });
    }

    setImages([...images, ...newImages]);

    // 새 이미지 업로드
    for (const image of newImages) {
      await uploadImage(image);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (image: IImage) => {
    if (!image.file) return;

    const file = image.file;

    try {
      // 파일명을 고유하게 생성 (충돌 방지)
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 업로드된 이미지의 공개 URL 가져오기
      const { data } = supabase.storage.from("images").getPublicUrl(filePath);

      // 이미지 URL 업데이트
      setImages((prev) =>
        prev.map((img) =>
          img.index === image.index
            ? { ...img, url: data.publicUrl, uploading: false }
            : img
        )
      );
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast({
        title: "이미지 업로드 실패",
        description: "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });

      // 실패한 이미지 제거
      setImages((prev) => prev.filter((img) => img.index !== image.index));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((img) => img.index !== index));
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isLoading}
            placeholder="게시글 제목을 입력하세요"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="challenge">챌린지</Label>
          <Select
            value={selectedChallengeId}
            onValueChange={setSelectedChallengeId}
            disabled={true} // 수정 시 챌린지 변경 불가
          >
            <SelectTrigger>
              <SelectValue placeholder="참여한 챌린지" />
            </SelectTrigger>
            <SelectContent>
              {challenges.map((challenge) => (
                <SelectItem key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            게시글 수정 시 챌린지는 변경할 수 없습니다.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">내용</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            disabled={isLoading}
            placeholder="게시글 내용을 입력하세요"
            className="min-h-[150px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="images">이미지 첨부 ({images.length}/5)</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
            {images.map((image, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-md overflow-hidden border"
              >
                <Image
                  src={image.url}
                  alt={`첨부 이미지 ${i + 1}`}
                  fill
                  className="object-cover"
                />
                {image.uploading ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => removeImage(image.index)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            {images.length < 5 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed rounded-md aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-muted"
              >
                <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  이미지 추가
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, GIF, WEBP 형식의 이미지를 최대 5개까지 첨부할 수 있습니다.
            (최대 5MB)
          </p>
        </div>

        <Button type="submit" className="w-full mt-4" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              수정 중...
            </>
          ) : (
            "게시글 수정"
          )}
        </Button>
      </form>
    </>
  );
}
