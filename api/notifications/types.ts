export type PlatformName = 'ANDROID' | 'IOS';

export interface RegisterTokenDto {
  token: string;
  platform: PlatformName;
}

export interface SendPushToUserRequest {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string; // por defecto: "default"
}