import React, { useState } from 'react';
import { AcademicSchedule } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { GraduationCap, BookOpen, Clock, Calendar, Award, CheckCircle2 } from 'lucide-react';

interface AcademicViewProps {
  schedules: AcademicSchedule[];
  orgInfo: OrgCategoryInfo;
}

export const AcademicView: React.FC<AcademicViewProps> = ({
  schedules,
  orgInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'routine' | 'results'>('routine');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">শিক্ষা প্রতিষ্ঠান অ্যাকাডেমিক হাব</span>
          </div>
          <h2 className="text-xl font-extrabold">{orgInfo.terminology.orgCategoryName} - ক্লাস রুটিন ও পরীক্ষার ফল</h2>
          <p className="text-xs text-slate-300 mt-1">
            দৈনন্দিন বিষভিত্তিক রুটিন, রুম অ্যাসাইনমেন্ট ও পরীক্ষার নম্বরপত্র
          </p>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'routine' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            ক্লাস রুটিন
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'results' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            পরীক্ষার ফলাফল
          </button>
        </div>
      </div>

      {/* Routine Grid */}
      {activeTab === 'routine' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-lg text-xs font-extrabold">
                  {sch.timeSlot}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {sch.roomNo}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {sch.subjectName}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  শিক্ষক: {sch.teacherName}
                </p>
              </div>

              {sch.examName && (
                <div className="pt-2 border-t text-xs font-bold text-indigo-600 flex items-center justify-between">
                  <span>পরবর্তী মূল্যায়ন: {sch.examName}</span>
                  <span>পাশ নম্বর: {sch.passMark}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-3">
          <Award className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="font-extrabold text-base">সাময়িক ও টার্ম পরীক্ষার মার্কশিট</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            পরীক্ষার নম্বরপত্র ও অভিভাবক SMS পোর্টাল সক্রিয় রয়েছে। ডিজিটাল রিপোর্ট কার্ড ও অনলাইন মার্কস আপলোড ব্যবস্থা বিদ্যমান।
          </p>
        </div>
      )}

    </div>
  );
};
