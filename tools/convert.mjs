import XLSX from 'xlsx';
import fs from 'fs';

const BASE = 'F:/找工作/岗位清单/';

// 每张表：文件 + 表索引(0基) + 分类 + 标题行所在行(0基)
const SHEET_CFG = [
  { file: '岗位清单1.xlsx', sheet: 1, category: '私企', headerRow: 0 },
  { file: '岗位清单1.xlsx', sheet: 2, category: '编制', headerRow: 0 },
  { file: '岗位清单1.xlsx', sheet: 3, category: '考编', headerRow: 0 },
  { file: '岗位清单1.xlsx', sheet: 4, category: '考公', headerRow: 0 },
  { file: '岗位清单2.xlsx', sheet: 1, category: '私企', headerRow: 0 },
  { file: '岗位清单2.xlsx', sheet: 2, category: '编制', headerRow: 0 },
  { file: '岗位清单2.xlsx', sheet: 3, category: '考编', headerRow: 0 },
  { file: '岗位清单2.xlsx', sheet: 4, category: '考公', headerRow: 0 },
  { file: '岗位清单3.xlsx', sheet: 0, category: '私企', headerRow: 0 },
  { file: '岗位清单3.xlsx', sheet: 1, category: '编制', headerRow: 0 },
  { file: '岗位清单3.xlsx', sheet: 2, category: '考编', headerRow: 0 },
  { file: '岗位清单3.xlsx', sheet: 3, category: '考公', headerRow: 0 },
];

const FIELD_MAP = {
  '序号': null, '排名': null, '地区': 'region', '省市': 'region', '省/市': 'region', '区县/地区': 'region', '区县': 'region', '区域组': 'region', '地区分类': 'note',
  '岗位名称': 'position', '岗位方向': 'position', '推荐岗位方向': 'position', '优先岗位': 'position', '目标方向': 'advantage', '岗位类别': 'note', '岗位层级': 'note',
  '目标单位（示例）': 'company', '目标单位': 'company', '招聘单位示例': 'company', '代表单位': 'company', '招录单位': 'company', '单位类型': 'note', '单位类型/行业': 'note', '编制类型': 'note',
  '薪资区间(万/年)': 'salary', '薪资区间': 'salary', '年薪范围(万)': 'salary', '年薪/待遇(万)': 'salary',
  '工作强度': 'note', '加班强度': 'note', '社交强度': 'note', '社交应酬强度': 'note', '出差频率': 'note', '是否出差': 'note', '值班情况': 'note', '是否值班': 'note', '稳定度': 'note',
  '竞争程度': 'competition', '竞争难度': 'competition', '上岸难度评估': 'competition', '进面难度': 'competition', '竞争判断': 'competition',
  '匹配优势': 'advantage',
  '投递渠道': 'channel', '招聘渠道/公告来源': 'channel', '报考渠道': 'channel', '官方入口': 'channel',
  '投递链接': 'link', '直达公告链接': 'link', '直达公告/入口': 'link', '直达公告': 'link', '近期公告直达': 'link',
  '招聘批次': 'note', '资格提示': 'note', '资格风险': 'note', '退役定向核验': 'note', '退役军人政策': 'note', '退役军人定向': 'note', '退役定向': 'note', '笔试科目': 'note', '学历/专业要求': 'note', '生活成本': 'note', '交通便利度': 'note', '推荐指数': 'note', '备注': 'note', '备注/建议': 'note', '备注(建议)': 'note',
};

const norm = (s) => String(s == null ? '' : s).replace(/\s+/g, '').replace(/[（(（【].*$/, '');
const clean = (s) => String(s == null ? '' : s).trim();

let all = [];
for (const cfg of SHEET_CFG) {
  const wb = XLSX.readFile(BASE + cfg.file);
  const ws = wb.Sheets[wb.SheetNames[cfg.sheet]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rows.length <= cfg.headerRow) continue;
  const headers = rows[cfg.headerRow].map(norm);
  const colToField = headers.map((h) => (h in FIELD_MAP ? FIELD_MAP[h] : '_unknown_' + h));

  for (const row of rows.slice(cfg.headerRow + 1)) {
    if (row.length === 0) continue;
    const job = { category: cfg.category, region: '', position: '', company: '', salary: '', competition: '', advantage: '', channel: '', link: '', note: '' };
    const notes = [];
    row.forEach((cell, i) => {
      const field = colToField[i];
      const v = clean(cell);
      if (!v) return;
      if (!field || field === null) return;
      if (field.startsWith('_unknown_')) { if (v) notes.push(headers[i] + '：' + v); return; }
      if (field === 'note') { notes.push(v); return; }
      if (!job[field]) job[field] = v;
    });
    job.note = notes.join('；');
    if (!job.position) continue;
    all.push(job);
  }
}

fs.writeFileSync(new URL('../岗位清单.json', import.meta.url), JSON.stringify(all, null, 2), 'utf8');
console.log('总条数:', all.length);
console.log('分类分布:', all.reduce((m, j) => { m[j.category] = (m[j.category] || 0) + 1; return m; }, {}));
console.log('含链接条数:', all.filter((j) => j.link).length);
console.log('样例:', JSON.stringify(all[0], null, 2));
