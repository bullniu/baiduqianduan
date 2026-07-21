import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Save, Download, 
  Layers, Zap, Activity, TrendingUp, BarChart3,
  Play, Pause, RotateCcw, Clock, Ruler
} from 'lucide-react';
import { useProcedureStore } from '@/store';
import { WeldingProcedure, WeldPass, Statistics } from '@/types';
import { exportToExcel } from '@/utils/export';
import { formatDuration } from '@/utils/calculation';

export function ProcedureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    currentProcedure, 
    loadProcedure, 
    createProcedure, 
    updateProcedure,
    addLayer, 
    deleteLayer, 
    addPass, 
    updatePass, 
    deletePass 
  } = useProcedureStore();
  
  const [isEditing, setIsEditing] = useState(!id || id === 'new');
  const [formData, setFormData] = useState({
    procedureNumber: '',
    projectName: '',
    materialInfo: '',
    weldType: '',
  });

  const [timers, setTimers] = useState<Record<string, { isRunning: boolean; elapsed: number; startTime: number | null }>>({});
  const timerIntervalRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (id && id !== 'new') {
      loadProcedure(id);
    }
  }, [id, loadProcedure]);

  useEffect(() => {
    if (currentProcedure) {
      const initialTimers: Record<string, { isRunning: boolean; elapsed: number; startTime: number | null }> = {};
      currentProcedure.layers.forEach(layer => {
        layer.passes.forEach(pass => {
          initialTimers[pass.id] = {
            isRunning: false,
            elapsed: pass.duration || 0,
            startTime: null,
          };
        });
      });
      setTimers(initialTimers);
    }
    return () => {
      Object.values(timerIntervalRef.current).forEach(intervalId => {
        clearInterval(intervalId);
      });
      timerIntervalRef.current = {};
    };
  }, [currentProcedure?.id]);

  const calculateStatistics = (procedure: WeldingProcedure | null): Statistics => {
    if (!procedure || procedure.layers.length === 0) {
      return {
        totalPasses: 0,
        totalLayers: 0,
        averageHeatInput: 0,
        minHeatInput: 0,
        maxHeatInput: 0,
        averageCurrent: 0,
        averageVoltage: 0,
        averageTravelSpeed: 0,
      };
    }

    const allPasses = procedure.layers.flatMap(layer => layer.passes);
    
    if (allPasses.length === 0) {
      return {
        totalPasses: 0,
        totalLayers: procedure.layers.length,
        averageHeatInput: 0,
        minHeatInput: 0,
        maxHeatInput: 0,
        averageCurrent: 0,
        averageVoltage: 0,
        averageTravelSpeed: 0,
      };
    }

    const heatInputs = allPasses.map(p => p.heatInput).filter(h => h > 0);
    const currents = allPasses.map(p => p.current).filter(c => c > 0);
    const voltages = allPasses.map(p => p.voltage).filter(v => v > 0);
    const speeds = allPasses.map(p => p.travelSpeed).filter(s => s > 0);

    return {
      totalPasses: allPasses.length,
      totalLayers: procedure.layers.length,
      averageHeatInput: heatInputs.length > 0 ? heatInputs.reduce((a, b) => a + b, 0) / heatInputs.length : 0,
      minHeatInput: heatInputs.length > 0 ? Math.min(...heatInputs) : 0,
      maxHeatInput: heatInputs.length > 0 ? Math.max(...heatInputs) : 0,
      averageCurrent: currents.length > 0 ? currents.reduce((a, b) => a + b, 0) / currents.length : 0,
      averageVoltage: voltages.length > 0 ? voltages.reduce((a, b) => a + b, 0) / voltages.length : 0,
      averageTravelSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
    };
  };

  const stats = calculateStatistics(currentProcedure);

  const handleSaveBasicInfo = () => {
    if (!formData.procedureNumber || !formData.projectName) {
      alert('请填写工艺评定编号和项目名称');
      return;
    }

    if (!id || id === 'new') {
      const newProcedure = createProcedure(formData);
      navigate(`/procedure/${newProcedure.id}`);
      setIsEditing(false);
    } else {
      updateProcedure(id, formData);
      setIsEditing(false);
    }
  };

  const handlePassChange = (
    layerId: string,
    passId: string,
    field: keyof WeldPass,
    value: string
  ) => {
    if (!currentProcedure) return;
    
    const numValue = parseFloat(value) || 0;
    const pass = currentProcedure.layers
      .find(l => l.id === layerId)
      ?.passes.find(p => p.id === passId);
    
    if (pass) {
      const newDuration = field === 'duration' ? numValue : pass.duration;
      const newWeldLength = field === 'weldLength' ? numValue : pass.weldLength;
      
      if (field === 'duration' || field === 'weldLength') {
        setTimers(prev => ({
          ...prev,
          [passId]: {
            ...prev[passId],
            elapsed: field === 'duration' ? numValue : prev[passId]?.elapsed || 0,
          }
        }));
      }
      
      updatePass(currentProcedure.id, layerId, passId, {
        current: field === 'current' ? numValue : pass.current,
        voltage: field === 'voltage' ? numValue : pass.voltage,
        weldLength: newWeldLength,
        duration: newDuration,
      });
    }
  };

  const startTimer = (passId: string, layerId: string) => {
    if (!currentProcedure) return;
    
    const pass = currentProcedure.layers
      .find(l => l.id === layerId)
      ?.passes.find(p => p.id === passId);
    
    if (!pass) return;

    setTimers(prev => ({
      ...prev,
      [passId]: {
        ...prev[passId],
        isRunning: true,
        startTime: Date.now(),
      }
    }));

    timerIntervalRef.current[passId] = window.setInterval(() => {
      setTimers(prev => {
        const timer = prev[passId];
        if (!timer || !timer.startTime || !timer.isRunning) return prev;
        
        const now = Date.now();
        const elapsed = timer.elapsed + (now - timer.startTime) / 1000;
        
        return {
          ...prev,
          [passId]: {
            ...timer,
            elapsed,
            startTime: now,
          }
        };
      });
    }, 100);
  };

  const pauseTimer = (passId: string, layerId: string) => {
    if (!currentProcedure) return;
    
    if (timerIntervalRef.current[passId]) {
      clearInterval(timerIntervalRef.current[passId]);
      delete timerIntervalRef.current[passId];
    }

    setTimers(prev => {
      const timer = prev[passId];
      if (!timer) return prev;
      
      let finalElapsed = timer.elapsed;
      if (timer.isRunning && timer.startTime) {
        finalElapsed = timer.elapsed + (Date.now() - timer.startTime) / 1000;
      }
      
      const pass = currentProcedure.layers
        .find(l => l.id === layerId)
        ?.passes.find(p => p.id === passId);
      
      if (pass) {
        updatePass(currentProcedure.id, layerId, passId, {
          current: pass.current,
          voltage: pass.voltage,
          weldLength: pass.weldLength,
          duration: Math.round(finalElapsed * 10) / 10,
        });
      }
      
      return {
        ...prev,
        [passId]: {
          ...timer,
          isRunning: false,
          startTime: null,
          elapsed: finalElapsed,
        }
      };
    });
  };

  const resetTimer = (passId: string, layerId: string) => {
    if (!currentProcedure) return;
    
    if (timerIntervalRef.current[passId]) {
      clearInterval(timerIntervalRef.current[passId]);
      delete timerIntervalRef.current[passId];
    }

    setTimers(prev => ({
      ...prev,
      [passId]: {
        isRunning: false,
        elapsed: 0,
        startTime: null,
      }
    }));

    const pass = currentProcedure.layers
      .find(l => l.id === layerId)
      ?.passes.find(p => p.id === passId);
    
    if (pass) {
      updatePass(currentProcedure.id, layerId, passId, {
        current: pass.current,
        voltage: pass.voltage,
        weldLength: pass.weldLength,
        duration: 0,
      });
    }
  };

  const handleAddPass = (procedureId: string, layerId: string) => {
    addPass(procedureId, layerId);
  };

  const handleExport = () => {
    if (currentProcedure) {
      exportToExcel(currentProcedure);
    }
  };

  const getTimerDisplay = (passId: string) => {
    const timer = timers[passId];
    if (!timer) return '00:00';
    return formatDuration(timer.elapsed);
  };

  const isTimerRunning = (passId: string) => {
    return timers[passId]?.isRunning || false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  {isEditing ? '新建工艺评定方案' : currentProcedure?.procedureNumber || '加载中...'}
                </h1>
                {currentProcedure && !isEditing && (
                  <p className="text-sm text-slate-500">{currentProcedure.projectName}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentProcedure && (
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>导出Excel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(isEditing || !currentProcedure) && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">基础信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  工艺评定编号 *
                </label>
                <input
                  type="text"
                  value={formData.procedureNumber}
                  onChange={(e) => setFormData({ ...formData, procedureNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="例如: WPS-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  项目名称 *
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入项目名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  材料信息
                </label>
                <input
                  type="text"
                  value={formData.materialInfo}
                  onChange={(e) => setFormData({ ...formData, materialInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: Q345B / Q345B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  焊接类型
                </label>
                <input
                  type="text"
                  value={formData.weldType}
                  onChange={(e) => setFormData({ ...formData, weldType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: 对接焊 / 角焊"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveBasicInfo}
                className="flex items-center space-x-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>保存并继续</span>
              </button>
            </div>
          </div>
        )}

        {currentProcedure && currentProcedure.layers.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-800">统计信息</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-600">总层数</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 font-mono">{stats.totalLayers}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-slate-600">总道数</span>
                </div>
                <p className="text-2xl font-bold text-orange-700 font-mono">{stats.totalPasses}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-600">平均热输入</span>
                </div>
                <p className="text-2xl font-bold text-green-700 font-mono">
                  {stats.averageHeatInput.toFixed(2)} <span className="text-sm">kJ/cm</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-600">热输入范围</span>
                </div>
                <p className="text-lg font-bold text-purple-700 font-mono">
                  {stats.minHeatInput.toFixed(2)} - {stats.maxHeatInput.toFixed(2)}
                  <span className="text-sm ml-1">kJ/cm</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {currentProcedure && (
          <div className="space-y-4">
            <button
              onClick={() => addLayer(currentProcedure.id)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">添加焊接层</span>
            </button>

            {currentProcedure.layers.map((layer) => (
              <div key={layer.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Layers className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-white">第 {layer.layerNumber} 层</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddPass(currentProcedure.id, layer.id)}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加道</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定要删除此层吗？')) {
                          deleteLayer(currentProcedure.id, layer.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {layer.passes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            道号
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            焊接电流 (A)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            焊接电压 (V)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            焊缝长度 (cm)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            计时器
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            焊接速度 (cm/min)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            热输入 (kJ/cm)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {layer.passes.map((pass) => (
                          <tr key={pass.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Zap className="w-4 h-4 text-orange-500" />
                                <span className="font-mono font-medium text-slate-700">
                                  {pass.passNumber}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={pass.current || ''}
                                onChange={(e) => handlePassChange(layer.id, pass.id, 'current', e.target.value)}
                                className="w-24 px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-right"
                                placeholder="0"
                                step="0.1"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={pass.voltage || ''}
                                onChange={(e) => handlePassChange(layer.id, pass.id, 'voltage', e.target.value)}
                                className="w-24 px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-right"
                                placeholder="0"
                                step="0.1"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-1">
                                <Ruler className="w-4 h-4 text-slate-400" />
                                <input
                                  type="number"
                                  value={pass.weldLength || ''}
                                  onChange={(e) => handlePassChange(layer.id, pass.id, 'weldLength', e.target.value)}
                                  className="w-20 px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-right"
                                  placeholder="0"
                                  step="0.1"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div className={`px-3 py-1.5 rounded font-mono font-bold text-lg min-w-[70px] text-center ${
                                  isTimerRunning(pass.id)
                                    ? 'bg-green-100 text-green-700 animate-pulse'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <div className="flex items-center justify-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{getTimerDisplay(pass.id)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {!isTimerRunning(pass.id) ? (
                                    <button
                                      onClick={() => startTimer(pass.id, layer.id)}
                                      className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                      title="开始计时"
                                    >
                                      <Play className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => pauseTimer(pass.id, layer.id)}
                                      className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                      title="暂停计时"
                                    >
                                      <Pause className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (confirm('确定要重置计时器吗？')) {
                                        resetTimer(pass.id, layer.id);
                                      }
                                    }}
                                    className="p-1.5 bg-slate-400 text-white rounded hover:bg-slate-500 transition-colors"
                                    title="重置计时器"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`px-3 py-1.5 rounded font-mono font-semibold text-right ${
                                pass.travelSpeed > 0 
                                  ? 'bg-teal-100 text-teal-700' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {pass.travelSpeed.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`px-3 py-1.5 rounded font-mono font-semibold text-right ${
                                pass.heatInput > 0 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {pass.heatInput.toFixed(3)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  if (confirm('确定要删除此道次吗？')) {
                                    deletePass(currentProcedure.id, layer.id, pass.id);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-400">
                    <p>暂无道次数据，点击"添加道"开始记录</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
