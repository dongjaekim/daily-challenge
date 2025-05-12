"use client";

import { useState, ChangeEvent, useRef, useEffect, useCallback } from "react";
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
import { Loader2, Upload, X, ArrowLeft, Link, Plus } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePostsStore } from "@/store/posts";
import { IChallenge, IPost } from "@/types";

interface IImage {
  url: string;
  file?: File;
  uploading: boolean;
  index: number;
}

interface IPostFormProps {
  groupId: string;
  postId?: string;
  challenges?: IChallenge[];
}

export function PostForm({ groupId, postId, challenges }: IPostFormProps) {
  const [content, setContent] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<IImage[]>([]);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitDialogMessage, setLimitDialogMessage] = useState("");
  const [currentChallenge, setCurrentChallenge] = useState<IChallenge | null>(
    null
  );
  const [post, setPost] = useState<IPost | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  // 게시글 스토어 접근
  const addPost = usePostsStore((state) => state.addPost);
  const updatePost = usePostsStore((state) => state.updatePost);
  const getPost = usePostsStore((state) => state.getPost);

  useEffect(() => {
    const cachedPost = () => {
      if (!postId) return;
      const cachedPost = getPost(groupId, postId);
      if (cachedPost) {
        setPost(cachedPost);
        setChallengeId(cachedPost.challenge_id);
        setContent(cachedPost.content);
        if (cachedPost.image_urls && cachedPost.image_urls.length > 0) {
          const initialImages = cachedPost.image_urls.map(
            (url: string, index: number) => ({
              url,
              uploading: false,
              index,
            })
          );
          setImages(initialImages);
        }
      }
    };

    cachedPost();
  }, [postId, groupId, getPost]);

  useEffect(() => {
    const interval = setInterval(
      () => usePostsStore.getState().autoCleanUp(),
      5 * 60 * 1000 // 5분 주기
    );
    return () => clearInterval(interval);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (postId) {
        if (!content.trim()) {
          toast({
            title: "입력 오류",
            description: "내용을 입력해주세요.",
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
          const response = await fetch(`/api/posts/${postId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content,
              imageUrls,
            }),
          });

          if (!response.ok) {
            throw new Error("게시글 수정에 실패했습니다");
          }

          // 수정된 게시글 데이터 받기
          const updatedPost = await response.json();

          // 스토어 업데이트
          updatePost(groupId, postId, updatedPost.post);

          toast({
            title: "게시글이 수정되었습니다",
          });

          // 수정 완료 후 상세 페이지로 이동
          router.push(`/groups/${groupId}/posts/${postId}`);
          router.refresh();
        } catch (error) {
          console.error("게시글 수정 오류:", error);
          toast({
            title: "오류",
            description:
              error instanceof Error
                ? error.message
                : "게시글 수정에 실패했습니다",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        if (!content.trim() || !challengeId) {
          toast({
            title: "입력 오류",
            description: "내용, 챌린지를 모두 입력해주세요.",
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
          const response = await fetch(`/api/groups/${groupId}/posts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content,
              challengeId,
              imageUrls: images.map((img) => img.url),
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (
              errorText.includes("이미 오늘 이 챌린지에 게시글을 작성했습니다")
            ) {
              // 현재 선택된 챌린지 정보 가져오기
              const selectedChallenge =
                challenges?.find((c) => c.id === challengeId) || null;
              setCurrentChallenge(selectedChallenge);
              setLimitDialogMessage(
                "하루에 챌린지당 1개의 게시글만 작성할 수 있습니다.\n다른 챌린지를 선택하거나 내일 다시 시도해 주세요.\n\n(이미 작성한 게시글을 삭제한 경우 다시 작성할 수 있습니다)"
              );
              setShowLimitDialog(true);
              throw new Error(
                "하루에 챌린지당 1개의 게시글만 작성할 수 있습니다."
              );
            }
            throw new Error("게시글 작성에 실패했습니다.");
          }

          // 새 게시글 데이터 받기
          const data = await response.json();
          console.log(data);
          // 스토어에 새 게시글 추가
          const selectedChallenge = challenges?.find(
            (c) => c.id === challengeId
          );
          const currentDate = new Date().toISOString();

          // 게시글 데이터 구성
          const newPost = {
            id: data.id,
            title: selectedChallenge?.title,
            content,
            image_urls: images.map((img) => img.url),
            created_at: currentDate,
            updated_at: currentDate,
            user_id: data.user_id,
            group_id: groupId,
            challenge_id: challengeId,
            challenge: selectedChallenge
              ? {
                  id: selectedChallenge.id,
                  title: selectedChallenge.title,
                }
              : undefined,
            likeCount: 0,
            commentCount: 0,
            isLiked: false,
            isAuthor: true,
          };

          // 스토어에 추가
          addPost(groupId, newPost as IPost);

          toast({
            title: "성공",
            description: "게시글이 작성되었습니다.",
          });

          router.push(`/groups/${groupId}?tab=posts`);
          router.refresh();
        } catch (error) {
          toast({
            title: "오류",
            description:
              error instanceof Error
                ? error.message
                : "게시글 작성 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    },
    [postId, content, challengeId, images]
  );

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const maxImages = 5;

    // 최대 5개의 이미지로 제한
    if (images.length + files.length > maxImages) {
      toast({
        title: "이미지 개수 초과",
        description: `최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`,
        variant: "destructive",
      });
      return;
    }

    // 파일들을 배열로 변환하여 순회
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // 파일 크기 제한 (5MB)
      if (file.size > maxFileSize) {
        toast({
          title: "파일 크기 초과",
          description: `${file.name}: 이미지 크기는 ${maxFileSize} 이하여야 합니다.`,
          variant: "destructive",
        });
        continue;
      }

      // 이미지 파일 타입 확인
      if (!file.type.startsWith("image/")) {
        toast({
          title: "지원되지 않는 파일 형식",
          description: `${file.name}: 이미지 파일만 업로드 가능합니다.`,
          variant: "destructive",
        });
        continue;
      }

      // 이미지 객체 생성
      const imageId = `img_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const newImage: IImage = {
        url: URL.createObjectURL(file),
        file,
        uploading: true,
        index: images.length,
      };

      // 이미지 배열에 추가
      setImages((prev) => [...prev, newImage]);

      // 이미지 업로드 시작
      uploadImage(newImage);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = useCallback(async (image: IImage) => {
    if (!image.file) return;

    const file = image.file;

    try {
      // 파일 이름 생성 (고유 ID + 원본 파일명)
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Supabase Storage에 업로드
      const { error: uploadError, data } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // 업로드된 이미지 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      // 이미지 URL 업데이트
      setImages((prev) =>
        prev.map((img) =>
          img.index === image.index
            ? { ...img, url: publicUrl, uploading: false }
            : img
        )
      );

      toast({
        title: "이미지 업로드 완료",
        description: `${file.name} 이미지가 성공적으로 업로드되었습니다.`,
      });
    } catch (error) {
      console.error("이미지 업로드 오류:", error);

      // 업로드 실패 시 이미지 제거
      setImages((prev) => prev.filter((img) => img.index !== image.index));

      toast({
        title: "이미지 업로드 실패",
        description: `${file.name} 이미지 업로드 중 오류가 발생했습니다.`,
        variant: "destructive",
      });
    }
  }, []);

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((img) => img.index !== index));
  };

  const handleGoBack = () => {
    if (postId) {
      router.push(`/groups/${groupId}/posts/${postId}`);
    } else {
      router.back();
    }
  };

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b sticky top-0 bg-background z-10">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full p-3 md:p-2.5"
          onClick={handleGoBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center pr-8">
          <span className="font-semibold">
            {postId ? "게시글 수정" : "새 게시글"}
          </span>
        </div>
      </div>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <section className="bg-card rounded-xl shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="challenge">
                {postId ? "챌린지" : "챌린지 선택"}
              </Label>
              {postId ? (
                <Select
                  value={challengeId}
                  disabled={true} // 수정 시 챌린지 변경 불가
                >
                  <SelectTrigger>
                    <SelectValue placeholder="참여한 챌린지" />
                  </SelectTrigger>
                  <SelectContent>
                    {challenges?.map((challenge) => (
                      <SelectItem key={challenge.id} value={challenge.id}>
                        {challenge.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={challengeId}
                  onValueChange={setChallengeId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="참여할 챌린지를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {challenges?.map((challenge) => (
                      <SelectItem key={challenge.id} value={challenge.id}>
                        {challenge.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {postId && (
                <p className="text-xs text-muted-foreground">
                  게시글 수정 시 챌린지는 변경할 수 없습니다.
                </p>
              )}
            </div>
          </section>

          <section className="bg-card rounded-xl shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={isLoading}
                placeholder="게시글 내용을 입력하세요"
                className="min-h-[120px] md:min-h-[150px] resize-none"
              />
            </div>
          </section>

          <section className="bg-card rounded-xl">
            <div className="space-y-2">
              <Label htmlFor="images">이미지 첨부 ({images.length}/5)</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {images.map((image, i) => (
                  <div key={i} className="relative aspect-square">
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
                        onClick={() => handleRemoveImage(image.index)}
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
                    className="aspect-square h-full flex flex-col border-2 border-dashed rounded-lg items-center justify-center cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center px-2">
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
                JPG, PNG, GIF, WEBP 형식의 이미지를 최대 5개까지 첨부할 수
                있습니다. (최대 5MB)
              </p>
            </div>
          </section>

          <div className="sticky bottom-0 bg-background pt-4 pb-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base p-3 md:p-2.5"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : postId ? (
                "수정 완료"
              ) : (
                "작성 완료"
              )}
            </Button>
          </div>
        </form>
      </main>

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>게시글 작성 제한</DialogTitle>
            <DialogDescription>
              {currentChallenge && (
                <span className="font-semibold">
                  '{currentChallenge.title}' 챌린지에
                </span>
              )}{" "}
              {limitDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => {
                setShowLimitDialog(false);
                router.push(`/groups/${groupId}?tab=posts`);
              }}
            >
              게시글 목록으로 돌아가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
