import React, { useState } from 'react';
import { SomityTransaction, Student } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { Users, PiggyBank, Receipt, PlusCircle, CheckCircle2, Search, Printer, DollarSign, Calendar, FileText } from 'lucide-react';

interface SomityViewProps {
  students: Student[];
  transactions: SomityTransaction[];
  orgInfo: OrgCategoryInfo;
  onAddTransaction: (tx: SomityTransaction) => void;
}

export const SomityView: React.FC<SomityViewProps> = ({
  students,
  transactions,
  orgInfo,
  onAddTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<SomityTransaction | null>(null);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState<string>(students[0]?.id || '');
  const [savingsInput, setSavingsInput] = useState<number>(1000);
  const [loanInstallmentInput, setLoanInstallmentInput] = useState<number>(1500);
  const [fineInput, setFineInput] = useState<number>(0);
  const [meetingAttendedInput, setMeetingAttendedInput] = useState<boolean>(true);

  const handleRecordDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = students.find((s) => s.id === selectedMemberId);
    if (!member) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newTx: SomityTransaction = {
      id: `som-tx-${Date.now()}`,
      memberId: member.id,
      memberName: member.nameBangla,
      passbookNo: member.roll || 'SOM-100',
      date: dateStr,
      time: timeStr,
      savingsDeposit: savingsInput,
      loanInstallment: loanInstallmentInput,
      fineAmount: fineInput,
      meetingAttended: meetingAttendedInput,
      receiptNo: `RCT-${Math.floor(10000 + Math.random() * 90000)}`,
      collectedBy: 'কোষাধ্যক্ষ স্বপন কান্তি'
    };

    onAddTransaction(newTx);
    setShowDepositModal(false);
  };

  const totalSavingsCollected = transactions.reduce((sum, t) => sum + t.savingsDeposit, 0);
  const totalLoanCollected = transactions.reduce((sum, t) => sum + t.loanInstallment, 0);
  const totalFinesCollected = transactions.reduce((sum, t) => sum + t.fineAmount, 0);

  const filteredMembers = students.filter(
    (s) =>
      s.nameBangla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">নাগরিক সমিতি ও সমবায় সংস্করণ</span>
          </div>
          <h2 className="text-xl font-extrabold">সমিতি সদস্য হাজিরা, সঞ্চয় ও ঋণ মডিউল</h2>
          <p className="text-xs text-slate-300 mt-1">
            সাধারণ সভা হাজিরা, সাপ্তাহিক/মাসিক সঞ্চয় জমা, ঋণ কিস্তি এবং জরিমানার ডিজিটাল রসিদ
          </p>
        </div>

        <button
          onClick={() => setShowDepositModal(true)}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>সঞ্চয় ও কিস্তি জমা নিন</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>মোট সঞ্চয় আমানত</span>
            <PiggyBank className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">৳ {totalSavingsCollected.toLocaleString('bn-BD')}</p>
          <span className="text-[11px] text-slate-500">সমিতি ব্যাংকিং ফান্ড</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>মোট ঋণ কিস্তি আদায়</span>
            <Receipt className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-black text-teal-600">৳ {totalLoanCollected.toLocaleString('bn-BD')}</p>
          <span className="text-[11px] text-slate-500">অনুকূল ঋণ রিকভারি</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>অনুপস্থিতি জরিমানা ফান্ড</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">৳ {totalFinesCollected.toLocaleString('bn-BD')}</p>
          <span className="text-[11px] text-slate-500">সভার অনুপস্থিতি ফি</span>
        </div>
      </div>

      {/* Somity Transactions Ledger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">সমিতি লেজার ও সভা হাজিরা রসিদসমূহ</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="সদস্যের নাম বা বই নং দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">রসিদ নম্বর</th>
                <th className="px-4 py-3">সদস্যের নাম</th>
                <th className="px-4 py-3">পাসবুক নং</th>
                <th className="px-4 py-3">তারিখ ও সময়</th>
                <th className="px-4 py-3">সভা হাজিরা</th>
                <th className="px-4 py-3">সঞ্চয় জমা</th>
                <th className="px-4 py-3">ঋণ কিস্তি</th>
                <th className="px-4 py-3">জরিমানা</th>
                <th className="px-4 py-3 text-right">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                    {tx.receiptNo}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {tx.memberName}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                    {tx.passbookNo}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {tx.date} ({tx.time})
                  </td>
                  <td className="px-4 py-3">
                    {tx.meetingAttended ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        সভায় উপস্থিত
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                        অনুপস্থিত
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600">
                    +৳{tx.savingsDeposit}
                  </td>
                  <td className="px-4 py-3 font-bold text-teal-600">
                    +৳{tx.loanInstallment}
                  </td>
                  <td className="px-4 py-3 font-bold text-amber-600">
                    ৳{tx.fineAmount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedTxForReceipt(tx)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[11px] inline-flex items-center space-x-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>রসিদ প্রিন্ট</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-center border-b pb-3">
              <h3 className="font-extrabold text-base text-emerald-800 uppercase">নাগরিক সমিতি টাকা আদায় রসিদ</h3>
              <p className="text-xs text-slate-500 font-semibold">রসিদ নং: {selectedTxForReceipt.receiptNo}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">সদস্যের নাম:</span>
                <span className="font-bold">{selectedTxForReceipt.memberName}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">পাসবুক / বই নম্বর:</span>
                <span className="font-bold font-mono text-emerald-600">{selectedTxForReceipt.passbookNo}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">তারিখ ও সময়:</span>
                <span className="font-medium">{selectedTxForReceipt.date} {selectedTxForReceipt.time}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">সাধারণ সভা উপস্থিতি:</span>
                <span className="font-bold text-emerald-700">
                  {selectedTxForReceipt.meetingAttended ? 'উপস্থিত' : 'অনুপস্থিত'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border text-xs space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span>সাপ্তাহিক সঞ্চয় জমা:</span>
                <span className="text-emerald-600 font-bold">৳ {selectedTxForReceipt.savingsDeposit}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>ঋণ কিস্তি জমা:</span>
                <span className="text-teal-600 font-bold">৳ {selectedTxForReceipt.loanInstallment}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>অনুপস্থিতি জরিমানা:</span>
                <span className="text-amber-600 font-bold">৳ {selectedTxForReceipt.fineAmount}</span>
              </div>
              <div className="border-t pt-1.5 flex justify-between font-extrabold text-sm text-slate-900">
                <span>সর্বমোট আদায়কৃত:</span>
                <span className="text-emerald-700">
                  ৳ {(selectedTxForReceipt.savingsDeposit + selectedTxForReceipt.loanInstallment + selectedTxForReceipt.fineAmount).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex justify-between">
              <span>আদায়কারী: {selectedTxForReceipt.collectedBy}</span>
              <span>স্বাক্ষর: _____________</span>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setSelectedTxForReceipt(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              সদস্যের সঞ্চয় ও কিস্তি সংগ্রহ
            </h3>

            <form onSubmit={handleRecordDeposit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">সমিতি সদস্য নির্বাচন করুন</label>
                {students.length > 0 ? (
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                        {s.nameBangla} (বই নং: {s.roll})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-600">কোনো সদস্য তালিকাভুক্ত নেই।</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">সঞ্চয় জমা (৳)</label>
                  <input
                    type="number"
                    value={savingsInput}
                    onChange={(e) => setSavingsInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ঋণ কিস্তি (৳)</label>
                  <input
                    type="number"
                    value={loanInstallmentInput}
                    onChange={(e) => setLoanInstallmentInput(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">অনুপস্থিতি জরিমানা (৳)</label>
                <input
                  type="number"
                  value={fineInput}
                  onChange={(e) => setFineInput(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="meetingCheck"
                  checked={meetingAttendedInput}
                  onChange={(e) => setMeetingAttendedInput(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="meetingCheck" className="font-bold text-slate-800 dark:text-slate-200">
                  আজকের সাধারণ সভায় উপস্থিত ছিলেন
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  সংরক্ষণ ও রসিদ তৈরি
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
