const test = require('node:test');
const assert = require('node:assert');
const C = require('./jobs-core.js');

test('normalizeJob 补全默认值', () => {
  const j = C.normalizeJob({ position: '前端', status: '已投递' }, '私企');
  assert.strictEqual(j.position, '前端');
  assert.strictEqual(j.status, '已投递');
  assert.strictEqual(j.category, '私企');
  assert.strictEqual(j.region, '');
  assert.ok(j.id.startsWith('job_'));
});

test('normalizeJob 非法状态回退待投递', () => {
  const j = C.normalizeJob({ position: 'x', status: '随便' }, '');
  assert.strictEqual(j.status, '待投递');
});

test('normalizeJob 非法 deadline 清空', () => {
  assert.strictEqual(C.normalizeJob({ position: 'x', deadline: '8月20日' }).deadline, '');
  assert.strictEqual(C.normalizeJob({ position: 'x', deadline: '2026-08-20' }).deadline, '2026-08-20');
});

test('validateJobList 检出非法数据', () => {
  const r = C.validateJobList([{ position: '' }]);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.length, 1);
});

test('filterJobs 按分类+状态+关键词过滤', () => {
  const list = [
    C.normalizeJob({ position: '前端工程师', company: 'A', category: '私企', status: '待投递' }),
    C.normalizeJob({ position: '运维', company: 'B', category: '编制', status: '已投递' }),
  ];
  assert.strictEqual(C.filterJobs(list, { category: '私企', keyword: '前端' }).length, 1);
  assert.strictEqual(C.filterJobs(list, { status: '已投递' })[0].position, '运维');
});

test('sortJobs 按 deadline 升序，空值排后', () => {
  const list = [{ id: '1', deadline: '' }, { id: '2', deadline: '2026-08-20' }, { id: '3', deadline: '2026-08-18' }];
  assert.deepStrictEqual(C.sortJobs(list, 'deadline').map((x) => x.id), ['3', '2', '1']);
});

test('isDeadlineSoon 仅待投递且3天内为真', () => {
  const j = { deadline: '2026-08-18', status: '待投递' };
  assert.strictEqual(C.isDeadlineSoon(j, '2026-08-16', 3), true);
  assert.strictEqual(C.isDeadlineSoon({ ...j, status: '已投递' }, '2026-08-16', 3), false);
  assert.strictEqual(C.isDeadlineSoon({ ...j, deadline: '2026-09-01' }, '2026-08-16', 3), false);
  assert.strictEqual(C.isDeadlineSoon({ ...j, deadline: '' }, '2026-08-16', 3), false);
});

test('applyStatus 切到已投递自动记 appliedAt', () => {
  const r = C.applyStatus({ id: '1', status: '待投递', appliedAt: '' }, '已投递');
  assert.strictEqual(r.status, '已投递');
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.appliedAt));
});

test('applyStatus 非法状态原样返回', () => {
  const j = { id: '1', status: '待投递' };
  assert.strictEqual(C.applyStatus(j, '随便'), j);
});
