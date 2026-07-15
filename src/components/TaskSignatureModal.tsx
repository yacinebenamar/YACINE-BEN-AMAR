import React, { useRef, useState, useEffect } from 'react';
import { CompanyTask } from '../types';
import { PenTool, MapPin, RotateCcw, Check, X, ShieldCheck, HelpCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Geolocation as CapGeolocation } from '@capacitor/geolocation';

interface TaskSignatureModalProps {
  task: CompanyTask;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureImage: string, locationGPS: { lat: number; lng: number } | null) => void;
}

export default function TaskSignatureModal({ task, isOpen, onClose, onConfirm }: TaskSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  // Fetch GPS Coordinates on mount
  useEffect(() => {
    if (!isOpen) return;

    setGpsLoading(true);
    setGpsError(null);

    const getGPS = async () => {
      // 1. Try Capacitor native Geolocation first on mobile devices
      if (Capacitor.isNativePlatform()) {
        try {
          const position = await CapGeolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 8000,
          });
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGpsLoading(false);
          return;
        } catch (err) {
          console.warn('Capacitor GPS location request failed, trying browser fallback:', err);
        }
      }

      // 2. Web browser fallback
      if (!('geolocation' in navigator)) {
        setGpsError('متصفحك لا يدعم نظام تحديد المواقع GPS');
        setGpsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGpsLoading(false);
        },
        (error) => {
          console.warn('Browser GPS location request failed:', error);
          let errorMsg = 'تعذر الحصول على الموقع الجغرافي';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'تم رفض إذن تحديد الموقع الجغرافي من المتصفح';
          }
          setGpsError(errorMsg);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    };

    getGPS();
  }, [isOpen]);

  // Adjust canvas high-DPI scaling
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw background placeholder text once
    ctx.strokeStyle = '#76BC21';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    ctx.fillStyle = '#000839';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setIsCanvasEmpty(true);
  }, [isOpen]);

  if (!isOpen) return null;

  // Drawing helper methods (Mouse + Touch support)
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setIsCanvasEmpty(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000839';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsCanvasEmpty(true);
  };

  const handleConfirmClick = () => {
    const canvas = canvasRef.current;
    if (!canvas || isCanvasEmpty) return;

    // Convert canvas to base64 PNG data URL
    const signatureImage = canvas.toDataURL('image/png');
    onConfirm(signatureImage, gpsCoords);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white dark:bg-[#050E46] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleIn text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#76BC21]/15 rounded-xl flex items-center justify-center text-[#76BC21]">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">تأكيد الإنجاز وتوقيع المهمة</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">التوقيع الرقمي وإثبات الموقع الميداني للأندرويد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Title Card */}
        <div className="bg-[#f8fafc] dark:bg-[#000839] p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[9px] font-black bg-[#76BC21]/10 text-[#76BC21] px-2 py-0.5 rounded-md">
            {task.categoryName}
          </span>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{task.title}</h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
        </div>

        {/* GPS location proof status */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-500">خاصية توثيق الحضور الجغرافي</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <span>تحديد موقع العمل</span>
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          </div>

          {gpsLoading ? (
            <div className="flex items-center gap-2 text-[10px] text-amber-400 animate-pulse">
              <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
              <span>جاري الاتصال بالأقمار الصناعية GPS للحصول على إحداثيات دقيقة...</span>
            </div>
          ) : gpsCoords ? (
            <div className="flex items-center justify-between text-[10px] bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-xl">
              <div className="text-emerald-400 font-mono text-left" dir="ltr">
                Lat: {gpsCoords.lat.toFixed(6)}, Lng: {gpsCoords.lng.toFixed(6)}
              </div>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                تم قفل الموقع بنجاح
              </span>
            </div>
          ) : (
            <div className="text-[10px] bg-amber-500/5 border border-amber-500/10 p-2 rounded-xl text-amber-400 leading-relaxed">
              ⚠️ {gpsError || 'تعذر جلب إحداثيات الـ GPS. يمكنك إتمام التوقيع بدونه.'}
            </div>
          )}
        </div>

        {/* Signature drawing pad */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={clearCanvas}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة رسم التوقيع</span>
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <span>وقع بإصبعك داخل الإطار أدناه</span>
              <PenTool className="w-3.5 h-3.5 text-[#76BC21]" />
            </span>
          </div>

          <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-[#f8fafc] dark:bg-[#000839]">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-40 cursor-crosshair block touch-none"
            />
            {isCanvasEmpty && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-600 select-none space-y-1">
                <PenTool className="w-6 h-6 stroke-[1.5]" />
                <span className="text-[10px] font-bold">بصمة التوقيع الرقمي للموظف</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            onClick={handleConfirmClick}
            disabled={isCanvasEmpty}
            className="flex-1 bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>تأكيد الإنجاز وإرسال التوقيع</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold px-5 py-3 rounded-xl text-xs cursor-pointer transition-all duration-200"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
