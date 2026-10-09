import React, { useState } from 'react';
import { LeaveRequest, Student } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { Calendar, CheckCircle2, XCircle, Clock, PlusCircle, AlertCircle, UserCheck } from 'lucide-react';

interface LeaveManagementViewProps {
  students: Student[];
  leaveRequests: LeaveRequest[];
  orgInfo: OrgCategoryInfo;
  onUpdateLeaveStatus: (requestId: string, status: 'Approved' | 'Rejected') => void;
  onAddLeaveRequest: (request: LeaveRequest) => void;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  students,
  leaveRequests,
  orgInfo,
  onUpdateLeaveStatus,
  onAddLeaveRequest,
}) => {
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState<string>(students[0]?.id || '');
  const [leaveType, setLeaveType] = useState<'Medical' | 'Casual' | 'Annual' | 'Maternity'>('Casual');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const member = students.find((s) => s.id === selectedMemberId);
    if (!member) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newRequest: LeaveRequest = {
      id: `lv-${Date.now()}`,
      memberId: member.id,
      memberName: member.nameBangla,
      roll: member.roll,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason || 'ব্যক্তিগত প্রয়োজনে ছুটির আবেদন',
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    onAddLeaveRequest(newRequest);
    setShowApplyModal(false);
    setReason('');
  };

  const pendingCount = leaveRequests.filter(r => r.status === 'Pending').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'Rejected').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">ছুটি ব্যবস্থাপনা ও ব্যালেন্স ট্র্যাকার</span>
          </div>
          <h2 className="text-xl font-extrabold">{orgInfo.terminology.orgCategoryName} - ছুটির আবেদন ও অনুমোদন</h2>
          <p className="text-xs text-slate-300 mt-1">
            নৈমিত্তিক, অসুস্থতাজনিত ও বাৎসরিক ছুটির অনুমোদন এবং স্বয়ংক্রিয় হাজিরা এডজাস্টমেন্ট
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>নতুন ছুটির আবেদন</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>অপেক্ষমান আবেদন (Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingCount} টি</p>
          <span className="text-[11px] text-slate-500">এডমিন অনুমোদনের অপেক্ষায়</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>অনুমোদিত ছুটি (Approved)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{approvedCount} টি</p>
          <span className="text-[11px] text-slate-500">চলতি মাসের ছাড়কৃত ছুটি</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>বাতিলকৃত আবেদন (Rejected)</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{rejectedCount} টি</p>
          <span className="text-[11px] text-slate-500">পুনঃআবেদনের নির্দেশনাসহ</span>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <span>ছুটির আবেদনের তালিকা</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">মোট: {leaveRequests.length} টি</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">{orgInfo.terminology.memberLabel}</th>
                <th className="px-4 py-3">{orgInfo.terminology.idLabel}</th>
                <th className="px-4 py-3">ছুটির ধরন</th>
                <th className="px-4 py-3">সময়সীমা</th>
                <th className="px-4 py-3">মোট দিন</th>
                <th className="px-4 py-3">কারণ</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right">অনুমোদন অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {leaveRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    {req.memberName}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                    {req.roll}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      {req.leaveType === 'Medical' ? 'মেডিকেল ছুটি' : req.leaveType === 'Casual' ? 'নৈমিত্তিক ছুটি' : req.leaveType === 'Annual' ? 'বাৎসরিক ছুটি' : 'মাতৃত্বকালীন ছুটি'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                    {req.startDate} থেকে {req.endDate}
                  </td>
                  <td className="px-4 py-3.5 font-extrabold text-indigo-600 dark:text-indigo-400">
                    {req.totalDays} দিন
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                    {req.reason}
                  </td>
                  <td className="px-4 py-3.5">
                    {req.status === 'Approved' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                        অনুমোদিত (Approved)
                      </span>
                    ) : req.status === 'Rejected' ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                        বাতিল (Rejected)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                        অপেক্ষমান (Pending)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    {req.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => onUpdateLeaveStatus(req.id, 'Approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition"
                        >
                          অনুমোদন
                        </button>
                        <button
                          onClick={() => onUpdateLeaveStatus(req.id, 'Rejected')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition"
                        >
                          বাতিল
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              ছুটির আবেদন জমা দিন
            </h3>

            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{orgInfo.terminology.memberLabel} নির্বাচন করুন</label>
                {students.length > 0 ? (
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                        {s.nameBangla} ({s.roll})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-600">কোনো কর্মী/শিক্ষার্থী তালিকাভুক্ত নেই।</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ছুটির ধরন</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Casual" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">নৈমিত্তিক ছুটি (Casual Leave)</option>
                  <option value="Medical" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">মেডিকেল ছুটি (Medical Leave)</option>
                  <option value="Annual" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">বাৎসরিক ছুটি (Annual Leave)</option>
                  <option value="Maternity" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">মাতৃত্বকালীন ছুটি (Maternity Leave)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">শুরুর তারিখ</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">শেষের তারিখ</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ছুটির কারণ</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="ছুটির স্পষ্ট কারণ লিখুন..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                >
                  আবেদন জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
