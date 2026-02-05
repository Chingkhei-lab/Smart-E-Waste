// Device Types
export enum DeviceType {
    SMARTPHONE = 'smartphone',
    LAPTOP = 'laptop',
    TABLET = 'tablet',
    BATTERY = 'battery',
    CHARGER = 'charger',
    CABLE = 'cable',
    UNKNOWN = 'unknown'
}

// Material Categories
export enum MaterialCategory {
    PRECIOUS_METALS = 'precious_metals', // Gold, silver, palladium
    BASE_METALS = 'base_metals',         // Copper, aluminum
    BATTERY_MATERIALS = 'battery_materials', // Lithium, cobalt
    PLASTICS = 'plastics'
}

// AI Classification Result
export interface ClassificationResult {
    deviceType: DeviceType;
    confidence: number;
    suggestedCategory: MaterialCategory;
    estimatedWeight: number; // kg
    baseValue: number; // INR
    isAutoAccept: boolean;
    needsConfirmation: boolean;
}

// Value Breakdown
export interface ValueBreakdown {
    baseValue: number;
    materialBonus: number;
    rarityMultiplier: number;
    conditionMultiplier: number;
    finalValue: number;
}

// User Badge
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
}

// Recycling History Record
export interface RecycleRecord {
    id: string;
    itemType: DeviceType;
    weight: number;
    pointsEarned: number;
    depositedAt: Date;
    binId?: string;
}

// User Profile
export interface User {
    id: string;
    name: string;
    email: string;
    points: number;
    badges: Badge[];
    recyclingHistory: RecycleRecord[];
    co2Saved: number;
    favoriteCategory: string;
}

// Reward Data (for display)
export interface RewardData {
    points: number;
    weight: number;
    materialBonus: number;
    newBadges: string[];
    valueBreakdown: ValueBreakdown;
}

// Bin Types for Admin
export type BinStatus = 'operational' | 'full' | 'maintenance' | 'offline';
export type ZoneType = 'North' | 'South' | 'East' | 'West' | 'Central';
export type IssueType = 'Hardware malfunction' | 'Sensor error' | 'Vandalism' | 'Other';
export type SeverityLevel = 'Low' | 'Medium' | 'High';

export interface Bin {
    id: string;
    address: string;
    location: { lat: number; lng: number };
    fillLevel: number;
    status: BinStatus;
    lastEmptied: Date;
    acceptedTypes: string[];
    zone: ZoneType;
    fillHistory: { date: string; fillLevel: number }[];
    totalItemsDeposited: number;
    totalKgCollected: number;
    totalValueRecovered: number;
}

// Analysis from AI
export interface AnalysisResult {
    deviceType: DeviceType;
    confidence: number;
    materialCategory: MaterialCategory;
    estimatedWeight: number;
    condition: number;
    valueBreakdown: ValueBreakdown;
}
