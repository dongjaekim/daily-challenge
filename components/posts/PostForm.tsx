"use client";

import {
  useState,
  ChangeEvent,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MultiSelect, Option } from "react-multi-select-component";
import {
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
  ImagePlus,
  Info,
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { IChallenge, IPost } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queries/makeQueryClient";
import { getPost, postQueryKeys } from "@/lib/queries/postQuery";
import { useCreatePost, useUpdatePost } from "@/lib/mutations/postMutations";
import {
  challengeQueryKeys,
  getChallenges,
} from "@/lib/queries/challengeQuery";

// 이미지 타입 정의
interface IDisplayImage {
  id: string; // 각 이미지 구분을 위한 고유 ID (예: Date.now() 또는 UUID)
  previewUrl: string; // 로컬 미리보기 URL (URL.createObjectURL)
  uploadedUrl?: string; // Supabase 업로드 후 실제 URL
  file?: File; // 실제 파일 객체 (업로드 전)
  uploading: boolean;
  error?: string; // 업로드 에러 메시지
}

interface IPostFormProps {
  groupId: string;
  postId?: string;
}

export function PostForm({ groupId, postId }: IPostFormProps) {
  const [content, setContent] = useState("");
  const [selectedChallengeOptions, setSelectedChallengeOptions] = useState<
    Option[]
  >([]);
  const [images, setImages] = useState<IDisplayImage[]>([]);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitDialogMessage, setLimitDialogMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = makeQueryClient();

  const isEditMode = !!postId;

  const {
    data: challenges,
    isLoading: isLoadingChallenges,
    isError: isErrorChallenges,
  } = useQuery({
    queryKey: challengeQueryKeys.getAll(groupId),
    queryFn: () => getChallenges(groupId),
  });

  const challengeOptions: Option[] = useMemo(() => {
    if (!challenges) return [];
    return challenges.map((challenge: IChallenge) => ({
      label: challenge.title,
      value: challenge.id,
    }));
  }, [challenges]);

  // 게시글 수정 시 기존 데이터 로드
  const { data: existingPost, isLoading: isLoadingPost } = useQuery<IPost>({
    queryKey: postQueryKeys.getOne(postId!), // non-null assertion, enabled 조건으로 postId 존재 보장
    queryFn: () => getPost(postId!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingPost) {
      // existingPost 데이터가 성공적으로 로드되었을 때
      setContent(existingPost.content || ""); // 기본값으로 빈 문자열 설정
      if (existingPost.challenges) {
        setSelectedChallengeOptions(
          existingPost.challenges.map((c: IChallenge) => ({
            // 타입 명시
            label: c.title,
            value: c.id,
          }))
        );
      }
      if (existingPost.image_urls) {
        setImages(
          existingPost.image_urls.map((url: string) => ({
            // 타입 명시
            id: `existing_${url}_${Math.random().toString(16).substring(2)}`,
            previewUrl: url,
            uploadedUrl: url,
            uploading: false,
          }))
        );
      } else {
        setImages([]); // 기본값
      }
    }
  }, [isEditMode, existingPost]); // existingPost가 변경될 때마다 이 useEffect 실행

  // 이미지 업로드 함수 (useCallback으로 최적화)
  const uploadSingleImage = useCallback(
    async (imageToUpload: IDisplayImage) => {
      if (!imageToUpload.file) return;

      const file = imageToUpload.file;
      const filePath = `posts/${groupId}/${Date.now()}_${file.name}`;

      try {
        const { data, error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file, { contentType: file.type, upsert: false });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath);

        setImages((prevImages) =>
          prevImages.map((img) =>
            img.id === imageToUpload.id
              ? {
                  ...img,
                  uploadedUrl: publicUrl,
                  uploading: false,
                  error: undefined,
                }
              : img
          )
        );
      } catch (error: any) {
        console.error("Image upload error:", error);
        setImages((prevImages) =>
          prevImages.map((img) =>
            img.id === imageToUpload.id
              ? {
                  ...img,
                  uploading: false,
                  error: error.message || "업로드 실패",
                }
              : img
          )
        );
      }
    },
    [groupId]
  );

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const MAX_IMAGES = 5;
    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    const newFiles = Array.from(files).slice(0, MAX_IMAGES - images.length);

    // 최대 5개의 이미지로 제한
    if (images.length + newFiles.length > MAX_IMAGES) {
      toast({
        title: "이미지 개수 제한",
        description: `최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.`,
        variant: "destructive",
      });
      return;
    }

    const imagesToUpload: IDisplayImage[] = [];
    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "파일 크기 초과",
          description: `${file.name} 파일이 ${MAX_FILE_SIZE_MB}MB를 초과합니다.`,
          variant: "destructive",
        });
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "지원하지 않는 파일 형식",
          description: `${file.name}은 이미지 파일이 아닙니다.`,
          variant: "destructive",
        });
        continue;
      }
      const newImage: IDisplayImage = {
        id: `temp_${Date.now()}_${Math.random().toString(16).substring(2)}`,
        previewUrl: URL.createObjectURL(file),
        file,
        uploading: true,
      };
      imagesToUpload.push(newImage);
    }

    setImages((prev) => [...prev, ...imagesToUpload]);
    imagesToUpload.forEach(uploadSingleImage);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (imageIdToRemove: string) => {
    const imageToRemove = images.find((img) => img.id === imageIdToRemove);
    // TODO: Supabase 스토리지에서 이미지 삭제 로직 추가 (imageToRemove.uploadedUrl 사용)
    setImages((prev) => prev.filter((img) => img.id !== imageIdToRemove));
    if (imageToRemove?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.previewUrl); // 메모리 해제
    }
  };

  // 게시글 생성 Mutation
  const {
    mutateAsync: createPost,
    isPending: isCreating,
    isError: isCreatePostError,
    error: createError,
  } = useCreatePost(groupId);
  const {
    mutateAsync: updatePost,
    isPending: isUpdating,
    isError: isUpdatePostError,
    error: updateError,
  } = useUpdatePost(groupId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "입력 오류",
        description: "내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!isEditMode && selectedChallengeOptions.length === 0) {
      toast({
        title: "입력 오류",
        description: "챌린지를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (images.some((img) => img.uploading)) {
      toast({
        title: "이미지 업로드 중",
        description: "이미지 업로드가 완료될 때까지 기다려주세요.",
        variant: "destructive",
      });
      return;
    }

    const finalImageUrls = images
      .filter((img) => img.uploadedUrl)
      .map((img) => img.uploadedUrl!);

    if (isEditMode) {
      await updatePost({ id: postId, content, image_urls: finalImageUrls });

      if (isUpdatePostError) {
        toast({
          title: "오류",
          description: updateError.message || "게시글 수정 중 오류 발생",
          variant: "destructive",
        });
      }
      toast({ title: "성공", description: "게시글이 수정되었습니다." });
      router.push(`/groups/${groupId}/posts/${postId!}`);
      router.refresh();
    } else {
      const challengeIds = selectedChallengeOptions.map((opt) => opt.value);

      await createPost({
        content,
        challengeIds,
        imageUrls: finalImageUrls,
      });

      if (isCreatePostError) {
        if (
          createError.message.includes(
            "이미 오늘 게시글을 작성한 챌린지가 있습니다"
          )
        ) {
          const selectedChallengeTitles = selectedChallengeOptions
            .map((opt) => opt.label)
            .join(", ");
          setLimitDialogMessage(
            `하루에 챌린지당 1개의 게시글만 작성할 수 있습니다.\n
                  선택한 챌린지: ${selectedChallengeTitles}\n
                  다른 챌린지를 선택하거나 내일 다시 시도해 주세요.\n\n
                  (이미 작성한 게시글을 삭제한 경우 다시 작성할 수 있습니다)`
          );
          setShowLimitDialog(true);
        } else {
          toast({
            title: "오류",
            description: createError.message || "게시글 작성 중 오류 발생",
            variant: "destructive",
          });
        }
      }

      toast({ title: "성공", description: "게시글이 작성되었습니다." });
      router.push(`/groups/${groupId}?tab=posts`);
      router.refresh(); // 서버 컴포넌트 데이터 갱신을 위해
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const isSubmitting = isCreating || isUpdating;

  if (!isEditMode && isLoadingChallenges) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
        <p>챌린지 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!isEditMode && isErrorChallenges) {
    return (
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <CardTitle className="text-xl text-destructive">
                챌린지 로드 오류
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                챌린지 목록을 불러오는 데 실패했습니다.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  queryClient.refetchQueries({
                    queryKey: challengeQueryKeys.getAll(groupId),
                  })
                }
              >
                다시 시도
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!isEditMode && (!challenges || challenges.length === 0)) {
    return (
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 text-center bg-card border rounded-lg shadow-sm">
            <div className="mb-4">
              <span className="text-5xl" role="img" aria-label="Seedling emoji">
                🌱
              </span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              챌린지를 먼저 만들어주세요!
            </p>
            <p className="text-muted-foreground mt-3 text-base leading-relaxed">
              게시글을 작성하려면 연결할 챌린지가 최소 1개 이상 필요해요.
              <br />새 챌린지를 만들고 활기찬 그룹 활동을 시작해보세요!
            </p>
            {
              <Button asChild className="mt-6">
                <Link href={`/groups/${groupId}/challenges`}>
                  {" "}
                  챌린지 만들러 가기
                </Link>
              </Button>
            }
          </div>
        </div>
      </main>
    );
  }

  if (isEditMode && isLoadingPost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">게시글 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 rounded-full"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditMode ? "게시글 수정" : "새 게시글 작성"}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* 챌린지 선택 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {isEditMode ? "챌린지" : "챌린지 선택"}
              </CardTitle>
              {!isEditMode && (
                <CardDescription>
                  인증할 챌린지를 선택해주세요. (필수)
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isEditMode && existingPost?.challenges ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {existingPost.challenges.map((c) => (
                      <span
                        key={c.id}
                        className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full text-sm"
                      >
                        {c.title}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center pt-2">
                    <Info className="h-3 w-3 mr-1" />
                    게시글 수정 시 챌린지는 변경할 수 없습니다.
                  </p>
                </div>
              ) : !isEditMode ? (
                <MultiSelect
                  options={challengeOptions}
                  value={selectedChallengeOptions}
                  onChange={setSelectedChallengeOptions}
                  labelledBy="챌린지 선택"
                  disableSearch={true}
                  hasSelectAll={false} // 일반적으로 게시글은 여러 챌린지에 동시에 속하지 않을 수 있음. 요구사항에 따라 true로 변경
                  overrideStrings={{
                    selectSomeItems: "참여할 챌린지 선택",
                    allItemsAreSelected: "모든 챌린지가 선택되었습니다.",
                  }}
                  className="text-sm"
                  // ItemRenderer, ArrowRenderer 등으로 커스텀 렌더링 가능
                />
              ) : null}
            </CardContent>
          </Card>

          {/* 내용 입력 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">내용</CardTitle>
              <CardDescription>
                챌린지를 인증할 수 있는 이미지와 공유하고 싶은 이야기를 자유롭게
                작성해주세요. (필수)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="게시글 내용을 입력하세요"
                className="min-h-[150px] sm:min-h-[200px] resize-none text-sm"
              />
            </CardContent>
          </Card>

          {/* 이미지 첨부 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">이미지 첨부</CardTitle>
              <CardDescription>{`최대 5개까지 이미지를 첨부할 수 있습니다. (각 5MB 이하)`}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {images.map((image) => (
                  <div key={image.id} className="relative aspect-square group">
                    <NextImage
                      src={image.previewUrl}
                      alt={`첨부 이미지 ${image.id}`}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                      className={`object-cover rounded-md border ${
                        image.error ? "opacity-50 border-destructive" : ""
                      }`}
                    />
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    {!image.uploading && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(image.id)}
                        disabled={isSubmitting}
                        aria-label="이미지 삭제"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {image.error && (
                      <div className="absolute bottom-0 left-0 right-0 bg-destructive/80 text-destructive-foreground text-xs p-1 text-center rounded-b-md">
                        업로드 실패
                      </div>
                    )}
                  </div>
                ))}

                {images.length < 5 && (
                  <button // button 태그로 변경하여 접근성 향상
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/50 rounded-lg text-muted-foreground hover:bg-accent hover:border-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={isSubmitting}
                    aria-label="이미지 추가"
                  >
                    <ImagePlus className="h-8 w-8 mb-1" />
                    <span className="text-xs">이미지 추가</span>
                  </button>
                )}
                <input // 숨겨진 파일 입력
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          {/* 제출 버튼 (Sticky Footer) */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 border-t mt-8">
            <div className="max-w-2xl mx-auto">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-md font-semibold"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : isEditMode ? (
                  "수정 완료"
                ) : (
                  "작성 완료"
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>

      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시글 작성 제한</DialogTitle>
            <DialogDescription className="whitespace-pre-line py-2">
              {limitDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setShowLimitDialog(false);
              }}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
