'use client';

import React from 'react';
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Palette,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { FontFamily } from './types';

interface PropertyBarProps {
  selectedType: 'text' | 'shape' | 'annotation' | 'image' | 'stamp' | null;
  // Propiedades de texto
  fontFamily?: FontFamily;
  onChangeFontFamily?: (font: FontFamily) => void;
  fontSize?: number;
  onChangeFontSize?: (size: number) => void;
  textColor?: string;
  onChangeTextColor?: (color: string) => void;
  isBold?: boolean;
  onToggleBold?: () => void;
  isItalic?: boolean;
  onToggleItalic?: () => void;
  textAlign?: 'left' | 'center' | 'right';
  onChangeTextAlign?: (align: 'left' | 'center' | 'right') => void;

  // Propiedades de forma / anotación
  strokeColor?: string;
  onChangeStrokeColor?: (color: string) => void;
  strokeWidth?: number;
  onChangeStrokeWidth?: (width: number) => void;
  fillColor?: string;
  onChangeFillColor?: (color: string) => void;
  opacity?: number;
  onChangeOpacity?: (opacity: number) => void;

  // Acciones comunes
  onDelete?: () => void;
  onApply?: () => void;
  onCancel?: () => void;
  lang?: 'es' | 'en';
}

const PRESET_COLORS = [
  '#000000', // Negro
  '#2563EB', // Azul
  '#DC2626', // Rojo
  '#16A34A', // Verde
  '#9333EA', // Púrpura
  '#F59E0B', // Amarillo/Ámbar
  '#FFFFFF', // Blanco
];

