const test = require('node:test');
const assert = require('node:assert');
const C = require('./materials-core.js');

test('CATEGORIES 分类清单', () => {
  assert.deepStrictEqual(C.CATEGORIES, ['简历', '成绩单', '学位证', '毕业证', '学籍报告', '身份证', '证件照', '奖学金', '奖状', '证书', '部队', '其他']);
});

test('classifyMaterialByFilename 按文件名归类', () => {
  assert.strictEqual(C.classifyMaterialByFilename('兰茂豪的简历.pdf'), '简历');
  assert.strictEqual(C.classifyMaterialByFilename('本科成绩单.jpg'), '成绩单');
  assert.strictEqual(C.classifyMaterialByFilename('研一绩点_专硕.png'), '成绩单');
  assert.strictEqual(C.classifyMaterialByFilename('学位证书_500K.jpg'), '学位证');
  assert.strictEqual(C.classifyMaterialByFilename('毕业证书_500K.jpg'), '毕业证');
  assert.strictEqual(C.classifyMaterialByFilename('研究生-教育部学籍在线验证报告_兰茂豪.pdf'), '学籍报告');
  assert.strictEqual(C.classifyMaterialByFilename('身份证.jpg'), '身份证');
  assert.strictEqual(C.classifyMaterialByFilename('头像512k.jpg'), '证件照');
  assert.strictEqual(C.classifyMaterialByFilename('学业一等奖学金.jpg'), '奖学金');
  assert.strictEqual(C.classifyMaterialByFilename('三好学生.jpg'), '奖状');
  assert.strictEqual(C.classifyMaterialByFilename('羽毛球院级二等奖.jpg'), '奖状');
  assert.strictEqual(C.classifyMaterialByFilename('计算机二级C语言证.png'), '证书');
  assert.strictEqual(C.classifyMaterialByFilename('CET6_202412_510790242205424_1.pdf'), '证书');
  assert.strictEqual(C.classifyMaterialByFilename('优秀义务兵.jpg'), '部队');
  assert.strictEqual(C.classifyMaterialByFilename('服务保障70周年纪念证书.jpg'), '部队');
  assert.strictEqual(C.classifyMaterialByFilename('unknown.xyz'), '其他');
});

test('matchMaterialCategory hint→分类 有序匹配', () => {
  assert.strictEqual(C.matchMaterialCategory('请上传学位证书'), '学位证');
  assert.strictEqual(C.matchMaterialCategory('毕业证书'), '毕业证');
  assert.strictEqual(C.matchMaterialCategory('学历证书'), '毕业证');
  assert.strictEqual(C.matchMaterialCategory('请上传个人简历'), '简历');
  assert.strictEqual(C.matchMaterialCategory('本科成绩单'), '成绩单');
  assert.strictEqual(C.matchMaterialCategory('教育部学籍在线验证报告'), '学籍报告');
  assert.strictEqual(C.matchMaterialCategory('身份证'), '身份证');
  assert.strictEqual(C.matchMaterialCategory('上传头像'), '证件照');
  assert.strictEqual(C.matchMaterialCategory('一寸白底证件照'), '证件照');
  assert.strictEqual(C.matchMaterialCategory('奖学金证明'), '奖学金');
  assert.strictEqual(C.matchMaterialCategory('荣誉证书'), '奖状');
  assert.strictEqual(C.matchMaterialCategory('获奖证书'), '奖状');
  assert.strictEqual(C.matchMaterialCategory('四六级证书'), '证书');
  assert.strictEqual(C.matchMaterialCategory('技能证书'), '证书');
  assert.strictEqual(C.matchMaterialCategory('退役证'), '部队');
  assert.strictEqual(C.matchMaterialCategory(''), null);
  assert.strictEqual(C.matchMaterialCategory('无所谓的内容'), null);
});

test('pickDefaultMaterial 优先 isDefault → 500k → 最小', () => {
  const compressed = [
    { id: 'a', name: '学位证.jpg', size: 5000000, category: '学位证', isDefault: false },
    { id: 'b', name: '学位证_500K.jpg', size: 400000, category: '学位证', isDefault: false },
  ];
  assert.strictEqual(C.pickDefaultMaterial(compressed, '学位证').id, 'b');

  const withDefault = [
    { id: 'a', name: '学位证.jpg', size: 5000000, category: '学位证', isDefault: false },
    { id: 'b', name: '学位证_500K.jpg', size: 400000, category: '学位证', isDefault: false },
    { id: 'c', name: '学位证2.jpg', size: 300000, category: '学位证', isDefault: true },
  ];
  assert.strictEqual(C.pickDefaultMaterial(withDefault, '学位证').id, 'c');

  const smallest = [
    { id: 'a', name: '证书A.jpg', size: 5000, category: '证书', isDefault: false },
    { id: 'b', name: '证书B.jpg', size: 3000, category: '证书', isDefault: false },
  ];
  assert.strictEqual(C.pickDefaultMaterial(smallest, '证书').id, 'b');

  assert.strictEqual(C.pickDefaultMaterial([], '简历'), null);
  assert.strictEqual(C.pickDefaultMaterial(compressed, '不存在的分类'), null);
});

test('filterByAccept 按 accept 过滤', () => {
  const list = [
    { id: 'a', name: '简历.pdf', mime: 'application/pdf', category: '简历' },
    { id: 'b', name: '简历.jpg', mime: 'image/jpeg', category: '简历' },
    { id: 'c', name: '证件照.png', mime: 'image/png', category: '证件照' },
  ];
  assert.deepStrictEqual(C.filterByAccept(list, '简历', '.pdf').map(m => m.id), ['a']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', '.jpg,.png').map(m => m.id), ['b']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', 'image/*').map(m => m.id), ['b']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', 'application/pdf').map(m => m.id), ['a']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', '').map(m => m.id), ['a', 'b']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', null).map(m => m.id), ['a', 'b']);
  assert.deepStrictEqual(C.filterByAccept(list, '简历', '*/*').map(m => m.id), ['a', 'b']);
});

test('inferMime 扩展名→MIME', () => {
  assert.strictEqual(C.inferMime('a.pdf'), 'application/pdf');
  assert.strictEqual(C.inferMime('a.JPG'), 'image/jpeg');
  assert.strictEqual(C.inferMime('a.png'), 'image/png');
  assert.strictEqual(C.inferMime('a.xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.strictEqual(C.inferMime('a.unknown'), 'application/octet-stream');
});

test('normalizeMaterial 补全字段', () => {
  const m = C.normalizeMaterial({ name: '简历.pdf', size: 123 }, '简历');
  assert.ok(m.id.startsWith('mat_'));
  assert.strictEqual(m.name, '简历.pdf');
  assert.strictEqual(m.size, 123);
  assert.strictEqual(m.mime, 'application/pdf');
  assert.strictEqual(m.category, '简历');
  assert.strictEqual(m.isDefault, false);
  assert.ok(typeof m.createdAt === 'number');
});
