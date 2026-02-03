import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCcw, RotateCw, Trash2, Edit3, Edit2, Minus, Edit, Eraser, Check } from 'lucide-react';

type DrawingCanvasProps = {
    onDrawingSaved: (imageUri: string) => void;
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
    const [redoStack, setRedoStack] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.parentElement!.getBoundingClientRect();

        // Increase resolution for hi-dpi screens
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
                    saveInitialState();
                };
                img.src = existingDrawing;
            } else {
                saveInitialState();
            }
        }
    }, [isOpen]);

    const saveInitialState = () => {
        if (canvasRef.current) {
            setHistory([canvasRef.current.toDataURL()]);
            setRedoStack([]);
        }
    };

    const saveState = useCallback(() => {
        if (canvasRef.current) {
            setHistory(prev => [...prev, canvasRef.current!.toDataURL()]);
            setRedoStack([]); // Clear redo stack on new action
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

    const handleUndo = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (history.length <= 1) return;

        const newHistory = [...history];
        const currentState = newHistory.pop()!;
        setRedoStack(prev => [...prev, currentState]);

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

    const handleRedo = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (redoStack.length === 0) return;

        const newRedoStack = [...redoStack];
        const nextState = newRedoStack.pop()!;

        const img = new Image();
        img.onload = () => {
            const rect = canvasRef.current!.getBoundingClientRect();
            contextRef.current!.clearRect(0, 0, rect.width, rect.height);
            contextRef.current!.drawImage(img, 0, 0, rect.width, rect.height);
            setHistory(prev => [...prev, nextState]);
            setRedoStack(newRedoStack);
        };
        img.src = nextState;
    };

    const handleClear = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!contextRef.current || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        contextRef.current.fillStyle = '#ffffff';
        contextRef.current.fillRect(0, 0, rect.width, rect.height);
        saveState();
    };

    const handleSave = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            onDrawingSaved(dataUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4">
            <div className="bg-white dark:bg-gray-900 w-full h-full sm:h-[95vh] sm:max-w-5xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
                {/* Header - Put critical actions here to ensure visibility */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
                            <X size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white hidden min-[400px]:block">Drawing</h2>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-3">
                        <button
                            onClick={handleUndo}
                            disabled={history.length <= 1}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl disabled:opacity-20 transition-all"
                            title="Undo"
                        >
                            <RotateCcw size={20} />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={redoStack.length === 0}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl disabled:opacity-20 transition-all"
                            title="Redo"
                        >
                            <RotateCw size={20} />
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                        <button
                            onClick={handleClear}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                            title="Clear Canvas"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all ml-2"
                        >
                            <Check size={18} className="sm:hidden" />
                            <span className="hidden sm:inline">Save Drawing</span>
                            <span className="sm:hidden">Save</span>
                        </button>
                    </div>
                </div>

                {/* Canvas Area - Use min-h-0 to ensure it can shrink if needed */}
                <div className="flex-1 bg-gray-50 dark:bg-gray-950 relative min-h-0 overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full bg-white cursor-crosshair touch-none"
                    />
                </div>

                {/* Toolbar - Brushes and Colors */}
                <div className="px-6 py-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
                    <div className="flex items-center gap-8 min-w-max">
                        {/* Brushes */}
                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                            {(Object.keys(BRUSH_CONFIGS) as BrushType[]).map(type => {
                                const Icon = BRUSH_CONFIGS[type].icon;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setBrushType(type)}
                                        className={`p-3 rounded-xl transition-all ${brushType === type
                                            ? 'bg-white dark:bg-gray-700 text-primary shadow-md scale-105'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                        title={type}
                                    >
                                        <Icon size={20} />
                                    </button>
                                );
                            })}
                        </div>

                        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />

                        {/* Colors */}
                        <div className="flex items-center gap-2.5">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setSelectedColor(color);
                                        if (brushType === 'eraser') setBrushType('pen');
                                    }}
                                    className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 ${selectedColor === color && brushType !== 'eraser' ? 'border-primary ring-4 ring-primary/10' : 'border-transparent'
                                        } ${color === '#FFFFFF' ? 'border-gray-200 shadow-inner' : ''}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrawingCanvas;