export default function PropertyBar({
  selectedType,
  fontFamily = 'Helvetica',
  onChangeFontFamily,
  fontSize = 12,
  onChangeFontSize,
  textColor = '#000000',
  onChangeTextColor,
  isBold = false,
  onToggleBold,
  isItalic = false,
  onToggleItalic,
  textAlign = 'left',
  onChangeTextAlign,
  strokeColor = '#2563EB',
  onChangeStrokeColor,
  strokeWidth = 2,
  onChangeStrokeWidth,
  fillColor,
  onChangeFillColor,
  opacity = 1,
  onChangeOpacity,
  onDelete,
  onApply,
  onCancel,
  lang = 'es',
}: PropertyBarProps) {
  const isEs = lang === 'es';

  if (!selectedType) return null;

  return (
    <div className="bg-[#14141b] border-b border-zinc-700/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md animate-in fade-in duration-150">
      {/* Lado izquierdo: Controles según el tipo seleccionado */}
      <div className="flex flex-wrap items-center gap-3">
        {/* PROPIEDADES DE TEXTO */}
        {selectedType === 'text' && (
          <>
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <Type className="w-3.5 h-3.5" />
              <span>{isEs ? 'Texto:' : 'Text:'}</span>
            </div>

            {/* Tipografía */}
            {onChangeFontFamily && (
              <select
                value={fontFamily}
                onChange={(e) => onChangeFontFamily(e.target.value as FontFamily)}
                className="bg-black/60 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white cursor-pointer hover:border-zinc-500"
              >
                <option value="Helvetica">Helvetica / Arial</option>
                <option value="Times">Times New Roman</option>
                <option value="Courier">Courier / Monospace</option>
              </select>
            )}

            {/* Tamaño con botones +/- */}
            {onChangeFontSize && (
              <div className="flex items-center gap-1 bg-black/60 border border-zinc-700 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onChangeFontSize(Math.max(6, fontSize - 1))}
                  className="px-1.5 py-0.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                >
                  -
                </button>
                <input
                  type="number"
                  min={6}
                  max={96}
                  value={fontSize}
                  onChange={(e) => onChangeFontSize(Number(e.target.value) || 12)}
                  className="w-10 text-center bg-transparent text-white text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => onChangeFontSize(Math.min(96, fontSize + 1))}
                  className="px-1.5 py-0.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                >
                  +
                </button>
              </div>
            )}

            {/* Formato: Negrita, Cursiva */}
            <div className="flex items-center gap-1">
              {onToggleBold && (
                <button
                  type="button"
                  onClick={onToggleBold}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                    isBold
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'border-zinc-700 bg-black/40 text-zinc-400 hover:text-white'
                  }`}
                  title={isEs ? 'Negrita' : 'Bold'}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
              )}
              {onToggleItalic && (
                <button
                  type="button"
                  onClick={onToggleItalic}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                    isItalic
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'border-zinc-700 bg-black/40 text-zinc-400 hover:text-white'
                  }`}
                  title={isEs ? 'Cursiva' : 'Italic'}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Colores predeterminados + Custom */}
            {onChangeTextColor && (
              <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-800">
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                <div className="flex items-center gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onChangeTextColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                        textColor.toLowerCase() === c.toLowerCase()
                          ? 'border-white scale-125 shadow-md'
                          : 'border-zinc-700 opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => onChangeTextColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border border-zinc-700 bg-transparent p-0"
                    title={isEs ? 'Color personalizado' : 'Custom color'}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* PROPIEDADES DE FORMA / RESALTADOR */}
        {(selectedType === 'shape' || selectedType === 'annotation') && (
          <>
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>{isEs ? 'Forma / Anotación:' : 'Shape / Annotation:'}</span>
            </div>

            {/* Color de trazo */}
            {onChangeStrokeColor && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 text-[11px]">{isEs ? 'Trazo:' : 'Stroke:'}</span>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onChangeStrokeColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border border-zinc-700 bg-transparent p-0"
                />
              </div>
            )}

            {/* Grosor de trazo */}
            {onChangeStrokeWidth && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-400 text-[11px]">{isEs ? 'Grosor:' : 'Width:'}</span>
                <select
                  value={strokeWidth}
                  onChange={(e) => onChangeStrokeWidth(Number(e.target.value) || 2)}
                  className="bg-black/60 border border-zinc-700 rounded-lg px-2 py-0.5 text-xs text-white cursor-pointer"
                >
                  <option value={1}>1 px</option>
                  <option value={2}>2 px</option>
                  <option value={4}>4 px</option>
                  <option value={6}>6 px</option>
                  <option value={8}>8 px</option>
                </select>
              </div>
            )}

            {/* Color de relleno */}
            {onChangeFillColor && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 text-[11px]">{isEs ? 'Relleno:' : 'Fill:'}</span>
                <input
                  type="color"
                  value={fillColor || '#ffffff'}
                  onChange={(e) => onChangeFillColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border border-zinc-700 bg-transparent p-0"
                />
                <button
                  type="button"
                  onClick={() => onChangeFillColor('')}
                  className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  {isEs ? 'Sin relleno' : 'Transparent'}
                </button>
              </div>
            )}

            {/* Opacidad */}
            {onChangeOpacity && (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 text-[11px]">{isEs ? 'Opacidad:' : 'Opacity:'}</span>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => onChangeOpacity(Number(e.target.value))}
                  className="w-16 accent-blue-500 cursor-pointer"
                />
                <span className="text-[10px] text-zinc-400 w-8">{Math.round(opacity * 100)}%</span>
              </div>
            )}
          </>
        )}

        {/* PROPIEDADES DE IMAGEN / SELLO */}
        {(selectedType === 'image' || selectedType === 'stamp') && (
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="text-emerald-400 font-bold">
              {selectedType === 'stamp'
                ? isEs
                  ? 'Sello Oficial'
                  : 'Stamp'
                : isEs
                  ? 'Imagen Insertada'
                  : 'Image'}
            </span>
            <span className="text-[11px] text-zinc-500">
              {isEs
                ? '(Arrastra para mover o usa la esquina para redimensionar)'
                : '(Drag to move or use corner to resize)'}
            </span>
          </div>
        )}
      </div>

      {/* Lado derecho: Acciones de confirmación y eliminación */}
      <div className="flex items-center gap-2">
        {onApply && (
          <button
            type="button"
            onClick={onApply}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isEs ? 'Aplicar' : 'Apply'}</span>
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isEs ? 'Cancelar' : 'Cancel'}</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/50 p-1.5 rounded-lg cursor-pointer transition-colors hover:text-white"
            title={isEs ? 'Eliminar elemento' : 'Delete item'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
