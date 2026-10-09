import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Navigation, 
  Radio, 
  Compass, 
  Wifi, 
  Save, 
  Sliders, 
  Building2, 
  Sparkles, 
  Check, 
  AlertTriangle,
  Layers,
  Info,
  Plus
} from 'lucide-react';
import { OrganizationScheduleSettings, GeofenceSettings } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { calculateDistanceMeters, getStoredScheduleSettings } from '../utils/scheduleConfig';

interface GeofenceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgInfo: OrgCategoryInfo;
  scheduleSettings?: OrganizationScheduleSettings;
  onSaveSettings?: (newSettings: OrganizationScheduleSettings) => void;
}

export const GeofenceScannerModal: React.FC<GeofenceScannerModalProps> = ({
  isOpen,
  onClose,
  orgInfo,
  scheduleSettings,
  onSaveSettings,
}) => {
  const currentSettings = scheduleSettings || getStoredScheduleSettings();
  const [localGeofence, setLocalGeofence] = useState<GeofenceSettings>(currentSettings.geofence);
  
  // Real-time GPS verification states
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userLiveCoords, setUserLiveCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [liveDistance, setLiveDistance] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [extraWifiInput, setExtraWifiInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const active = scheduleSettings || getStoredScheduleSettings();
      setLocalGeofence(active.geofence);
      setGpsError(null);
      // Auto test user's current distance on modal open
      fetchUserCurrentLocation();
    }
  }, [isOpen, scheduleSettings]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchUserCurrentLocation = () => {
    setIsLocating(true);
    setGpsError(null);

    if (!('geolocation' in navigator)) {
      setGpsError('আপনার ব্রাউজারে জিও-লোকেশন সাপোর্ট নেই।');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 10);

        setUserLiveCoords({ lat, lng, accuracy });
        
        // Calculate distance from target geofence
        const dist = Math.round(calculateDistanceMeters(lat, lng, localGeofence.latitude, localGeofence.longitude));
        setLiveDistance(dist);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation read error:', err);
        setGpsError('GPS লোকেশন এক্সেস পাওয়া যায়নি। অনুগ্রহ করে ব্রাউজারে লোকেশন পারমিশন অন করুন।');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCaptureAsOfficeCoordinates = () => {
    setIsLocating(true);
    setGpsError(null);

    if (!('geolocation' in navigator)) {
      setGpsError('আপনার ব্রাউজারে জিও-লোকেশন সাপোর্ট নেই।');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 10);

        setUserLiveCoords({ lat, lng, accuracy });
        setLocalGeofence(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setLiveDistance(0);
        setIsLocating(false);
        showToast(`সফলভাবে বর্তমান GPS লোকেশন সেট করা হয়েছে (Lat: ${lat}, Lng: ${lng})`);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsError('GPS লোকেশন পাওয়া যায়নি। অনুগ্রহ করে ডিভাইস লোকেশন অন করুন।');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveAll = () => {
    const updatedFullSettings: OrganizationScheduleSettings = {
      ...currentSettings,
      geofence: localGeofence
    };

    if (onSaveSettings) {
      onSaveSettings(updatedFullSettings);
    }
    showToast('অফিস পরিধি সীমানা ও GPS জিওফেন্স সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const isWithinRadius = liveDistance !== null ? liveDistance <= localGeofence.radiusMeters : true;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-60 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 animate-slideDown">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-scaleUp">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-md">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  ম্যানেজমেন্ট এরিয়া: অফিস লোকেশন ও Wi-Fi কনফিগারেশন
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  পরিধি ও Wi-Fi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                অফিস / ক্যাম্পাস পরিধি সীমানা, GPS কো-অর্ডিনেট ও অফিস Wi-Fi ভেরিফিকেশন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-800 dark:text-slate-200">
          
          {/* Section 1: Master Geofence Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
            <div className="space-y-0.5 pr-2">
              <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                GPS জিওফেন্সিং ভেরিফিকেশন সক্রিয় করুন
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                সক্রিয় থাকলে কর্মীরা শুধুমাত্র অনুমোদিত অফিস/ক্যাম্পাস সীমানার ভেতর থেকে হাজিরা দিতে পারবেন।
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={localGeofence.enabled}
                onChange={(e) => setLocalGeofence(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Section 2: Real-time GPS Coordinate Auto-Capture */}
          <div className="bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-extrabold text-xs text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  বর্তমান অবস্থান থেকে স্বয়ংক্রিয় GPS কোঅর্ডিনেট সেট করুন
                </p>
                <p className="text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                  আপনি যদি বর্তমানে অফিসে থাকেন, তবে নিচের বাটনে ক্লিক করলে বর্তমান অক্ষাংশ ও দ্রাঘিমাংশ স্বয়ংক্রিয়ভাবে বসে যাবে।
                </p>
              </div>

              <button
                onClick={handleCaptureAsOfficeCoordinates}
                disabled={isLocating}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-md transition cursor-pointer shrink-0"
              >
                {isLocating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>GPS খোঁজা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5" />
                    <span>আমার বর্তমান GPS লোকেশন নিন</span>
                  </>
                )}
              </button>
            </div>

            {gpsError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center space-x-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}
          </div>

          {/* Section 3: Coordinates & Location Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-1">
              <label className="block font-extrabold text-slate-900 dark:text-slate-100 mb-1.5">
                অফিস / ক্যাম্পাস নাম *
              </label>
              <input
                type="text"
                value={localGeofence.name || ''}
                onChange={(e) => setLocalGeofence(prev => ({ ...prev, name: e.target.value }))}
                placeholder="যেমন: প্রধান কার্যালয়, ঢাকা"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-900 dark:text-slate-100 mb-1.5">
                ল্যাটিটিউড (Latitude) *
              </label>
              <input
                type="number"
                step="0.000001"
                value={localGeofence.latitude}
                onChange={(e) => setLocalGeofence(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                placeholder="23.777176"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-900 dark:text-slate-100 mb-1.5">
                লঙ্গিটিউড (Longitude) *
              </label>
              <input
                type="number"
                step="0.000001"
                value={localGeofence.longitude}
                onChange={(e) => setLocalGeofence(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                placeholder="90.399452"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 4: Boundary Radius (Meters) Slider */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                অনুমোদিত পরিধি ব্যাসার্ধ (Allowed Radius):
              </label>
              <span className="px-3 py-1 bg-emerald-600 text-white font-mono font-black text-xs rounded-xl shadow-xs">
                {localGeofence.radiusMeters} মিটার
              </span>
            </div>

            <input
              type="range"
              min={20}
              max={1000}
              step={10}
              value={localGeofence.radiusMeters}
              onChange={(e) => setLocalGeofence(prev => ({ ...prev, radiusMeters: parseInt(e.target.value) }))}
              className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span>২০ মিটার (টাইট জোন)</span>
              <span>২০০ মিটার (স্ট্যান্ডার্ড ক্যাম্পাস)</span>
              <span>১০০০ মিটার (বড় এলাকা)</span>
            </div>
          </div>

          {/* Section 5: Real-time Live Distance & Radar Verification Feedback */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                  লাইভ লোকেশন ও দূরত্ব ভেরিফিকেশন
                </span>
              </div>

              <button
                onClick={fetchUserCurrentLocation}
                disabled={isLocating}
                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-[11px] rounded-lg flex items-center space-x-1 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>রিফ্রেশ টেস্ট</span>
              </button>
            </div>

            {userLiveCoords ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-500 font-bold">আপনার বর্তমান লাইভ জিপিএস</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {userLiveCoords.lat}, {userLiveCoords.lng}
                    </p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-0.5">
                      নির্ভুলতা: ±{userLiveCoords.accuracy} মিটার
                    </p>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-500 font-bold">অফিস কেন্দ্রবিন্দু থেকে দূরত্ব</p>
                    <p className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      {liveDistance !== null ? `${liveDistance} মিটার` : 'গণনা করা হচ্ছে...'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      অনুমোদিত সর্বোচ্চ: {localGeofence.radiusMeters} মিটার
                    </p>
                  </div>
                </div>

                {/* Status Indicator Banner */}
                <div className={`p-3 rounded-xl flex items-center space-x-2.5 border font-bold text-xs ${
                  isWithinRadius
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                }`}>
                  {isWithinRadius ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p>✓ আপনি বর্তমানে অনুমোদিত অফিস পরিধির ভিতরে অবস্থান করছেন।</p>
                        <p className="text-[10px] font-normal opacity-80">কর্মীরা এই অবস্থানে থেকে সফলভাবে হাজিরা দিতে সক্ষম হবেন।</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <div>
                        <p>⚠ আপনি বর্তমানে নির্ধারিত অফিস সীমানার বাইরে ({liveDistance} মিটার দূরে) আছেন!</p>
                        <p className="text-[10px] font-normal opacity-80">কড়া জিওফেন্সিং সক্রিয় থাকলে এই অবস্থান থেকে হাজিরা সাবমিট হবে না।</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-center text-slate-500 text-xs border border-slate-200 dark:border-slate-700">
                {isLocating ? 'স্যাটেলাইট জিপিএস সিগন্যাল যাচাই করা হচ্ছে...' : 'লাইভ দূরত্ব যাচাই করতে উপরের বাটনে চাপুন।'}
              </div>
            )}
          </div>

          {/* Section 6: Additional Security Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
              <input
                type="checkbox"
                id="strictGeofenceCheck"
                checked={localGeofence.strictMode}
                onChange={(e) => setLocalGeofence(prev => ({ ...prev, strictMode: e.target.checked }))}
                className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <label htmlFor="strictGeofenceCheck" className="font-extrabold text-xs text-slate-900 dark:text-slate-100 cursor-pointer">
                  কড়া জিওফেন্স এনফোর্সমেন্ট (Strict Mode)
                </label>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  পরিধির বাইরে থাকলে কোনোভাবেই হাজিরা গ্রহণ করা হবে না।
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
              <input
                type="checkbox"
                id="blockMockGpsCheck"
                checked={localGeofence.blockMockLocations}
                onChange={(e) => setLocalGeofence(prev => ({ ...prev, blockMockLocations: e.target.checked }))}
                className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <label htmlFor="blockMockGpsCheck" className="font-extrabold text-xs text-slate-900 dark:text-slate-100 cursor-pointer">
                  মক / ফেক GPS লোকেশন অ্যাপ প্রতিরোধ
                </label>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  মোবাইলে Fake GPS স্পুফিং অ্যাপ স্বয়ংক্রিয়ভাবে ব্লক করবে।
                </p>
              </div>
            </div>
          </div>

          {/* Section 7: Wi-Fi Restriction & Management Area Network */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5 text-xs">
                <Wifi className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>অফিস Wi-Fi নেটওয়ার্ক সেটিংস (SSID)</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-bold text-teal-700 dark:text-teal-300">
                <input
                  type="checkbox"
                  checked={localGeofence.requireWifi || false}
                  onChange={(e) => setLocalGeofence(prev => ({ ...prev, requireWifi: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span>Wi-Fi বাধ্যতামূলক করুন</span>
              </label>
            </div>

            {/* Primary Wi-Fi */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                প্রাথমিক Wi-Fi SSID *
              </label>
              <input
                type="text"
                value={localGeofence.wifiSSID || localGeofence.wifiSsid || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalGeofence(prev => ({ ...prev, wifiSSID: val, wifiSsid: val }));
                }}
                placeholder="যেমন: Office_WiFi_5G"
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden text-xs"
              />
            </div>

            {/* Multiple Wi-Fi Networks */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                অতিরিক্ত ব্যাকআপ Wi-Fi তালিকা
              </label>

              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                {(!localGeofence.wifiNetworks || localGeofence.wifiNetworks.length === 0) && (
                  <span className="text-[10px] text-slate-400">কোনো অতিরিক্ত Wi-Fi নেই</span>
                )}
                {localGeofence.wifiNetworks?.map((ssid) => (
                  <span
                    key={ssid}
                    className="px-2.5 py-0.5 bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 rounded-lg text-xs font-mono font-bold flex items-center space-x-1 border border-teal-300 dark:border-teal-700"
                  >
                    <span>{ssid}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (localGeofence.wifiNetworks || []).filter(s => s !== ssid);
                        setLocalGeofence(prev => ({ ...prev, wifiNetworks: updated }));
                      }}
                      className="p-0.5 hover:bg-teal-200 rounded text-teal-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2 pt-1">
                <input
                  type="text"
                  value={extraWifiInput}
                  onChange={(e) => setExtraWifiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = extraWifiInput.trim();
                      if (val) {
                        const current = localGeofence.wifiNetworks || [];
                        if (!current.includes(val)) {
                          setLocalGeofence(prev => ({ ...prev, wifiNetworks: [...current, val] }));
                          setExtraWifiInput('');
                        }
                      }
                    }
                  }}
                  placeholder="অন্যান্য রাউটার SSID..."
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:border-teal-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = extraWifiInput.trim();
                    if (val) {
                      const current = localGeofence.wifiNetworks || [];
                      if (!current.includes(val)) {
                        setLocalGeofence(prev => ({ ...prev, wifiNetworks: [...current, val] }));
                        setExtraWifiInput('');
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>যোগ</span>
                </button>
              </div>
            </div>

            {/* Router MAC & IP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                  রাউটার BSSID / MAC (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={localGeofence.bssid || ''}
                  onChange={(e) => setLocalGeofence(prev => ({ ...prev, bssid: e.target.value }))}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                  অফিস পাবলিক IP (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={localGeofence.ipWhitelist || ''}
                  onChange={(e) => setLocalGeofence(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                  placeholder="103.145.0.0/16"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            বাতিল
          </button>

          <button
            onClick={handleSaveAll}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-950/20 cursor-pointer transition active:scale-95 border border-emerald-400/30"
          >
            <Save className="w-4 h-4" />
            <span>পরিবর্তন সংরক্ষণ করুন</span>
          </button>
        </div>

      </div>
    </div>
  );
};
