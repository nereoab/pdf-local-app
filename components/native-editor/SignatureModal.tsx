'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, Upload, PenTool } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
  lang?: 'es' | 'en';
}

export default function SignatureModal({
  isOpen,
  onClose,
  onApply,
  lang = 'es',
}: SignatureModalProps) {
  const isEs = lang === 'es';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#111827'); // Negro tinta
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleApplySignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    // Recortar áreas transparentes para ajustar la firma limpia
    const dataUrl = canvas.toDataURL('image/png');
    onApply(dataUrl);
    onClose();
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onApply(dataUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#121217] border border-zinc-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">
                {isEs ? 'Crear Firma Manuscrita' : 'Create Handwritten Signature'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {isEs
                  ? 'Traza tu firma o sube un archivo con fondo transparente'
                  : 'Draw your signature or upload a transparent PNG'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de modo: Dibujar vs Subir */}
        <div className="flex items-center gap-2 p-1 bg-black/50 border border-zinc-800 rounded-xl text-xs font-mono">
          <button
            onClick={() => setMode('draw')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              mode === 'draw' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isEs ? '✍️ Dibujar Firma' : '✍️ Draw Signature'}
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              mode === 'upload' ? 'bg-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isEs ? '📁 Subir Imagen' : '📁 Upload Image'}
          </button>
        </div>

        {/* Modo Dibujar */}
        {mode === 'draw' ? (
          <div className="space-y-3">
            {/* Colores de tinta */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">{isEs ? 'Color de tinta:' : 'Ink color:'}</span>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Negro', color: '#111827' },
                  { name: 'Azul Marino', color: '#1E3A8A' },
                  { name: 'Azul Real', color: '#2563EB' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setPenColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                      penColor === c.color
                        ? 'border-white scale-110 shadow'
                        : 'border-zinc-700 opacity-60'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Canvas de dibujo */}
            <div className="border border-zinc-700 rounded-2xl bg-white overflow-hidden shadow-inner relative">
              <canvas
                ref={canvasRef}
                width={460}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[180px] cursor-crosshair touch-none"
              />
              <div className="absolute bottom-2 left-4 pointer-events-none text-[11px] text-zinc-400 font-mono select-none">
                {isEs ? 'Traza tu firma aquí' : 'Sign here'}
              </div>
            </div>

            {/* Botón limpiar */}
            <div className="flex justify-end">
              <button
                onClick={handleClear}
                disabled={!hasDrawn}
                className="text-xs font-mono text-zinc-400 hover:text-red-400 flex items-center gap-1 disabled:opacity-30 disabled:hover:text-zinc-400 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isEs ? 'Limpiar trazo' : 'Clear'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Modo Subir Imagen */
          <div className="space-y-4 py-4 text-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-2xl p-8 cursor-pointer transition-colors bg-zinc-900/40"
            >
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-white mb-1">
                {isEs
                  ? 'Haz clic para seleccionar tu firma'
                  : 'Click to select your signature file'}
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                {isEs
                  ? 'Admite archivos PNG con fondo transparente o JPG'
                  : 'Supports transparent PNG or JPG'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleUploadChange}
              className="hidden"
            />
          </div>
        )}

        {/* Acciones del pie */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {isEs ? 'Cancelar' : 'Cancel'}
          </button>
          {mode === 'draw' && (
            <button
              onClick={handleApplySignature}
              disabled={!hasDrawn}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isEs ? 'Insertar Firma' : 'Insert Signature'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
