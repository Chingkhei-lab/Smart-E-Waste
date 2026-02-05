import { type ClassificationResult, DeviceType, MaterialCategory } from '@/types/ewaste';

// Base values in INR
const BASE_VALUES: Record<DeviceType, number> = {
    [DeviceType.SMARTPHONE]: 125,
    [DeviceType.LAPTOP]: 450,
    [DeviceType.TABLET]: 250,
    [DeviceType.BATTERY]: 35,
    [DeviceType.CHARGER]: 50,
    [DeviceType.CABLE]: 15,
    [DeviceType.UNKNOWN]: 10
};

// Device keyword mappings for ML results
const DEVICE_KEYWORDS: Record<string, DeviceType> = {
    'cellular telephone': DeviceType.SMARTPHONE,
    'mobile phone': DeviceType.SMARTPHONE,
    'smart phone': DeviceType.SMARTPHONE,
    'iphone': DeviceType.SMARTPHONE,
    'android': DeviceType.SMARTPHONE,
    'laptop': DeviceType.LAPTOP,
    'notebook': DeviceType.LAPTOP,
    'computer': DeviceType.LAPTOP,
    'tablet': DeviceType.TABLET,
    'ipad': DeviceType.TABLET,
    'battery': DeviceType.BATTERY,
    'charger': DeviceType.CHARGER,
    'adapter': DeviceType.CHARGER,
    'cable': DeviceType.CABLE,
    'wire': DeviceType.CABLE
};

export class AIClassifier {
    private initialized = false;

    async initialize(): Promise<void> {
        // In production, load TensorFlow.js MobileNet here
        // For demo, we use rule-based only
        this.initialized = true;
        console.log('AIClassifier initialized (demo mode)');
    }

    async classify(imageData: ImageData): Promise<ClassificationResult> {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use rule-based classification for demo
        const ruleResult = this.ruleBasedClassify(imageData);

        const isAutoAccept = ruleResult.confidence > 0.85;
        const needsConfirmation = ruleResult.confidence >= 0.70 && ruleResult.confidence <= 0.85;

        return {
            deviceType: ruleResult.type,
            confidence: Math.round(ruleResult.confidence * 100),
            suggestedCategory: this.getMaterialCategory(ruleResult.type),
            estimatedWeight: this.estimateWeight(ruleResult.type),
            baseValue: BASE_VALUES[ruleResult.type],
            isAutoAccept,
            needsConfirmation
        };
    }

    // Demo classification - returns random but realistic results
    classifyDemo(): ClassificationResult {
        const types: DeviceType[] = [
            DeviceType.SMARTPHONE,
            DeviceType.LAPTOP,
            DeviceType.TABLET,
            DeviceType.BATTERY,
            DeviceType.CHARGER
        ];
        const randomType = types[Math.floor(Math.random() * types.length)];

        // Generate confidence between 45-98%
        const confidence = 45 + Math.floor(Math.random() * 53);

        const isAutoAccept = confidence > 85;
        const needsConfirmation = confidence >= 70 && confidence <= 85;

        return {
            deviceType: randomType,
            confidence,
            suggestedCategory: this.getMaterialCategory(randomType),
            estimatedWeight: this.estimateWeight(randomType),
            baseValue: BASE_VALUES[randomType],
            isAutoAccept,
            needsConfirmation
        };
    }

