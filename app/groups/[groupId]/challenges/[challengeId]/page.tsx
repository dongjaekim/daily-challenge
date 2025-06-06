import { ChallengeForm } from "@/components/challenges/ChallengeForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabaseDb } from "@/db";
import { getSupabaseUuid } from "@/utils/server-auth";
import { notFound } from "next/navigation";

interface ChallengePageProps {
  params: {
    groupId: string;
    challengeId: string;
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const uuid = await getSupabaseUuid();

  if (!uuid) {
    console.error("User UUID not found");
    return notFound();
  }

  // 그룹 멤버 여부 확인 (이제 uuid 사용)
  const memberArr = await supabaseDb.select("group_members", {
    group_id: params.groupId,
    user_id: uuid,
  });
  if (!memberArr.length) {
    return notFound();
  }

  // 챌린지 정보 직접 조회
  const challengeArr = await supabaseDb.select("challenges", {
    id: params.challengeId,
    group_id: params.groupId,
  });
  const challenge = challengeArr[0];

  if (!challenge) {
    return notFound();
  }

  // 클라이언트 컴포넌트에 전달할 데이터 형식 조정
  const formattedChallenge = {
    title: challenge.title,
    description: challenge.description,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{challenge.title}</h1>
        {memberArr[0].role === "owner" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>수정</Button>
            </DialogTrigger>
            <DialogContent>
              {/* <ChallengeForm
                
                challengeId={params.challengeId}
                initialData={formattedChallenge}
              /> */}
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground">{challenge.description}</p>
      </div>
    </div>
  );
}

// import { ChallengeStats } from "@/components/challenges/ChallengeStats";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
// import { supabaseDb } from "@/db";
// import { getSupabaseUuid } from "@/utils/server-auth";
// import { notFound } from "next/navigation";
// import { convertToKST } from "@/utils/date";
// import ClientChallengeCalendar from "@/components/challenges/ClientChallengeCalendar";

// interface ChallengePageProps {
//   params: {
//     challengeId: string;
//   };
// }

// export default async function ChallengePage({ params }: ChallengePageProps) {
//   const uuid = await getSupabaseUuid();

//   if (!uuid) {
//     console.error("User UUID not found");
//     return notFound();
//   }

//   // 챌린지 조회
//   const challengeArr = await supabaseDb.select("challenges", {
//     id: params.challengeId,
//   });

//   if (!challengeArr.length) {
//     return notFound();
//   }

//   const challenge = challengeArr[0];

//   // 그룹 멤버 여부 확인
//   const memberArr = await supabaseDb.select("group_members", {
//     group_id: challenge.group_id,
//     user_id: uuid,
//   });

//   if (!memberArr.length) {
//     return notFound();
//   }

//   // 챌린지 진행 상황 조회
//   const progressArr = await supabaseDb.select("challenge_progress", {
//     challenge_id: params.challengeId,
//   });

//   const progressData = progressArr.map((p) => {
//     const dateToUse = p.date
//       ? new Date(p.date)
//       : convertToKST(new Date(p.created_at));
//     return {
//       date: dateToUse.toISOString(),
//       completed: p.progress >= 1.0,
//     };
//   });

//   return (
//     <div className="space-y-8">
//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <div className="space-y-1">
//             <h1 className="text-2xl font-bold">{challenge.title}</h1>
//             <p className="text-muted-foreground">{challenge.description}</p>
//           </div>
//           <Dialog>
//             <DialogTrigger asChild>
//               <Button>진행 상황 업데이트</Button>
//             </DialogTrigger>
//             <DialogContent>
//               <ClientChallengeCalendar
//                 startDate={new Date(challenge.created_at)}
//                 endDate={
//                   new Date(
//                     new Date(challenge.created_at).setDate(
//                       new Date(challenge.created_at).getDate() + 30
//                     )
//                   )
//                 }
//                 progress={progressData}
//                 challengeId={params.challengeId}
//                 currentUserId={uuid}
//               />
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       <ChallengeStats
//         startDate={new Date(challenge.created_at)}
//         endDate={
//           new Date(
//             new Date(challenge.created_at).setDate(
//               new Date(challenge.created_at).getDate() + 30
//             )
//           )
//         }
//         progress={progressData}
//       />

//       <div className="space-y-4">
//         <h2 className="text-xl font-semibold">게시글</h2>
//         <Button
//           onClick={() =>
//             (window.location.href = `/challenges/${params.challengeId}/posts`)
//           }
//         >
//           게시글 목록 보기
//         </Button>
//       </div>
//     </div>
//   );
// }
