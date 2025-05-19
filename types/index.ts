// 사용자 정보
export interface IUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  clerk_id: string;
}

// 그룹 정보
export interface IGroup {
  id: string;
  name: string;
  member_count: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  image_url?: string;
  role?: string; // 클라이언트측에서 사용자의 그룹 역할 표시용
}

// 챌린지 정보
export interface IChallenge {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  group_id: string;
  created_by: string;
  progressSum?: number; // 클라이언트에서 챌린지 진행 횟수 표시용
}

// 챌린지 기록
export interface IChallengeRecord {
  id: string;
  challenge_id: string;
  user_id: string;
  created_at: string;
  user?: IUser;
  challenge?: IChallenge;
}

// 게시글 정보
export interface IPost {
  id: string;
  title: string;
  content: string;
  image_urls: string[] | null; // 여러 이미지 URL
  created_at: string;
  updated_at: string;
  user_id: string;
  group_id: string;
  likeCount: number;
  commentCount: number;
  author?: IUser;
  challenges?: IChallenge[];
  likes?: IPostLike[];
  comments?: IPostComment[];
  isLiked?: boolean;
  isAuthor?: boolean;
}

// 게시글 좋아요
export interface IPostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// 게시글 댓글
export interface IPostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  author?: IUser;
  isAuthor?: boolean;
  is_deleted?: boolean;
  replies?: IPostComment[];
}

// 그룹 멤버
export interface IGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
  updated_at: string;
  user?: IUser;
}
