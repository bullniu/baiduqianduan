/**
 * 通过焊缝长度和时间计算焊接速度
 * @param weldLength 焊缝长度 (cm)
 * @param durationSeconds 焊接时长 (秒)
 * @returns 焊接速度 (cm/min)
 */
export function calculateTravelSpeed(
  weldLength: number,
  durationSeconds: number
): number {
  // 处理无效输入（undefined, NaN, 负数等）
  const len = Number(weldLength);
  const dur = Number(durationSeconds);
  if (!Number.isFinite(len) || !Number.isFinite(dur) || dur <= 0 || len <= 0) {
    return 0;
  }
  const durationMinutes = dur / 60;
  return len / durationMinutes;
}

/**
 * 计算热输入
 * 公式: 热输入 (kJ/cm) = (电流 × 电压 × 60) / (焊接速度 × 1000)
 * @param current 焊接电流 (A)
 * @param voltage 焊接电压 (V)
 * @param travelSpeed 焊接速度 (cm/min)
 * @returns 热输入 (kJ/cm)
 */
export function calculateHeatInput(
  current: number,
  voltage: number,
  travelSpeed: number
): number {
  const c = Number(current);
  const v = Number(voltage);
  const s = Number(travelSpeed);
  if (!Number.isFinite(s) || s <= 0) {
    return 0;
  }
  return (c * v * 60) / (s * 1000);
}

/**
 * 通过焊缝长度和时间直接计算热输入
 * @param current 焊接电流 (A)
 * @param voltage 焊接电压 (V)
 * @param weldLength 焊缝长度 (cm)
 * @param durationSeconds 焊接时长 (秒)
 * @returns 热输入 (kJ/cm)
 */
export function calculateHeatInputFromTime(
  current: number,
  voltage: number,
  weldLength: number,
  durationSeconds: number
): number {
  const travelSpeed = calculateTravelSpeed(weldLength, durationSeconds);
  return calculateHeatInput(current, voltage, travelSpeed);
}

/**
 * 格式化数字，保留指定小数位
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * 格式化秒数为 mm:ss 格式
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
