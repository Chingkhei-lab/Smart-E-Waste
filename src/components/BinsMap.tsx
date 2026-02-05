import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Navigation, Locate, Maximize2, Minimize2, X, CornerUpRight, CornerUpLeft, ArrowUp, RotateCcw, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Leaflet components
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Custom marker icons
const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

const greenIcon = createCustomIcon('#10b981');
const yellowIcon = createCustomIcon('#f59e0b');
const redIcon = createCustomIcon('#ef4444');
const blueIcon = createCustomIcon('#3b82f6');

// Mock bin data - Bangalore locations
const nearbyBins = [
    {
        id: 'BIN-001',
        name: 'MG Road E-Waste Bin',
        address: '123 MG Road, Near Metro Station',
        distance: '0.5 km',
        fillLevel: 45,
        status: 'operational' as const,
        acceptedTypes: ['Phones', 'Batteries', 'Chargers'],
        lat: 12.9756,
        lng: 77.6080,
    },
    {
        id: 'BIN-002',
        name: 'Indiranagar Collection Point',
        address: '456 12th Main, Indiranagar',
        distance: '1.2 km',
        fillLevel: 72,
        status: 'operational' as const,
        acceptedTypes: ['Phones', 'Laptops', 'Tablets'],
        lat: 12.9784,
        lng: 77.6408,
    },
    {
        id: 'BIN-003',
        name: 'Koramangala Drop-off',
        address: '789 80 Feet Road, Koramangala',
        distance: '2.1 km',
        fillLevel: 89,
        status: 'full' as const,
        acceptedTypes: ['All E-Waste'],
        lat: 12.9352,
        lng: 77.6245,
    },
    {
        id: 'BIN-004',
        name: 'HSR Layout Bin',
        address: '27th Main, HSR Layout',
        distance: '3.5 km',
        fillLevel: 23,
        status: 'operational' as const,
        acceptedTypes: ['Phones', 'Batteries', 'Cables'],
        lat: 12.9121,
        lng: 77.6446,
    },
];

// Default location near the bins
const DEFAULT_USER_LOCATION: [number, number] = [12.9550, 77.6200];
const DEFAULT_CENTER: [number, number] = [12.9550, 77.6200];

// Turn instruction type
interface TurnInstruction {
    type: 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'arrive';
    instruction: string;
    distance: string;
    point: [number, number];
}

// Component to fly to selected bin
function FlyToMarker({ position }: { position: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { duration: 1 });
        }
    }, [position, map]);

    return null;
}

// Component to fit route bounds
function FitRouteBounds({ route, userLocation }: { route: [number, number][] | null, userLocation: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
        if (route && route.length > 0 && userLocation) {
            const bounds = L.latLngBounds([...route, userLocation]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [route, userLocation, map]);

    return null;
}

// Component to handle location
function LocationHandler({ setUserLocation }: { setUserLocation: (loc: [number, number]) => void }) {
    const map = useMap();
    const hasTriedRef = useRef(false);

    useEffect(() => {
        if (hasTriedRef.current) return;
        hasTriedRef.current = true;

        map.locate({ setView: false, timeout: 5000 });

        map.on('locationfound', (e) => {
            setUserLocation([e.latlng.lat, e.latlng.lng]);
        });

        map.on('locationerror', () => {
            setUserLocation(DEFAULT_USER_LOCATION);
        });
    }, [map, setUserLocation]);

    return null;
}

// Recenter button component
function RecenterButton({ userLocation }: { userLocation: [number, number] | null }) {
    const map = useMap();

    const recenter = () => {
        if (userLocation) {
            map.flyTo(userLocation, 15, { duration: 0.5 });
        }
    };

    return (
        <button
            onClick={recenter}
            className="absolute bottom-24 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-gray-50"
        >
            <RotateCcw className="h-5 w-5 text-gray-700" />
        </button>
    );
}

// Component to fix map tiles not loading when container resizes
function InvalidateSize({ isNavigating, isFullMap }: { isNavigating: boolean; isFullMap: boolean }) {
    const map = useMap();

    useEffect(() => {
        // Small delay to let CSS transition complete
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 350);

        return () => clearTimeout(timer);
    }, [map, isNavigating, isFullMap]);

    // Also invalidate on initial mount
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => clearTimeout(timer);
    }, [map]);

    return null;
}

