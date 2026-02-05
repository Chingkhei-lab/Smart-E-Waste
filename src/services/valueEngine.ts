import type { DeviceType, MaterialCategory, ValueBreakdown, RecycleRecord } from '@/types/ewaste';

// Base prices in INR per kg
const BASE_PRICES: Record<MaterialCategory, number> = {
    precious_metals: 450,
    base_metals: 25,
    battery_materials: 80,
    plastics: 3
};

// Rarity factors based on market scarcity
const RARITY_FACTORS: Record<DeviceType, number> = {
    smartphone: 1.4,
    laptop: 1.2,
    tablet: 1.1,
    battery: 1.5,
    charger: 0.9,
    cable: 0.8,
    unknown: 1.0
};

// Material bonuses for gamification
const MATERIAL_BONUSES: Record<MaterialCategory, number> = {
    precious_metals: 1.5,
    battery_materials: 1.3,
    base_metals: 1.1,
    plastics: 1.0
};

export class ValueEngine {
    calculateValue(
        device: DeviceType,
        category: MaterialCategory,
        weight: number,
        condition: number
    ): { finalValue: number; breakdown: ValueBreakdown } {
        const base = BASE_PRICES[category];
        const rarity = RARITY_FACTORS[device];
        const conditionMult = 0.3 + (condition * 0.7); // 0.3x (broken) to 1.0x (perfect)
        const materialBonus = MATERIAL_BONUSES[category];

        const baseValue = base * weight;
        const finalValue = baseValue * rarity * conditionMult;

        return {
            finalValue: parseFloat(finalValue.toFixed(2)),
            breakdown: {
                baseValue: parseFloat(baseValue.toFixed(2)),
                materialBonus,
                rarityMultiplier: rarity,
                conditionMultiplier: parseFloat(conditionMult.toFixed(2)),
                finalValue: parseFloat(finalValue.toFixed(2))
            }
        };
    }

    calculatePoints(weight: number, category: MaterialCategory): number {
        const bonus = MATERIAL_BONUSES[category];
        return Math.floor(weight * 100 * bonus);
    }

    checkBadges(totalPoints: number, history: RecycleRecord[], currentBadges: string[]): string[] {
        const newBadges: string[] = [];
        const hasBadge = (name: string) => currentBadges.includes(name);

        // Threshold badges
        if (totalPoints >= 100 && !hasBadge('Eco Starter')) newBadges.push('Eco Starter');
        if (totalPoints >= 500 && !hasBadge('Recycler')) newBadges.push('Recycler');
        if (totalPoints >= 1000 && !hasBadge('Green Champion')) newBadges.push('Green Champion');
        if (totalPoints >= 2500 && !hasBadge('Eco Warrior')) newBadges.push('Eco Warrior');
        if (totalPoints >= 5000 && !hasBadge('Planet Guardian')) newBadges.push('Planet Guardian');
        if (totalPoints >= 10000 && !hasBadge('Sustainability Hero')) newBadges.push('Sustainability Hero');

        // Count-based badges
        const itemCount = history.length + 1; // +1 for current item
        if (itemCount >= 5 && !hasBadge('First Five')) newBadges.push('First Five');
        if (itemCount >= 10 && !hasBadge('Double Digits')) newBadges.push('Double Digits');
        if (itemCount >= 25 && !hasBadge('Quarter Century')) newBadges.push('Quarter Century');

        // Category-specific badges
        const phoneCount = history.filter(h => h.itemType === 'smartphone').length + 1;
        if (phoneCount >= 5 && !hasBadge('Phone Recycler')) newBadges.push('Phone Recycler');

        const batteryCount = history.filter(h => h.itemType === 'battery').length + 1;
        if (batteryCount >= 10 && !hasBadge('Battery Specialist')) newBadges.push('Battery Specialist');

        return newBadges;
    }

    estimateCO2Saved(weight: number, device: DeviceType): number {
        // Estimated CO2 savings per kg of e-waste recycled
        const co2Factors: Record<DeviceType, number> = {
            smartphone: 45,  // kg CO2 per kg recycled
            laptop: 55,
            tablet: 50,
            battery: 25,
            charger: 15,
            cable: 10,
            unknown: 20
        };
        return parseFloat((weight * co2Factors[device]).toFixed(2));
    }
}

export const valueEngine = new ValueEngine();
