export interface PostDTO {
  id: number;
  content: string;
  user: UserBriefDTO;
  media: MediaDTO[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  recentComments: CommentDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: number;
  content: string;
  user: UserBriefDTO;
  createdAt: string;
  editable: boolean;
}

import { MediaType } from "./enums";

export interface UserBriefDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface MediaDTO {
  id: number;
  type: MediaType;
  url: string;
}

export interface CreatePostRequest {
  content: string;
  media: { type: MediaType; url: string }[];
}

export interface CreateCommentRequest {
  content: string;
}

export interface UserInfoDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  postCount: number;
}
