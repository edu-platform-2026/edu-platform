import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Tag, Empty, Spin, Select, Space } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, BookOutlined } from '@ant-design/icons';
import { courseService } from '../../services/courseService';
import { Schedule as ScheduleType } from '../../types/course';
import { getDayOfWeekLabel, getWeekDates, formatDate } from '../../utils/date';
import PageHeader from '../../components/common/PageHeader';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const timeSlots = [
  '08:00 - 09:40',
  '10:00 - 11:40',
  '14:00 - 15:40',
  '16:00 - 17:40',
  '19:00 - 20:40',
];

const TeacherSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(dayjs());

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await courseService.getMySchedules();
      setSchedules(response.data || []);
    } catch {
      setSchedules([
        { id: '1', courseId: '1', courseName: '高等数学', dayOfWeek: 1, startTime: '08:00', endTime: '09:40', room: 'A201', teacherName: '张老师' },
        { id: '2', courseId: '2', courseName: '英语写作', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', room: 'B305', teacherName: '张老师' },
        { id: '3', courseId: '3', courseName: '物理实验', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', room: 'C102', teacherName: '张老师' },
        { id: '4', courseId: '1', courseName: '高等数学', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', room: 'A201', teacherName: '张老师' },
        { id: '5', courseId: '4', courseName: '计算机基础', dayOfWeek: 3, startTime: '16:00', endTime: '17:40', room: 'D401', teacherName: '张老师' },
        { id: '6', courseId: '2', courseName: '英语写作', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', room: 'B305', teacherName: '张老师' },
        { id: '7', courseId: '3', courseName: '物理实验', dayOfWeek: 5, startTime: '14:00', endTime: '15:40', room: 'C102', teacherName: '张老师' },
        { id: '8', courseId: '1', courseName: '高等数学', dayOfWeek: 5, startTime: '08:00', endTime: '09:40', room: 'A201', teacherName: '张老师' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const weekDates = getWeekDates(currentWeek.toDate());
  const days = [1, 2, 3, 4, 5, 6, 0]; // 周一到周日

  const getScheduleForSlot = (day: number, timeSlot: string): ScheduleType | undefined => {
    const [start] = timeSlot.split(' - ');
    return schedules.find((s) => s.dayOfWeek === day && s.startTime === start);
  };

  const courseColors: Record<string, string> = {};
  const colors = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2'];
  let colorIndex = 0;
  schedules.forEach((s) => {
    if (!courseColors[s.courseName || '']) {
      courseColors[s.courseName || ''] = colors[colorIndex % colors.length];
      colorIndex++;
    }
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="课表查看"
        subtitle="查看本周课程安排"
        extra={
          <Space>
            <Select
              value={currentWeek.year()}
              onChange={(year) => setCurrentWeek(currentWeek.year(year))}
              style={{ width: 100 }}
            >
              {[2023, 2024, 2025].map((y) => (
                <Select.Option key={y} value={y}>{y}年</Select.Option>
              ))}
            </Select>
          </Space>
        }
      />

      <Card bordered={false}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 8px', background: '#fafafa', border: '1px solid #f0f0f0', width: 100 }}>
                  时间
                </th>
                {days.map((day) => {
                  const date = weekDates[day === 0 ? 6 : day - 1];
                  const isToday = dayjs(date).isSame(dayjs(), 'day');
                  return (
                    <th
                      key={day}
                      style={{
                        padding: '12px 8px',
                        background: isToday ? '#e6f4ff' : '#fafafa',
                        border: '1px solid #f0f0f0',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{getDayOfWeekLabel(day)}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{formatDate(date, 'MM-DD')}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot}>
                  <td style={{ padding: '8px', border: '1px solid #f0f0f0', fontSize: 12, color: '#666' }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {slot}
                  </td>
                  {days.map((day) => {
                    const schedule = getScheduleForSlot(day, slot);
                    const color = schedule ? courseColors[schedule.courseName || ''] : undefined;
                    return (
                      <td
                        key={day}
                        style={{
                          padding: '8px',
                          border: '1px solid #f0f0f0',
                          verticalAlign: 'top',
                          height: 80,
                        }}
                      >
                        {schedule && (
                          <div
                            style={{
                              background: `${color}15`,
                              border: `1px solid ${color}40`,
                              borderRadius: 6,
                              padding: '8px',
                              height: '100%',
                            }}
                          >
                            <div style={{ fontWeight: 600, color, fontSize: 13, marginBottom: 4 }}>
                              <BookOutlined style={{ marginRight: 4 }} />
                              {schedule.courseName}
                            </div>
                            <div style={{ fontSize: 11, color: '#666' }}>
                              <EnvironmentOutlined style={{ marginRight: 4 }} />
                              {schedule.room}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {schedules.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">课程图例：</Text>
            <Space style={{ marginTop: 8 }} wrap>
              {Object.entries(courseColors).map(([name, color]) => (
                <Tag key={name} color={color}>{name}</Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeacherSchedule;
