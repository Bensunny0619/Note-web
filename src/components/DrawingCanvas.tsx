import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Save, RotateCcw, Trash2, Edit3, Edit2, Minus, Edit, Eraser } from 'lucide-react';

type DrawingCanvasProps = {
    onDrawingSaved: (imageUri: string) => void;
    onDrawingDeleted?: () => void;
    existingDrawing?: string;
    isOpen: boolean;
    onClose: () => void;
};

type BrushType = 'pen' | 'marker' | 'highlighter' | 'pencil' | 'eraser';

const COLORS = [
    '#000000', '#FFFFFF', '#EF4444', '#F59E0B', '#10B981',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
];

const BRUSH_CONFIGS = {
    pen: { size: 4, opacity: 1.0, icon: Edit3 },
    marker: { size: 12, opacity: 0.8, icon: Edit2 },
    highlighter: { size: 24, opacity: 0.3, icon: Minus },
    pencil: { size: 3, opacity: 0.7, icon: Edit },
    eraser: { size: 20, opacity: 1.0, icon: Eraser }
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    onDrawingSaved,
    onDrawingDeleted,
    existingDrawing,
    isOpen,
    onClose
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushType, setBrushType] = useState<BrushType>('pen');
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = canvasRef.current;
        // Set canvas internal resolution to match display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;

        const context = canvas.getContext('2d');
        if (context) {
            context.scale(window.devicePixelRatio, window.devicePixelRatio);
            context.lineCap = 'round';
            context.lineJoin = 'round';
            contextRef.current = context;

            // Fill background white
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, rect.width, rect.height);

            if (existingDrawing) {
                const img = new Image();
                img.onload = () => {
                    context.drawImage(img, 0, 0, rect.width, rect.height);
                    saveState();
                };
                img.src = existingDrawing;
            } else {
                saveState();
            }
        }
    }, [isOpen]);

    const saveState = useCallback(() => {
        if (canvasRef.current) {
            setHistory(prev => [...prev.slice(-10), canvasRef.current!.toDataURL()]);
        }
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!contextRef.current) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        contextRef.current.beginPath();
        contextRef.current.moveTo(x, y);

        const config = BRUSH_CONFIGS[brushType];
        contextRef.current.strokeStyle = brushType === 'eraser' ? '#ffffff' : selectedColor;
        contextRef.current.lineWidth = config.size;
        contextRef.current.globalAlpha = config.opacity;

        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !contextRef.current) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        contextRef.current.lineTo(x, y);
        contextRef.current.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            contextRef.current?.closePath();
            setIsDrawing(false);
            saveState();
        }
    };

    const handleUndo = () => {
        if (history.length <= 1) return;

        const newHistory = [...history];
        newHistory.pop(); // Remove current state
        const prevState = newHistory[newHistory.length - 1];

        const img = new Image();
        img.onload = () => {
            const rect = canvasRef.current!.getBoundingClientRect();
            contextRef.current!.clearRect(0, 0, rect.width, rect.height);
            contextRef.current!.drawImage(img, 0, 0, rect.width, rect.height);
            setHistory(newHistory);
        };
        img.src = prevState;
    };

    const handleClear = () => {
        if (!contextRef.current || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        contextRef.current.fillStyle = '#ffffff';
        contextRef.current.fillRect(0, 0, rect.width, rect.height);
        saveState();
    };

    const handleSave = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            onDrawingSaved(dataUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <Edit3 className="text-primary" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Drawing Canvas</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-6 relative">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full bg-white rounded-xl shadow-inner cursor-crosshair touch-none"
                    />
                </div>

                {/* Toolbar */}
                <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        {/* Brushes */}
                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            {(Object.keys(BRUSH_CONFIGS) as BrushType[]).map(type => {
                                const Icon = BRUSH_CONFIGS[type].icon;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setBrushType(type)}
                                        className={`p-2 rounded-lg transition-all flex items-center gap-2 ${brushType === type
                                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm scale-105'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                        title={type}
                                    >
                                        <Icon size={20} />
                                        <span className="text-xs font-bold capitalize hidden sm:inline">{type}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Colors */}
                        <div className="flex flex-wrap items-center gap-2">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setSelectedColor(color);
                                        if (brushType === 'eraser') setBrushType('pen');
                                    }}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color && brushType !== 'eraser' ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                                        } ${color === '#FFFFFF' ? 'border-gray-200 shadow-inner' : ''}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={handleUndo}
                                disabled={history.length <= 1}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl disabled:opacity-30 transition-colors"
                            >
                                <RotateCcw size={18} />
                                <span className="text-sm font-semibold">Undo</span>
                            </button>
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                            >
                                <Trash2 size={18} />
                                <span className="text-sm font-semibold">Clear</span>
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
                            >
                                <Save size={18} />
                                Save Drawing
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrawingCanvas;
