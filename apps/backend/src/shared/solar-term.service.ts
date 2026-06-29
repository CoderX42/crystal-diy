import { Injectable } from '@nestjs/common';

interface SolarTermBoundary {
  name: string;
  month: number;
  day: number;
}

const SOLAR_TERMS: SolarTermBoundary[] = [
  { name: '小寒', month: 1, day: 5 },
  { name: '大寒', month: 1, day: 20 },
  { name: '立春', month: 2, day: 4 },
  { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 5 },
  { name: '春分', month: 3, day: 20 },
  { name: '清明', month: 4, day: 4 },
  { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 5 },
  { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 5 },
  { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 },
  { name: '大暑', month: 7, day: 22 },
  { name: '立秋', month: 8, day: 7 },
  { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 7 },
  { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 },
  { name: '霜降', month: 10, day: 23 },
  { name: '立冬', month: 11, day: 7 },
  { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 21 },
];

@Injectable()
export class SolarTermService {
  getCurrentTerm(date = new Date()) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const current = month * 100 + day;

    for (let index = SOLAR_TERMS.length - 1; index >= 0; index -= 1) {
      const term = SOLAR_TERMS[index];
      if (current >= term.month * 100 + term.day) return term.name;
    }

    return '冬至';
  }

  getTermContext(date = new Date()) {
    const term = this.getCurrentTerm(date);
    return {
      name: term,
      label: `${term} · 今日之念`,
      suitableFor: this.getSuitableFor(term),
    };
  }

  private getSuitableFor(term: string) {
    const seasonalSuggestions: Record<string, string[]> = {
      立春: ['启动新计划', '整理目标', '唤醒能量'],
      雨水: ['滋养关系', '温柔沟通', '舒缓情绪'],
      惊蛰: ['行动破局', '唤醒勇气', '开启改变'],
      春分: ['平衡取舍', '协调整理', '稳定节奏'],
      清明: ['清理旧事', '追思感恩', '轻装前行'],
      谷雨: ['学习成长', '播种愿望', '积蓄灵感'],
      立夏: ['提升热情', '主动表达', '迎接丰盛'],
      小满: ['稳步积累', '知足感恩', '照顾自己'],
      芒种: ['专注执行', '忙而有序', '推进项目'],
      夏至: ['向光而行', '释放热爱', '保持清醒'],
      小暑: ['安定心神', '节制消耗', '轻盈生活'],
      大暑: ['静心避躁', '补充能量', '耐心等待'],
      立秋: ['收束节奏', '复盘调整', '开始沉淀'],
      处暑: ['降噪清心', '恢复秩序', '温和转身'],
      白露: ['保护边界', '细腻表达', '安顿内在'],
      秋分: ['均衡关系', '公平决策', '整理收获'],
      寒露: ['沉稳规划', '专注内修', '慎重选择'],
      霜降: ['断舍离', '守护初心', '沉着应对'],
      立冬: ['储备能量', '慢下来', '照顾身体'],
      小雪: ['温暖陪伴', '减少内耗', '安静积累'],
      大雪: ['深度休整', '蓄力等待', '守住希望'],
      冬至: ['回到内心', '重启愿望', '迎接新生'],
      小寒: ['稳住心气', '温养自己', '耐心准备'],
      大寒: ['收尾复盘', '静待转机', '积蓄力量'],
    };

    return seasonalSuggestions[term] ?? ['静心', '整理思绪', '开启新计划'];
  }
}