const getMarkerIcon = (fillLevel: number, status: string) => {
    if (status === 'full') return redIcon;
    if (fillLevel >= 80) return redIcon;
    if (fillLevel >= 50) return yellowIcon;
    return greenIcon;
};

const getFillColor = (level: number) => {
    if (level >= 80) return 'bg-red-500';
    if (level >= 50) return 'bg-yellow-500';
    return 'bg-emerald-500';
};

// Generate mock route between two points
function generateMockRoute(start: [number, number], end: [number, number]): [number, number][] {
    const points: [number, number][] = [];
    const steps = 20;

    // Add some realistic waypoints with slight curves
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = start[0] + (end[0] - start[0]) * t;
        const lng = start[1] + (end[1] - start[1]) * t;

        // Add some curve variation
        const curve = Math.sin(t * Math.PI) * 0.003;
        points.push([lat + curve * 0.5, lng + curve]);
    }

    return points;
}

// Generate mock turn instructions
function generateMockInstructions(start: [number, number], end: [number, number]): TurnInstruction[] {
    const route = generateMockRoute(start, end);
    const distance = Math.sqrt(
        Math.pow((end[0] - start[0]) * 111, 2) +
        Math.pow((end[1] - start[1]) * 111 * Math.cos(start[0] * Math.PI / 180), 2)
    );

    return [
        {
            type: 'straight',
            instruction: 'Head northeast on Main Road',
            distance: `${(distance * 0.3).toFixed(1)} km`,
            point: route[Math.floor(route.length * 0.1)],
        },
        {
            type: 'right',
            instruction: 'Turn right onto 12th Cross',
            distance: `${(distance * 0.25).toFixed(1)} km`,
            point: route[Math.floor(route.length * 0.35)],
        },
        {
            type: 'left',
            instruction: 'Turn left onto Service Road',
            distance: `${(distance * 0.3).toFixed(1)} km`,
            point: route[Math.floor(route.length * 0.6)],
        },
        {
            type: 'straight',
            instruction: 'Continue straight',
            distance: `${(distance * 0.15).toFixed(1)} km`,
            point: route[Math.floor(route.length * 0.85)],
        },
        {
            type: 'arrive',
            instruction: 'Arrive at destination',
            distance: '0 m',
            point: end,
        },
    ];
}

// Turn icon component
function TurnIcon({ type, className }: { type: TurnInstruction['type'], className?: string }) {
    switch (type) {
        case 'left':
            return <CornerUpLeft className={className} />;
        case 'right':
            return <CornerUpRight className={className} />;
        case 'slight-left':
            return <CornerUpLeft className={cn(className, 'rotate-[-30deg]')} />;
        case 'slight-right':
            return <CornerUpRight className={cn(className, 'rotate-[30deg]')} />;
        case 'arrive':
            return <MapPin className={className} />;
        default:
            return <ArrowUp className={className} />;
    }
}

