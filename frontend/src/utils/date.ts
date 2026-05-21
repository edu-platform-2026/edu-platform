import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm');
};

export const getRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const isOverdue = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs());
};

export const getDayOfWeekLabel = (day: number): string => {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return labels[day] || '';
};

export const getWeekDates = (date?: string | Date): Date[] => {
  const start = dayjs(date).startOf('week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').toDate());
};
