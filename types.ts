
export type Language = 'en' | 'tr';

export interface Chain {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  logo: string;
  nativeCurrency: string;
}

export type ToolCategory = 'Research' | 'Security' | 'Dex Data' | 'Wallets' | 'Bots' | 'Track Assets';

export interface Tool {
  id: string;
  name: string;
  description: string;
  logo: string;
  link: string;
  category: ToolCategory;
}

export interface User {
  uid: number;
  address: string;
  username?: string;
  avatar: string;
  memberStatus: 'Admin' | 'Super Admin' | 'Moderator' | 'Hunter';
  registeredAt: number;
  trackedProjectIds?: string[];
  // RPG Stats
  level: number;
  xp: number;
  hp: number;
  mp: number;
  strength: number;
  defense: number;
  lastActivities?: Record<string, number>;
  lastUsernameChange?: number;
  lastCommentTimestamps?: Record<string, number>; // ProjectID -> Timestamp
  // Ban Info
  bannedUntil?: number; // timestamp
  isPermaBanned?: boolean;
}

export interface Announcement {
  id: string;
  text: string;
  emoji: string;
  link: string;
}

export interface OnChainActivity {
  id: string;
  type: 'gm' | 'mint' | 'deploy' | 'rpg';
  name: string;
  logo: string;
  chainId: number;
  contractAddress: string;
  color?: string;
  extraXP?: number;
  isTestnet: boolean;
  nftImage?: string;
  abi?: any[];
  mintFee?: string;
  functionName?: string;
  badge?: 'Popular' | 'NEW' | 'none';
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  discord?: string;
}

export interface TopUser {
  id: string;
  twitterUrl: string;
  name: string;
  avatar: string;
  rank: number;
}

export interface InfoFiPlatform {
  id: string;
  name: string;
  logo: string;
}

export interface Investor {
  id: string;
  name: string;
  logo: string;
  createdAt: number;
}

export interface Airdrop {
  id: string;
  name: string;
  icon: string;
  investment: string;
  investors?: string[]; // Legacy field for string names
  backerIds?: string[]; // New field for formal Investor IDs
  type: 'Gas Only' | 'Waitlist' | 'Free' | 'Paid' | 'Testnet';
  hasInfoFi: boolean;
  rating: number;
  voteCount: number;
  status: 'Potential' | 'Claim Available' | 'Airdrop Confirmed';
  socials: SocialLinks;
  topUsers?: TopUser[];
  createdAt: number;
  platform?: string;
  projectInfo?: string;
  campaignUrl?: string;
  claimUrl?: string; // Link for Claim Available button
  potentialReward?: string; // New field for InfoFi rewards
  editorsGuide?: string; // Rich text content for Editor's Guide
}

export interface Guide {
  id: string;
  platform: 'youtube' | 'twitter' | 'github';
  author: string;
  url: string;
  lang: string;
  countryCode: 'tr' | 'us';
  is_approved: boolean;
  airdropId: string;
  createdAt: number;
  title?: string;
}

export interface TodoItem {
  id: string;
  airdropId: string;
  note: string;
  completed: boolean;
  createdAt: number;
  reminder?: 'none' | 'daily' | 'weekly' | 'monthly';
  deadline?: string; // Added field
}

export interface UserClaim {
  id: string;
  projectName: string;
  expense: number;
  claimedToken: string;
  tokenCount: number;
  earning: number;
  createdAt: number;
  claimedDate?: string; // Added field
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'admin' | 'user';
  description: string;
  url?: string;
}

export interface Claim {
  id: string;
  projectName: string;
  icon: string;
  link: string;
  type: 'claim' | 'presale';
  fdv?: string;
  whitelist?: 'Whitelist' | 'Public';
  isUpcoming?: boolean;
  deadline?: string;
  startDate?: string;
}

export interface Comment {
  id: string;
  airdropId: string;
  username: string;
  address: string;
  avatar: string;
  content: string;
  rating?: number;
  createdAt: string;
  createdAtTimestamp: number; // Track for constraints
  is_approved: boolean;
}

export interface InboxMessage {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'update' | 'personal';
  timestamp: number;
  isRead: boolean;
  relatedAirdropId?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export interface AirdropRequest {
  id: string;
  name: string;
  funding: string;
  twitterLink: string;
  isInfoFi: boolean;
  address: string;
  timestamp: number;
}
