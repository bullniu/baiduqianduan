import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Save, Download, 
  Layers, Zap, Activity, TrendingUp, BarChart3 
} from 'lucide-react';
import { useProcedureStore } from '@/store';
import { WeldingProcedure, WeldPass, Statistics } from '@/types';
import { exportToExcel } from '@/utils/export';

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

  useEffect(() => {
    if (id && id !== 'new') {
      loadProcedure(id);
    }
  }, [id, loadProcedure]);

  // 计算统计数据
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

  // 保存基础信息
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

  // 处理参数变更
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
      updatePass(currentProcedure.id, layerId, passId, {
        current: field === 'current' ? numValue : pass.current,
        voltage: field === 'voltage' ? numValue : pass.voltage,
        travelSpeed: field === 'travelSpeed' ? numValue : pass.travelSpeed,
      });
    }
  };

  // 导出Excel
  const handleExport = () => {
    if (currentProcedure) {
      exportToExcel(currentProcedure);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部 */}
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
        {/* 基础信息表单 */}
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

        {/* 统计面板 */}
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
                  {stats.averageHeatInput.toFixed(2)} <span className="text-sm">J/mm</span>
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-600">热输入范围</span>
                </div>
                <p className="text-lg font-bold text-purple-700 font-mono">
                  {stats.minHeatInput.toFixed(1)} - {stats.maxHeatInput.toFixed(1)}
                  <span className="text-sm ml-1">J/mm</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 参数记录区域 */}
        {currentProcedure && (
          <div className="space-y-4">
            {/* 添加层按钮 */}
            <button
              onClick={() => addLayer(currentProcedure.id)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">添加焊接层</span>
            </button>

            {/* 层道列表 */}
            {currentProcedure.layers.map((layer) => (
              <div key={layer.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                {/* 层标题 */}
                <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Layers className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-white">第 {layer.layerNumber} 层</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addPass(currentProcedure.id, layer.id)}
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

                {/* 参数表格 */}
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
                            焊接速度 (mm/min)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            热输入 (J/mm)
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
                              <input
                                type="number"
                                value={pass.travelSpeed || ''}
                                onChange={(e) => handlePassChange(layer.id, pass.id, 'travelSpeed', e.target.value)}
                                className="w-24 px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-right"
                                placeholder="0"
                                step="0.1"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className={`px-3 py-1.5 rounded font-mono font-semibold text-right ${
                                pass.heatInput > 0 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {pass.heatInput.toFixed(2)}
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