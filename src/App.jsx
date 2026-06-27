import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [cycle, setCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);


  const timing = [
    { id: 1, inst: "FLD F6, 34(R2)", op: "Load", dest: "F6", src1: "R2", src2: "", is: 1, ro: 2, ex: 4, wb: 5, unit: "Integer 1" },
    { id: 2, inst: "FLD F2, 45(R3)", op: "Load", dest: "F2", src1: "R3", src2: "", is: 2, ro: 3, ex: 5, wb: 6, unit: "Integer 2" },
    { id: 3, inst: "FMUL.D F0, F2, F4", op: "Mult", dest: "F0", src1: "F2", src2: "F4", is: 3, ro: 7, ex: 17, wb: 18, unit: "FP Mult" },
    { id: 4, inst: "FSUB.D F8, F6, F2", op: "Sub", dest: "F8", src1: "F6", src2: "F2", is: 4, ro: 7, ex: 11, wb: 12, unit: "FP Add" },
    { id: 5, inst: "FDIV.D F10, F0, F6", op: "Div", dest: "F10", src1: "F0", src2: "F6", is: 5, ro: 19, ex: 39, wb: 40, unit: "FP Div" },
    { id: 6, inst: "FADD.D F6, F8, F2", op: "Add", dest: "F6", src1: "F8", src2: "F2", is: 13, ro: 14, ex: 18, wb: 20, unit: "FP Add" }
  ];

  const unitsList = ['Integer 1', 'Integer 2', 'FP Mult', 'FP Add', 'FP Div'];
  const registersList = ['F0', 'F2', 'F4', 'F6', 'F8', 'F10'];

  // 动态计算当前周期的 Scoreboard 状态 (功能部件表 & 寄存器表)
  const getSystemState = (currentCycle) => {
    let fuStatus = unitsList.map(name => ({
      name, busy: 'No', op: '', fi: '', fj: '', fk: '', qj: '', qk: '', rj: ' ', rk: ' '
    }));
    
    let regStatus = {};
    registersList.forEach(r => regStatus[r] = '');

    timing.forEach(inst => {
      if (currentCycle >= inst.is && currentCycle < inst.wb) {
        regStatus[inst.dest] = inst.unit;
      }

      if (currentCycle >= inst.is && currentCycle <= inst.wb) {
        const unitIdx = fuStatus.findIndex(u => u.name === inst.unit);
        if (unitIdx !== -1) {
          let rj = inst.src1 ? 'Yes' : ' ';
          let rk = inst.src2 ? 'Yes' : ' ';
          let qj = '';
          let qk = '';

          if (inst.src1 && inst.src1.startsWith('F')) {
            const dep = timing.slice(0, timing.indexOf(inst)).reverse().find(t => t.dest === inst.src1);
            if (dep && currentCycle < dep.wb) {
              qj = dep.unit;
              rj = 'No';
            }
          }

          if (inst.src2 && inst.src2.startsWith('F')) {
            const dep = timing.slice(0, timing.indexOf(inst)).reverse().find(t => t.dest === inst.src2);
            if (dep && currentCycle < dep.wb) {
              qk = dep.unit;
              rk = 'No';
            }
          }

          fuStatus[unitIdx] = {
            name: inst.unit,
            busy: 'Yes',
            op: inst.op,
            fi: inst.dest,
            fj: inst.src1,
            fk: inst.src2,
            qj, qk, rj, rk
          };
        }
      }
    });

    return { fuStatus, regStatus };
  };

  const { fuStatus, regStatus } = getSystemState(cycle);

  // 自动播放逻辑
  useEffect(() => {
    let interval;
    if (isPlaying && cycle < 40) {
      interval = setInterval(() => {
        setCycle(c => Math.min(c + 1, 40));
      }, 800);
    } else if (cycle >= 40) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, cycle]);

  const getStatus = (val, currentCycle) => (currentCycle < val ? "" : val);
  const isWarHazard = (instId, currentCycle) => (instId === 6 && currentCycle >= 18 && currentCycle < 20);

  return (
    <div className="min-h-screen bg-gray-100 p-4 lg:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 控制面板 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="bg-slate-800 text-white p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-wider flex items-center gap-2">
                Scoreboard 全局状态监控板
              </h1>
              <p className="text-slate-400 mt-1 text-sm">动态推演: 指令状态、部件状态、寄存器状态 (支持 RAW/WAW/WAR 冒险)</p>
            </div>
            <div className="flex items-center gap-6 bg-slate-900 px-6 py-2 rounded-lg border border-slate-700">
              <span className="text-sm text-slate-300 tracking-widest">CLOCK CYCLE</span>
              <span className="text-5xl font-mono font-bold text-emerald-400">{cycle}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-wrap justify-center gap-3">
            <button onClick={() => setCycle(0)} className="flex items-center gap-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium transition-colors">
              <RotateCcw size={16} /> 重置
            </button>
            <button onClick={() => setCycle(c => Math.max(0, c - 1))} disabled={cycle === 0} className="flex items-center gap-1 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded text-sm font-medium transition-colors disabled:opacity-50">
              <SkipBack size={16} /> 上一周期
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className={`flex items-center gap-1 px-6 py-2 rounded text-sm font-bold transition-colors shadow-sm ${isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
              {isPlaying ? <><Pause size={16} /> 暂停</> : <><Play size={16} /> 自动播放</>}
            </button>
            <button onClick={() => setCycle(c => Math.min(40, c + 1))} disabled={cycle === 40} className="flex items-center gap-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors shadow-sm disabled:opacity-50">
               下一周期 <SkipForward size={16} />
            </button>
          </div>
        </div>

        {/* 表格区：上中下布局 */}
        
        {/* 表1：指令状态 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="bg-slate-100 p-3 border-b border-gray-200 font-bold text-slate-700 text-sm">
            表 1: 指令状态 (Instruction Status)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="text-slate-500 uppercase text-xs tracking-wider border-b border-gray-200">
                  <th className="p-3 font-semibold">Instruction</th>
                  <th className="p-3 font-semibold text-center">Issue (IS)</th>
                  <th className="p-3 font-semibold text-center">Read Operands (RO)</th>
                  <th className="p-3 font-semibold text-center">Execute (EX)</th>
                  <th className="p-3 font-semibold text-center">Write Result (WB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timing.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-medium text-slate-800">{row.inst}</td>
                    <td className="p-2 text-center">
                      <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all ${cycle >= row.is ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-transparent'}`}>{getStatus(row.is, cycle)}</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all ${cycle >= row.ro ? 'bg-cyan-100 text-cyan-700 font-bold' : 'text-transparent'}`}>{getStatus(row.ro, cycle)}</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all ${cycle >= row.ex ? 'bg-amber-100 text-amber-700 font-bold' : 'text-transparent'}`}>{getStatus(row.ex, cycle)}</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm transition-all relative
                        ${cycle >= row.wb ? 'bg-emerald-100 text-emerald-700 font-bold' : 'text-transparent'}
                        ${isWarHazard(row.id, cycle) ? 'ring-2 ring-red-500 bg-red-100 animate-pulse text-red-600' : ''}
                      `}>
                        {getStatus(row.wb, cycle)}
                        {isWarHazard(row.id, cycle) && <AlertTriangle size={14} className="absolute -top-1 -right-3 text-red-600" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 核心：Scoreboard 动态双表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 表2：功能部件状态 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 lg:col-span-2">
            <div className="bg-slate-100 p-3 border-b border-gray-200 font-bold text-slate-700 text-sm flex justify-between">
              <span>表 2: 功能部件状态 (Functional Unit Status)</span>
              <span className="font-normal text-xs text-slate-500">动态监控 RAW 数据依赖</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-500 bg-gray-50 border-b border-gray-200">
                    <th className="p-2 border-r">Time</th>
                    <th className="p-2 border-r">Name</th>
                    <th className="p-2 border-r text-center">Busy</th>
                    <th className="p-2 border-r">Op</th>
                    <th className="p-2 border-r">F_i<br/><span className="text-[10px] font-normal text-gray-400">Dest</span></th>
                    <th className="p-2 border-r">F_j<br/><span className="text-[10px] font-normal text-gray-400">Src 1</span></th>
                    <th className="p-2 border-r">F_k<br/><span className="text-[10px] font-normal text-gray-400">Src 2</span></th>
                    <th className="p-2 border-r text-blue-600">Q_j<br/><span className="text-[10px] font-normal text-blue-400">Src1 FU</span></th>
                    <th className="p-2 border-r text-blue-600">Q_k<br/><span className="text-[10px] font-normal text-blue-400">Src2 FU</span></th>
                    <th className="p-2 border-r text-emerald-600">R_j<br/><span className="text-[10px] font-normal text-emerald-400">Src1 Ready?</span></th>
                    <th className="p-2 text-emerald-600">R_k<br/><span className="text-[10px] font-normal text-emerald-400">Src2 Ready?</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {fuStatus.map((fu, idx) => (
                    <tr key={idx} className={fu.busy === 'Yes' ? 'bg-blue-50/30' : ''}>
                      <td className="p-2 border-r text-slate-400">{cycle}</td>
                      <td className="p-2 border-r font-semibold text-slate-700">{fu.name}</td>
                      <td className="p-2 border-r text-center">
                        <span className={`px-2 py-0.5 rounded-sm ${fu.busy === 'Yes' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>{fu.busy}</span>
                      </td>
                      <td className="p-2 border-r">{fu.op}</td>
                      <td className="p-2 border-r text-indigo-700 font-bold">{fu.fi}</td>
                      <td className="p-2 border-r">{fu.fj}</td>
                      <td className="p-2 border-r">{fu.fk}</td>
                      <td className="p-2 border-r text-orange-600 text-[10px]">{fu.qj}</td>
                      <td className="p-2 border-r text-orange-600 text-[10px]">{fu.qk}</td>
                      <td className="p-2 border-r text-center">
                        <span className={fu.rj === 'Yes' ? 'text-emerald-500 font-bold' : (fu.rj === 'No' ? 'text-red-500 font-bold' : '')}>{fu.rj}</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={fu.rk === 'Yes' ? 'text-emerald-500 font-bold' : (fu.rk === 'No' ? 'text-red-500 font-bold' : '')}>{fu.rk}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 表3：寄存器结果状态 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 lg:col-span-1 flex flex-col">
            <div className="bg-slate-100 p-3 border-b border-gray-200 font-bold text-slate-700 text-sm flex justify-between">
              <span>表 3: 寄存器结果 (Register Result)</span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-center">
              <p className="text-xs text-slate-500 mb-3">指示哪个功能部件即将向该寄存器写入数据。这是处理 WAW 和 RAW 的核心依据。</p>
              <div className="grid grid-cols-2 gap-2">
                {registersList.map(reg => (
                  <div key={reg} className="flex border border-gray-200 rounded overflow-hidden shadow-sm">
                    <div className="bg-slate-200 px-3 py-2 font-mono font-bold text-slate-700 flex-shrink-0 w-12 text-center border-r border-gray-300">
                      {reg}
                    </div>
                    <div className="bg-gray-50 flex-1 px-2 py-2 font-mono text-xs flex items-center text-indigo-700 font-bold overflow-hidden whitespace-nowrap text-ellipsis">
                      {regStatus[reg] || <span className="text-gray-300 italic font-normal">Ready</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}