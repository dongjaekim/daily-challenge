"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";

  return (
    <div className="grid h-full w-full lg:grid-cols-2">
      <div className="flex justify-center items-start pt-8 sm:items-center sm:p-12 sm:pt-6">
        <div className="max-w-md">
          <SignIn
            redirectUrl={redirectUrl}
            appearance={{
              elements: {
                card: "border-none shadow-none",
                formButtonPrimary: "bg-primary hover:bg-primary/90",
                footerActionLink: "text-primary hover:text-primary/90",
              },
            }}
          />
        </div>
      </div>
      <div className="hidden items-center justify-center bg-muted p-12 text-center lg:flex">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            챌린지 앱에 오신 것을 환영합니다🙌🏻
          </h1>
          <p className="mt-4 text-muted-foreground">
            개인적인 챌린지를 설정하고 일일 달성 여부를 관리하는 서비스입니다.
          </p>
          <p className="text-muted-foreground">
            모임을 만들어 함께 챌린지를 달성해보세요!
          </p>
        </div>
      </div>
    </div>
  );
}
