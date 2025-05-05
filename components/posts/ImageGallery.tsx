'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose
} from '@/components/ui/dialog'

interface IImageGalleryProps {
  images: string[]
  postTitle: string
}

export function ImageGallery({ images, postTitle }: IImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  if (images.length === 0) return null
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  
  const openFullscreen = () => {
    setIsFullscreen(true)
  }
  
  // 단일 이미지인 경우 간단하게 표시
  if (images.length === 1) {
    return (
      <div className="my-6 w-full max-w-2xl mx-auto overflow-hidden rounded-md border">
        <div 
          className="relative aspect-video cursor-pointer"
          onClick={openFullscreen}
        >
          <Image 
            src={images[0]} 
            alt={postTitle} 
            fill
            className="object-contain"
          />
        </div>
        
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent className="max-w-4xl p-0 bg-black/90">
            <DialogClose className="absolute right-2 top-2 z-10">
              <Button variant="ghost" size="icon" className="text-white h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
            <div className="relative h-[80vh]">
              <Image 
                src={images[0]} 
                alt={postTitle} 
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
  
  // 여러 이미지인 경우 슬라이더로 표시
  return (
    <div className="my-6 w-full max-w-2xl mx-auto">
      <div className="relative rounded-md overflow-hidden border">
        <div 
          className="relative aspect-video cursor-pointer"
          onClick={openFullscreen}
        >
          <Image 
            src={images[currentIndex]} 
            alt={`${postTitle} - 이미지 ${currentIndex + 1}`} 
            fill
            className="object-contain"
          />
        </div>
        
        <Button 
          variant="outline"
          size="icon" 
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 bg-white/70"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 bg-white/70"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-2 w-6 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
              aria-label={`이미지 ${index + 1}로 이동`}
            />
          ))}
        </div>
      </div>
      
      <div className="text-center text-sm text-muted-foreground mt-2">
        {currentIndex + 1} / {images.length}
      </div>
      
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-5xl p-0 bg-black/90">
          <DialogClose className="absolute right-2 top-2 z-10">
            <Button variant="ghost" size="icon" className="text-white h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          <div className="relative h-[80vh]">
            <Image 
              src={images[currentIndex]} 
              alt={`${postTitle} - 이미지 ${currentIndex + 1}`} 
              fill
              className="object-contain"
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-white"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-8 rounded-full ${
                    index === currentIndex ? 'bg-white' : 'bg-gray-500'
                  }`}
                  aria-label={`이미지 ${index + 1}로 이동`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 