import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('all');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  const statesList = [
    'ALL', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Karnataka', 'Tamil Nadu',
    'Kerala', 'Andhra Pradesh', 'Telangana', 'Madhya Pradesh', 'Uttar Pradesh',
    'Punjab & Haryana', 'Jammu & Kashmir', 'Himachal & Uttarakhand', 'West Bengal',
    'Odisha', 'Bihar & Jharkhand', 'Assam & Northeast'
  ];

  const handleDownload = (format: 'pdf' | 'csv' | 'xlsx') => {
    const url = api.getReportDownloadUrl(format, reportType);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AEROGUARD_Report_${reportType}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-7 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>AEROGUARD Report Generation & Compliance Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Export official meteorological quality assurance dossiers in PDF, CSV, and multi-sheet Excel (XLSX) formats.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
          WMO-No. 8 Standards Compliant
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Options (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Type Selector */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">1. Select Synoptic Report Package</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'all', title: 'Comprehensive Synoptic Dossier', desc: 'Full network KPIs, observations, active alerts, and maintenance logs' },
                { id: 'anomalies', title: 'Anomaly & Fault Audit Report', desc: 'In-depth log of flagged sensor faults, drift, and confirmed weather events' },
                { id: 'sensor_health', title: 'Sensor Reliability Matrix', desc: 'MTBF, degradation scores, and urgent maintenance priorities' },
                { id: 'maintenance', title: 'Maintenance & Work Orders', desc: 'Engineering field dispatches, status logs, and resolution tracking' },
                { id: 'stations', title: 'AWS Network Topology Registry', desc: 'Complete metadata of 1,248 stations, coordinates, and regional groups' },
                { id: 'observations', title: 'Continuous Observation Telemetry', desc: '15-minute observations for temperature, humidity, and barometric pressure' }
              ].map((rpt) => (
                <div
                  key={rpt.id}
                  onClick={() => setReportType(rpt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === rpt.id
                      ? 'bg-teal-50/70 border-teal-500 text-slate-800 shadow-sm'
                      : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{rpt.title}</span>
                    {reportType === rpt.id && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">{rpt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Customization */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">2. Geographic & Anomaly Scope</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Regional State Scope</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Severity Scope</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Alerts Only</option>
                  <option value="HIGH">High + Critical Alerts</option>
                  <option value="MEDIUM">Medium and Above</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Download Actions & Format Specs (1 col) */}
        <div className="space-y-4">
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-600" />
              <span>Generate & Download Document</span>
            </h2>

            <div className="space-y-3">
              {/* PDF Button */}
              <button
                onClick={() => handleDownload('pdf')}
                className="w-full p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">GENERATE PDF REPORT</span>
                      <span className="text-[10px] text-slate-500 font-sans">Executive tables, charts, & evidence summaries</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                </div>
              </button>

              {/* XLSX Button */}
              <button
                onClick={() => handleDownload('xlsx')}
                className="w-full p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">EXPORT EXCEL (.XLSX)</span>
                      <span className="text-[10px] text-slate-500 font-sans">Multi-sheet workbook: Summary, Stations, Anomalies</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </button>

              {/* CSV Button */}
              <button
                onClick={() => handleDownload('csv')}
                className="w-full p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 hover:border-sky-300 hover:bg-sky-50 text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">EXPORT RAW CSV</span>
                      <span className="text-[10px] text-slate-500 font-sans">Tabular dataset for statistical workflows</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
                </div>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 block mb-0.5">Strict Compliance Note:</span>
              <p>Per operational specifications, reports are exported exclusively in official PDF, CSV, and XLSX formats.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
