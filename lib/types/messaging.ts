import type { UserBriefDTO } from "./feed";
import { NotificationType, MessageRequestStatus } from "./enums";

export interface MessageReactionDTO {
  id: number;
  userId: number;
  emoji: string;
  userFirstName: string;
}

export interface MessageDTO {
  id: number;
  conversationId: number;
  sender: UserBriefDTO;
  content: string;
  createdAt: string;
  readAt: string | null;
  read?: boolean;
  editable?: boolean;
  reactions?: MessageReactionDTO[];
}

export interface ConversationDTO {
  id: number;
  participant: UserBriefDTO;
  lastMessage: MessageDTO | null;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageRequestDTO {
  id: number;
  fromUser: UserBriefDTO;
  toUser: UserBriefDTO;
  status: MessageRequestStatus;
  createdAt: string;
}

export interface NotificationDTO {
  id: number;
  type: NotificationType;
  actor: UserBriefDTO;
  referenceId: number | null;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
}
