import React from 'react';
import { Student, ClassSubject, AttendanceRecord } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { BarChart3, AlertCircle, PieChart, Award, FileSpreadsheet } from 'lucide-react';

interface AnalyticsViewProps {
  classes: ClassSubject[];
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  orgInfo: OrgCategoryInfo;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  classes,
  students,
  attendanceRecords,
  orgInfo,
}) => {
  const { terminology } = orgInfo;

  // Department / Class analytics
  const classAnalytics = classes.map(cls => {
    const clsStudents = students.filter(s => s.classId === cls.id);
    const clsRecords = attendanceRecords.filter(r => r.classId === cls.id);

    const totalRecords = clsRecords.length || 1;
    const presentCount = clsRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const percentage = Math.round((presentCount / totalRecords) * 100);

    return {
      cls,
      studentCount: clsStudents.length,
      presentCount,
      percentage,
    };
  });

  // Identify members with < 75% attendance
  const atRiskStudents = students.filter(student => {
    const records = attendanceRecords.filter(r => r.studentId === student.id);
    if (records.length === 0) return false;
    const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const pct = (present / records.length) * 100;
    return pct < 75;
  });

  return (
    <div className="space-y-5">
      
      {/* Title */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>উপস্থিতি এনালিটিক্স ও রিপোর্ট বিশ্লেষণ ({terminology.orgCategoryName})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {terminology.groupLabel} ভিত্তিক উপস্থিতির হার ও কম উপস্থিতিসম্পন্ন {terminology.memberPlural}র তালিকা
          </p>
        </div>
      </div>

      {/* Group / Department Comparison Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classAnalytics.map(({ cls, studentCount, percentage }) => (
          <div key={cls.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">{cls.classNameBangla}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {cls.subjectName.split(' ')[0]}
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-slate-500">গড় উপস্থিতির হার</span>
                <span className="font-bold text-slate-900">{percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>মোট নিবন্ধিত {terminology.memberLabel}: {studentCount} জন</span>
              <span>দায়িত্বপ্রাপ্ত: {cls.teacherName.split(' ')[0]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Members At Risk (< 75%) Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200/80 bg-rose-50/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-sm text-rose-900">
              কম উপস্থিতিসম্পন্ন {terminology.memberPlural}র তালিকা (৭৫% এর কম)
            </h3>
          </div>
          <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
            মোট {atRiskStudents.length} জন
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3.5 pl-5">{terminology.memberLabel} ও ছবি</th>
                <th className="p-3.5">{terminology.idLabel}</th>
                <th className="p-3.5">{terminology.groupLabel}</th>
                <th className="p-3.5">{terminology.contactLabel}</th>
                <th className="p-3.5 pr-5">উপস্থিতির হার</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {atRiskStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    সবাই সন্তোষজনক উপস্থিতির হার (৭৫%+) বজায় রেখেছেন!
                  </td>
                </tr>
              ) : (
                atRiskStudents.map(student => {
                  const records = attendanceRecords.filter(r => r.studentId === student.id);
                  const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
                  const pct = records.length > 0 ? Math.round((present / records.length) * 100) : 0;

                  return (
                    <tr key={student.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={student.photoUrl}
                            alt={student.nameBangla}
                            className="w-8 h-8 rounded-xl object-cover bg-slate-100 border border-slate-200"
                          />
                          <span className="font-bold text-slate-900">{student.nameBangla}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-slate-800">{student.roll}</td>
                      <td className="p-3.5 text-slate-600">{student.className}</td>
                      <td className="p-3.5 font-mono text-slate-600">{student.guardianPhone}</td>
                      <td className="p-3.5 pr-5 font-bold text-rose-600">{pct}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
