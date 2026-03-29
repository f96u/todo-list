const WEEKDAYS: Record<string, number> = {
  '日曜': 0, '月曜': 1, '火曜': 2, '水曜': 3, '木曜': 4, '金曜': 5, '土曜': 6,
};

function parseToken(token: string): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (token === '今日') return today;

  if (token === '明日') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }

  if (token === '明後日') {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d;
  }

  if (token in WEEKDAYS) {
    const targetDay = WEEKDAYS[token];
    const currentDay = today.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;
    const d = new Date(today);
    d.setDate(d.getDate() + diff);
    return d;
  }

  const dayMatch = token.match(/^(\d{1,2})日$/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const d = new Date(today);
      d.setDate(day);
      // 今月の指定日がすでに過ぎていたら翌月
      if (d < today) d.setMonth(d.getMonth() + 1);
      return d;
    }
  }

  return null;
}

/** 入力テキストからスペース区切りの日付キーワードを探し、テキストと期日に分解する */
export function parseDueDate(input: string): { text: string; dueDate?: Date } {
  const tokens = input.split(/\s+/);

  for (let i = 0; i < tokens.length; i++) {
    const date = parseToken(tokens[i]);
    if (date) {
      const text = tokens.filter((_, idx) => idx !== i).join(' ').trim();
      return { text, dueDate: date };
    }
  }

  return { text: input };
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/** 期日を表示用の文字列に変換する */
export function formatDueDate(dueDate: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const weekday = WEEKDAY_LABELS[due.getDay()];
  const dateStr = `${due.getMonth() + 1}/${due.getDate()}(${weekday})`;

  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '明日';
  if (diffDays === 2) return '明後日';
  return dateStr;
}

/** 期日の状態を返す（色分け用） */
export function getDueDateStatus(dueDate: Date): 'overdue' | 'today' | 'soon' | 'future' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 2) return 'soon';
  return 'future';
}
