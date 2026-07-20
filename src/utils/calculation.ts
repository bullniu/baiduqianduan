/**
 * 计算热输入
 * 公式: 热输入 (J/mm) = (电流 × 电压 × 60) / 焊接速度
 * @param current 焊接电流 (A)
 * @param voltage 焊接电压 (V)
 * @param travelSpeed 焊接速度 (mm/min)
 * @returns 热输入 (J/mm)
 */
export function calculateHeatInput(
  current: number,
  voltage: number,
  travelSpeed: number
): number {
  if (travelSpeed <= 0) {
    return 0;
  }
  return (current * voltage * 60) / travelSpeed;
}

/**
 * 格式化数字，保留指定小数位
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}