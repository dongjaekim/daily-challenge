'use client'

import { useState, ChangeEvent, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, X, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { usePostsStore } from '@/store/posts'

interface IChallenge {
  id: string
  title: string
  description?: string
  created_at: string
  group_id: string
  created_by: string
}

interface IImage {
  url: string
  file: File
  uploading: boolean
  progress: number
  id: string
}

interface PostFormProps {
  groupId: string
  challenges: IChallenge[]
}

export function PostForm({ groupId, challenges }: PostFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<IImage[]>([])
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitDialogMessage, setLimitDialogMessage] = useState('')
  const [currentChallenge, setCurrentChallenge] = useState<IChallenge | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()
  const router = useRouter()
  
  // 게시글 스토어 접근
  const addPost = usePostsStore(state => state.addPost)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim() || !challengeId) {
      toast({
        title: '입력 오류',
        description: '제목, 내용, 챌린지를 모두 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    
    // 모든 이미지가 업로드 중인지 확인
    if (images.some(img => img.uploading)) {
      toast({
        title: '이미지 업로드 중',
        description: '이미지 업로드가 완료될 때까지 기다려주세요.',
        variant: 'destructive',
      })
      return
    }
    
    setIsLoading(true)

    try {
      const response = await fetch(`/api/groups/${groupId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          challengeId,
          imageUrls: images.map(img => img.url),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        if (errorText.includes('이미 오늘 이 챌린지에 게시글을 작성했습니다')) {
          // 현재 선택된 챌린지 정보 가져오기
          const selectedChallenge = challenges.find(c => c.id === challengeId) || null;
          setCurrentChallenge(selectedChallenge);
          setLimitDialogMessage('하루에 챌린지당 1개의 게시글만 작성할 수 있습니다.\n다른 챌린지를 선택하거나 내일 다시 시도해 주세요.\n\n(이미 작성한 게시글을 삭제한 경우 다시 작성할 수 있습니다)');
          setShowLimitDialog(true);
          throw new Error('하루에 챌린지당 1개의 게시글만 작성할 수 있습니다.');
        }
        throw new Error('게시글 작성에 실패했습니다.')
      }

      // 새 게시글 데이터 받기
      const data = await response.json()
      
      // 스토어에 새 게시글 추가
      const selectedChallenge = challenges.find(c => c.id === challengeId)
      const currentDate = new Date().toISOString()
      
      // 게시글 데이터 구성
      const newPost = {
        id: data.id,
        title,
        content,
        image_urls: images.map(img => img.url),
        created_at: currentDate,
        updated_at: currentDate,
        user_id: data.user_id,
        group_id: groupId,
        challenge_id: challengeId,
        challenge: selectedChallenge ? {
          id: selectedChallenge.id,
          title: selectedChallenge.title
        } : undefined,
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isAuthor: true
      }
      
      // 스토어에 추가
      addPost(groupId, newPost)

      toast({
        title: '성공',
        description: '게시글이 작성되었습니다.',
      })

      router.push(`/groups/${groupId}?tab=posts`)
      router.refresh()
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    // 최대 5개의 이미지로 제한
    if (images.length + files.length > 5) {
      toast({
        title: '이미지 개수 초과',
        description: '최대 5개의 이미지만 업로드할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }
    
    // 파일들을 배열로 변환하여 순회
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '파일 크기 초과',
          description: `${file.name}: 이미지 크기는 5MB 이하여야 합니다.`,
          variant: 'destructive',
        })
        continue
      }
      
      // 이미지 파일 타입 확인
      if (!file.type.startsWith('image/')) {
        toast({
          title: '지원되지 않는 파일 형식',
          description: `${file.name}: 이미지 파일만 업로드 가능합니다.`,
          variant: 'destructive',
        })
        continue
      }
      
      // 이미지 객체 생성
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const newImage: IImage = {
        url: URL.createObjectURL(file),
        file,
        uploading: true,
        progress: 0,
        id: imageId
      }
      
      // 이미지 배열에 추가
      setImages(prev => [...prev, newImage])
      
      // 이미지 업로드 시작
      uploadImage(file, imageId)
    }
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const uploadImage = async (file: File, imageId: string) => {
    try {
      // 파일 이름 생성 (고유 ID + 원본 파일명)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `posts/${fileName}`
      
      // Supabase Storage에 업로드
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })
      
      if (uploadError) throw uploadError
      
      // 업로드된 이미지 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)
      
      // 이미지 URL 업데이트
      setImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, url: publicUrl, uploading: false, progress: 100 } 
            : img
        )
      )
      
      toast({
        title: '이미지 업로드 완료',
        description: `${file.name} 이미지가 성공적으로 업로드되었습니다.`,
      })
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      
      // 업로드 실패 시 이미지 제거
      setImages(prev => prev.filter(img => img.id !== imageId))
      
      toast({
        title: '이미지 업로드 실패',
        description: `${file.name} 이미지 업로드 중 오류가 발생했습니다.`,
        variant: 'destructive',
      })
    }
  }
  
  const handleRemoveImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> 
          뒤로 가기
        </Button>
      </div>
      
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
          <Label htmlFor="challenge">챌린지 선택</Label>
          <Select
            value={challengeId}
            onValueChange={setChallengeId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="참여할 챌린지를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {challenges.map((challenge) => (
                <SelectItem key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="image">이미지 첨부 (최대 5개)</Label>
            <span className="text-xs text-muted-foreground">
              {images.length}/5 이미지 첨부됨
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || images.length >= 5}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" /> 
              이미지 업로드
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              id="image"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {images.map((image) => (
                <div key={image.id} className="relative border rounded-md overflow-hidden">
                  <div className="aspect-video relative">
                    <Image 
                      src={image.url} 
                      alt="업로드된 이미지" 
                      fill
                      className="object-cover"
                    />
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-3/4">
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${image.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-center mt-1 text-white">업로드 중...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => handleRemoveImage(image.id)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 처리 중...
            </>
          ) : (
            '게시글 작성'
          )}
        </Button>
      </form>
      
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>게시글 작성 제한</DialogTitle>
            <DialogDescription>
              {currentChallenge && (
                <span className="font-semibold">
                  '{currentChallenge.title}' 챌린지에
                </span>
              )} {limitDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => {
                setShowLimitDialog(false)
                router.push(`/groups/${groupId}?tab=posts`)
              }}
            >
              게시글 목록으로 돌아가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 