"""Merge authored choice questions into a complete, data-only update package."""
import argparse
import copy
import json
from pathlib import Path
from urllib.parse import urlparse


def build(base, source, target, version):
    if base.get('format') != 'ai-study-bank' or base.get('schema') != 1:
        raise ValueError('base 必须是完整 ai-study-bank / schema 1 题库包，不是备份')
    if not version or len(version) > 80 or version == base.get('version'):
        raise ValueError('请使用与 base 不同、长度不超过 80 的新版本号')
    bank = copy.deepcopy(base)
    data = bank[target]
    module = source.get('module')
    if not isinstance(module, str) or not module.strip() or len(module) > 100:
        raise ValueError('module 应为 1–100 字的章节名称')
    if not isinstance(source.get('questions'), list) or not source['questions']:
        raise ValueError('questions 应是非空数组')
    if module not in data['modules']:
        data['modules'].append(module)
    ids = set()
    for entry in source['questions']:
        q = dict(entry)
        qid = q.get('id', len(data['questions']) + 1)
        if type(qid) is not int or not 1 <= qid <= len(data['questions']) + 1 or qid in ids:
            raise ValueError('id 必须为现有题号或下一连续题号，且不能重复；新增题建议省略 id')
        ids.add(qid)
        q.update(id=qid, module=data['modules'].index(module), code=q.get('code', ''), page=q.get('page', 1), difficulty=q.get('difficulty', '基础'))
        if q.get('type') not in ['单选', '多选'] or q['difficulty'] not in ['基础', '进阶']:
            raise ValueError(f'题 {qid}：type 或 difficulty 无效')
        if type(q['page']) is not int or q['page'] < 0:
            raise ValueError(f'题 {qid}：page 必须是非负整数')
        if not isinstance(q.get('options'), dict) or sorted(q['options']) != list('ABCD') or not all(isinstance(v, str) and v for v in q['options'].values()):
            raise ValueError(f'题 {qid}：options 需要 A、B、C、D 四个非空字符串')
        answer = q.get('answer')
        if not isinstance(answer, str) or not answer or any(k not in 'ABCD' for k in answer) or ''.join(sorted(set(answer))) != answer or (len(answer) != 1 if q['type'] == '单选' else len(answer) < 2):
            raise ValueError(f'题 {qid}：答案应为单个字母或升序、不重复的多选字母，如 AC')
        for key in ['stem', 'code', 'explanation', 'knowledge', 'pitfall', 'refs']:
            if not isinstance(q.get(key), str) or len(q[key]) > 200000:
                raise ValueError(f'题 {qid}：缺少字符串字段 {key} 或字段过长')
        u = urlparse(q['refs'])
        if target in ['basics', 'enterprise', 'training'] and (u.scheme != 'https' or not u.netloc or u.username or u.password):
            raise ValueError(f'题 {qid}：refs 必须是无凭据的 HTTPS 参考链接')
        if qid <= len(data['questions']):
            data['questions'][qid-1] = q
        else:
            data['questions'].append(q)
    if len(data['questions']) > 5000:
        raise ValueError('单题库不能超过 5000 题')
    bank.update(version=version, changelog=source.get('changelog', '自建题库内容更新'))
    return bank


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True, type=Path)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--target', choices=['ai', 'basics', 'enterprise', 'training'], default='enterprise')
    parser.add_argument('--version', required=True)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    try:
        if args.output.resolve() in [args.base.resolve(), args.input.resolve()]:
            raise ValueError('output 请使用新文件名，保留原始题库和输入文件')
        bank = build(json.loads(args.base.read_text(encoding='utf-8-sig')), json.loads(args.input.read_text(encoding='utf-8-sig')), args.target, args.version)
        text = json.dumps(bank, ensure_ascii=False)
        if len(text.encode('utf-8')) > 12000000:
            raise ValueError('题库包过大，请控制在 12 MB 以内')
        args.output.write_text(text, encoding='utf-8')
        print('Created:', args.output, 'version:', bank['version'])
    except (ValueError, KeyError, TypeError) as e:
        parser.exit(1, f'格式校验失败：{e}\n')