export default function BinsMap() {
    const [selectedBin, setSelectedBin] = useState<string | null>(null);
    const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isFullMap, setIsFullMap] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [navigationBin, setNavigationBin] = useState<typeof nearbyBins[0] | null>(null);
    const [route, setRoute] = useState<[number, number][] | null>(null);
    const [instructions, setInstructions] = useState<TurnInstruction[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [showInstructions, setShowInstructions] = useState(false);
    const mapRef = useRef<L.Map | null>(null);

    const handleBinClick = (bin: typeof nearbyBins[0]) => {
        setSelectedBin(bin.id);
        setFlyToPosition([bin.lat, bin.lng]);
    };

    const startNavigation = useCallback((bin: typeof nearbyBins[0]) => {
        if (!userLocation) return;

        const routePoints = generateMockRoute(userLocation, [bin.lat, bin.lng]);
        const turnInstructions = generateMockInstructions(userLocation, [bin.lat, bin.lng]);

        setRoute(routePoints);
        setInstructions(turnInstructions);
        setNavigationBin(bin);
        setIsNavigating(true);
        setIsFullMap(true);
        setCurrentStep(0);
    }, [userLocation]);

    const endNavigation = () => {
        setIsNavigating(false);
        setNavigationBin(null);
        setRoute(null);
        setInstructions([]);
        setCurrentStep(0);
        setIsFullMap(false);
    };

    // Calculate ETA and total distance
    const totalDistance = navigationBin ?
        (Math.sqrt(
            Math.pow((navigationBin.lat - (userLocation?.[0] ?? 0)) * 111, 2) +
            Math.pow((navigationBin.lng - (userLocation?.[1] ?? 0)) * 111 * Math.cos((userLocation?.[0] ?? 0) * Math.PI / 180), 2)
        )).toFixed(1) : '0';

    const estimatedTime = Math.ceil(parseFloat(totalDistance) * 3); // ~3 min per km walking

    const fitAllBins = () => {
        if (mapRef.current) {
            const bounds = L.latLngBounds(nearbyBins.map(b => [b.lat, b.lng]));
            if (userLocation) {
                bounds.extend(userLocation);
            }
            mapRef.current.fitBounds(bounds, { padding: [30, 30] });
        }
    };

    return (
        <div className="space-y-4">
            {/* Header - hidden during navigation */}
            {!isNavigating && (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Nearby Bins</h1>
                            <p className="text-gray-500">Find e-waste collection points near you</p>
                        </div>
                    </div>

                    {/* Map Controls */}
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={fitAllBins}>
                            <Locate className="h-4 w-4 mr-1" />
                            Show All Bins
                        </Button>
                        <Button
                            variant={isFullMap ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsFullMap(!isFullMap)}
                            className={isFullMap ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        >
                            {isFullMap ? (
                                <>
                                    <Minimize2 className="h-4 w-4 mr-1" />
                                    Minimize Map
                                </>
                            ) : (
                                <>
                                    <Maximize2 className="h-4 w-4 mr-1" />
                                    View Full Map
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}

            {/* Navigation UI */}
            {isNavigating && navigationBin && (
                <>
                    {/* Top navigation header - Google Maps style */}
                    <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <TurnIcon type={instructions[currentStep]?.type || 'straight'} className="h-8 w-8" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{instructions[currentStep]?.instruction}</p>
                                    <p className="text-emerald-100">{instructions[currentStep]?.distance}</p>
                                </div>
                            </div>
                            <button onClick={endNavigation} className="p-2 hover:bg-white/10 rounded-lg">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Next turn indicator */}
                        {currentStep < instructions.length - 1 && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20 text-sm text-emerald-100">
                                <span>Then</span>
                                <TurnIcon type={instructions[currentStep + 1]?.type || 'straight'} className="h-4 w-4" />
                                <span>{instructions[currentStep + 1]?.instruction}</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Map */}
            <div className={cn(
                "relative rounded-2xl overflow-hidden border shadow-sm transition-all duration-300",
                isNavigating ? "h-[60svh]" : isFullMap ? "h-[calc(100svh-10rem)]" : "h-64 sm:h-80"
            )}>
                <MapContainer
                    center={DEFAULT_CENTER}
                    zoom={12}
                    className="h-full w-full"
                    ref={mapRef}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {!isNavigating && <FlyToMarker position={flyToPosition} />}
                    {isNavigating && route && <FitRouteBounds route={route} userLocation={userLocation} />}
                    <LocationHandler setUserLocation={setUserLocation} />
                    <InvalidateSize isNavigating={isNavigating} isFullMap={isFullMap} />

                    {/* Route polyline */}
                    {route && (
                        <Polyline
                            positions={route}
                            color="#10b981"
                            weight={6}
                            opacity={0.8}
                        />
                    )}

                    {/* Turn markers on route */}
                    {isNavigating && instructions.map((instruction, idx) => (
                        idx !== instructions.length - 1 && (
                            <Marker
                                key={idx}
                                position={instruction.point}
                                icon={L.divIcon({
                                    className: 'turn-marker',
                                    html: `<div style="
                    background: white;
                    border: 2px solid #10b981;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    color: #10b981;
                  ">${idx + 1}</div>`,
                                    iconSize: [24, 24],
                                    iconAnchor: [12, 12],
                                })}
                            />
                        )
                    ))}

                    {/* User location marker */}
                    {userLocation && (
                        <Marker position={userLocation} icon={blueIcon}>
                            <Popup>
                                <div className="text-center">
                                    <strong>You are here</strong>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Bin markers */}
                    {nearbyBins.map((bin) => (
                        <Marker
                            key={bin.id}
                            position={[bin.lat, bin.lng]}
                            icon={getMarkerIcon(bin.fillLevel, bin.status)}
                            eventHandlers={{
                                click: () => !isNavigating && handleBinClick(bin),
                            }}
                        >
                            {!isNavigating && (
                                <Popup>
                                    <div className="min-w-[200px]">
                                        <h3 className="font-semibold text-gray-900">{bin.name}</h3>
                                        <p className="text-sm text-gray-500">{bin.address}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", getFillColor(bin.fillLevel))}
                                                    style={{ width: `${bin.fillLevel}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-600">{bin.fillLevel}%</span>
                                        </div>
                                        <button
                                            onClick={() => startNavigation(bin)}
                                            className="mt-2 w-full bg-emerald-500 text-white text-sm py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-emerald-600"
                                        >
                                            <Navigation className="h-3 w-3" />
                                            Get Directions
                                        </button>
                                    </div>
                                </Popup>
                            )}
                        </Marker>
                    ))}

                    {/* Recenter button during navigation */}
                    {isNavigating && <RecenterButton userLocation={userLocation} />}
                </MapContainer>
            </div>

            {/* Bottom navigation panel - Google Maps style */}
            {isNavigating && navigationBin && (
                <div className="bg-white rounded-xl border shadow-lg">
                    {/* Collapse/expand handle */}
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="w-full p-2 flex justify-center"
                    >
                        <ChevronUp className={cn("h-5 w-5 text-gray-400 transition-transform", showInstructions && "rotate-180")} />
                    </button>

                    {/* Stats bar */}
                    <div className="px-4 pb-4 flex items-center justify-between">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{estimatedTime} min</p>
                            <p className="text-sm text-gray-500">ETA</p>
                        </div>
                        <div className="h-12 w-px bg-gray-200" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-600">{totalDistance} km</p>
                            <p className="text-sm text-gray-500">Distance</p>
                        </div>
                        <div className="h-12 w-px bg-gray-200" />
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">
                                {new Date(Date.now() + estimatedTime * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-sm text-gray-500">Arrival</p>
                        </div>
                    </div>

                    {/* Destination info */}
                    <div className="px-4 pb-4 pt-2 border-t">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{navigationBin.name}</p>
                                <p className="text-sm text-gray-500">{navigationBin.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Turn-by-turn list */}
                    {showInstructions && (
                        <div className="px-4 pb-4 border-t max-h-48 overflow-y-auto">
                            <p className="text-sm font-medium text-gray-500 py-2">All Directions</p>
                            {instructions.map((instruction, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex items-center gap-3 py-2 border-b last:border-0",
                                        idx === currentStep && "bg-emerald-50 -mx-4 px-4"
                                    )}
                                    onClick={() => setCurrentStep(idx)}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center",
                                        idx === currentStep ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
                                    )}>
                                        <TurnIcon type={instruction.type} className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{instruction.instruction}</p>
                                        <p className="text-xs text-gray-500">{instruction.distance}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* End navigation button */}
                    <div className="p-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            onClick={endNavigation}
                        >
                            End Navigation
                        </Button>
                    </div>
                </div>
            )}

            {/* Legend - hidden during navigation */}
            {!isNavigating && (
                <div className="flex flex-wrap gap-4 text-sm px-1">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <span className="text-gray-600">Filling</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-gray-600">Full</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-gray-600">Your Location</span>
                    </div>
                </div>
            )}

            {/* Bin List - hidden during navigation */}
            {!isNavigating && (
                <div className="space-y-3">
                    <h2 className="font-semibold text-gray-900">Nearby Collection Points</h2>
                    {nearbyBins.map((bin, index) => (
                        <Card
                            key={bin.id}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md",
                                selectedBin === bin.id && "ring-2 ring-emerald-500"
                            )}
                            onClick={() => handleBinClick(bin)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0",
                                        bin.status === 'full' ? 'bg-red-500' :
                                            bin.fillLevel >= 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                                    )}>
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{bin.name}</h3>
                                                <p className="text-sm text-gray-500 truncate">{bin.address}</p>
                                            </div>
                                            <Badge variant={bin.status === 'full' ? 'destructive' : 'secondary'}>
                                                {bin.status}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Navigation className="h-3 w-3" />
                                                <span>{bin.distance}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full", getFillColor(bin.fillLevel))}
                                                        style={{ width: `${bin.fillLevel}%` }}
                                                    />
                                                </div>
                                                <span className="text-gray-600">{bin.fillLevel}%</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {bin.acceptedTypes.map((type) => (
                                                <span
                                                    key={type}
                                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                                >
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {selectedBin === bin.id && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startNavigation(bin);
                                            }}
                                        >
                                            <Navigation className="h-4 w-4 mr-1" />
                                            Start Navigation
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