    // Rule-based fallback using image dimensions
    private ruleBasedClassify(imageData: ImageData): { type: DeviceType; confidence: number } {
        const { width, height } = imageData;
        const aspectRatio = width / height;

        const scores: Record<DeviceType, number> = {
            [DeviceType.SMARTPHONE]: 0,
            [DeviceType.LAPTOP]: 0,
            [DeviceType.TABLET]: 0,
            [DeviceType.BATTERY]: 0,
            [DeviceType.CHARGER]: 0,
            [DeviceType.CABLE]: 0,
            [DeviceType.UNKNOWN]: 0.1
        };

        // Aspect ratio heuristics
        if (aspectRatio > 1.6) scores[DeviceType.LAPTOP] += 0.4;
        else if (aspectRatio > 1.3) scores[DeviceType.TABLET] += 0.3;
        else if (aspectRatio > 0.5 && aspectRatio < 0.7) scores[DeviceType.SMARTPHONE] += 0.5;
        else if (aspectRatio > 1.0 && aspectRatio < 1.3) scores[DeviceType.CHARGER] += 0.3;

        // Size-based clues
        const pixelCount = width * height;
        if (pixelCount < 500000) scores[DeviceType.BATTERY] += 0.3;
        if (pixelCount > 2000000) scores[DeviceType.LAPTOP] += 0.2;

        // Find highest score
        const entries = Object.entries(scores) as [DeviceType, number][];
        entries.sort((a, b) => b[1] - a[1]);

        return {
            type: entries[0][0],
            confidence: Math.min(0.75, entries[0][1] + 0.2)
        };
    }

    private getMaterialCategory(device: DeviceType): MaterialCategory {
        const mapping: Record<DeviceType, MaterialCategory> = {
            [DeviceType.SMARTPHONE]: MaterialCategory.PRECIOUS_METALS,
            [DeviceType.LAPTOP]: MaterialCategory.PRECIOUS_METALS,
            [DeviceType.TABLET]: MaterialCategory.PRECIOUS_METALS,
            [DeviceType.BATTERY]: MaterialCategory.BATTERY_MATERIALS,
            [DeviceType.CHARGER]: MaterialCategory.BASE_METALS,
            [DeviceType.CABLE]: MaterialCategory.BASE_METALS,
            [DeviceType.UNKNOWN]: MaterialCategory.PLASTICS
        };
        return mapping[device];
    }

    private estimateWeight(device: DeviceType): number {
        const weights: Record<DeviceType, number> = {
            [DeviceType.SMARTPHONE]: 0.18,
            [DeviceType.LAPTOP]: 2.1,
            [DeviceType.TABLET]: 0.45,
            [DeviceType.BATTERY]: 0.05,
            [DeviceType.CHARGER]: 0.15,
            [DeviceType.CABLE]: 0.08,
            [DeviceType.UNKNOWN]: 0.30
        };
        return weights[device] * (0.9 + Math.random() * 0.2); // ±10% variance
    }

    // Real classification result handler
    classifyReal(label: string, score: number): ClassificationResult {
        const normalizedLabel = label.toLowerCase();
        let deviceType: DeviceType = DeviceType.UNKNOWN;

        // Map robustly using existing keywords
        for (const [keyword, type] of Object.entries(DEVICE_KEYWORDS)) {
            if (normalizedLabel.includes(keyword)) {
                deviceType = type;
                break;
            }
        }

        // Additional ad-hoc mappings for COCO-SSD labels
        if (normalizedLabel === 'cell phone') deviceType = DeviceType.SMARTPHONE;
        if (normalizedLabel === 'remote') deviceType = DeviceType.SMARTPHONE; // close enough for demo
        if (normalizedLabel === 'tv') deviceType = DeviceType.LAPTOP; // screen category
        if (normalizedLabel === 'monitor') deviceType = DeviceType.LAPTOP;
        if (normalizedLabel === 'keyboard') deviceType = DeviceType.LAPTOP; // peripheral
        if (normalizedLabel === 'mouse') deviceType = DeviceType.LAPTOP; // peripheral

        const isAutoAccept = score > 0.85;
        const needsConfirmation = score >= 0.70 && score <= 0.85;

        return {
            deviceType,
            confidence: Math.round(score * 100),
            suggestedCategory: this.getMaterialCategory(deviceType),
            estimatedWeight: this.estimateWeight(deviceType),
            baseValue: BASE_VALUES[deviceType],
            isAutoAccept,
            needsConfirmation
        };
    }
}

export const aiClassifier = new AIClassifier();
