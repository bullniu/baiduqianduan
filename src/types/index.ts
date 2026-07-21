// 焊接工艺评定方案
export interface WeldingProcedure {
  id: string;
  procedureNumber: string;
  projectName: string;
  materialInfo: string;
  weldType: string;
  layers: WeldLayer[];
  createdAt: string;
  updatedAt: string;
}

// 焊接层
export interface WeldLayer {
  id: string;
  layerNumber: number;
  passes: WeldPass[];
  createdAt: string;
}

// 焊接道次
export interface WeldPass {
  id: string;
  passNumber: number;
  current: number;          // 焊接电流(A)
  voltage: number;          // 焊接电压(V)
  weldLength: number;       // 焊缝长度(cm)
  duration: number;         // 焊接时长(秒)
  travelSpeed: number;      // 焊接速度(cm/min) - 自动计算
  heatInput: number;        // 热输入(kJ/cm) - 自动计算
  createdAt: string;
}

// 统计信息
export interface Statistics {
  totalPasses: number;
  totalLayers: number;
  averageHeatInput: number;
  minHeatInput: number;
  maxHeatInput: number;
  averageCurrent: number;
  averageVoltage: number;
  averageTravelSpeed: number;
}