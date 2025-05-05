import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          챌린지 달성 관리
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4">
            {/* 대시보드 기능 구현 전까지 링크 숨김 */}
            <Link href="/groups" className="hover:text-primary">
              모임
            </Link>
          </nav>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
} 