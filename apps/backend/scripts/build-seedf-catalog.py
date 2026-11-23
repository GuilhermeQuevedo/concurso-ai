"""Gera o catálogo de um edital pronto (SEEDF 2022) a partir do PDF oficial.

Uso: python apps/backend/scripts/build-seedf-catalog.py <edital.pdf> [saida.json]
Requer PyMuPDF (pip install pymupdf). Lê o Anexo IV (conteúdo programático) e separa, por cargo,
as matérias e os tópicos numerados. Depois de gerar, rode `pnpm --filter @concurso-ai/backend test`.
"""
import argparse, io, json, os, re, sys, unicodedata

import fitz

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
ROOT = os.path.dirname(os.path.abspath(__file__))
parser = argparse.ArgumentParser()
parser.add_argument('pdf')
parser.add_argument('out', nargs='?', default=os.path.join(ROOT, '..', 'src', 'data', 'editais-prontos', 'seedf-2022.json'))
args = parser.parse_args()
OUT = os.path.dirname(os.path.abspath(args.out))
OUT_FILE = os.path.abspath(args.out)

PAGE_HEADER = re.compile(r'Edital nº 31 publicado.*?Editais nºs 2 e 3 de 2023\s*\d{0,3}', re.S)


def read_annex(pdf_path):
    doc = fitz.open(pdf_path)
    start = next(i for i, page in enumerate(doc) if 'ANEXO IV' in page.get_text() and 'CONHECIMENTOS BÁSICOS' in page.get_text())
    text = ' '.join(doc[i].get_text() for i in range(start, doc.page_count))
    text = PAGE_HEADER.sub(' ', text)
    text = text[: text.index('ANEXO V')]
    return re.sub(r'\s+', ' ', text)


t = read_annex(args.pdf)

HEAD = re.compile(r'(?<!\S)(\d\.\d{1,2}(?:\.\d{1,2})?) ((?:[A-ZÀ-Ú][A-ZÀ-Ú ,/\-–()]{5,}[A-ZÀ-Ú\)])|(?:PEDAGOGO[A-ZÀ-Ú ,/\-–()]+))(?: \(((?:CARGO|CARGOS)[^)]*)\))?:')
marks = [(m.start(), m.end(), m.group(1), m.group(2).strip(), m.group(3)) for m in HEAD.finditer(t)]


def slug(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def find_item(body, pos, n):
    for cand in (n, n + 1, n + 2):
        rx = re.compile(r'(?:(?<=\.)\s?|(?<=[;:)] ))' + str(cand) + r'\.? (?=[A-ZÀ-Úa-zà-ú"“(])')
        for m in rx.finditer(body, pos):
            before = body[:m.start()]
            if before.endswith('.') and re.search(r'(?:^|[\s.])\d{1,2}\.$', before):
                continue
            return cand, m.start(), m.end()
    m = re.compile(r'(?<=[a-zà-ú]) ' + str(n) + r' (?=[A-ZÀ-Ú])').search(body, pos)
    return (n, m.start(), m.end()) if m else None


def split_topics(body):
    body = body.strip()
    positions = []
    pos = 0
    first = re.match(r'1 (?=\S)', body)
    if first:
        positions.append((1, 0, first.end()))
        pos = first.end()
    else:
        positions.append((1, 0, 0))
    n = 2
    while True:
        m = find_item(body, pos, n)
        if not m:
            break
        n = m[0]
        positions.append((n, m[1], m[2]))
        pos = m[2]
        n += 1
    topics = []
    for i, (num, s, e) in enumerate(positions):
        end = positions[i + 1][1] if i + 1 < len(positions) else len(body)
        topics.append(body[e:end].strip())
    return [x for x in topics if x]


TITLE = re.compile(r'(?:^|(?<=[.;)] ))([A-ZÀ-Ú][^.:;]{2,100}?): (?=1 \S)')


def split_sections(body):
    body = re.sub(r'\s3\.2 CARGOS DA CARREIRA.*$', '', body).strip()
    ms = list(TITLE.finditer(body))
    if not ms:
        return [(None, body)]
    out = []
    if ms[0].start() > 0 and body[:ms[0].start()].strip():
        out.append((None, body[:ms[0].start()].strip()))
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else len(body)
        out.append((m.group(1).strip(), body[m.end():end].strip()))
    return out


def tidy(topic):
    topic = re.sub(r'\s+', ' ', topic).strip()
    topic = re.sub(r'(?<=\s)(\d{1,2}(?:\.\d{1,2})+) \d{2,3} (?=[A-ZÀ-Ú])', r' ', topic)
    return topic.rstrip('.').strip()


def section(i):
    start = marks[i][1]
    end = marks[i + 1][0] if i + 1 < len(marks) else len(t)
    return t[start:end]


blocks = {}
for i, (s, e, num, name, cargo) in enumerate(marks):
    secs = [(ti, [tidy(x) for x in split_topics(tx)]) for ti, tx in split_sections(section(i))]
    blocks[num] = {'name': name, 'cargo': cargo, 'sections': secs, 'topics': [x for _, tp in secs for x in tp]}


def clean_name(n):
    n = re.sub(r'\s*\((?:SOMENTE|PARA)[^)]*\)', '', n).strip()
    return n.title().replace(' De ', ' de ').replace(' Da ', ' da ').replace(' E ', ' e ').replace(' Do ', ' do ').replace(' Para ', ' para ').replace(' Na ', ' na ').replace(' Em ', ' em ').replace(' Acerca ', ' acerca ').replace(' Aos ', ' aos ')


def disc(num, label=None):
    b = blocks[num]
    return {'name': label or clean_name(b['name']), 'topics': b['topics']}


commonN = ['1.1', '1.2', '1.3', '1.4', '1.5']
magN = ['2.1', '2.2']
assistN = ['2.3']
shared = {
    'basicos': [disc(n) for n in commonN],
    'magisterio': [disc('2.1', 'Legislação (Magistério Público)'), disc('2.2')],
    'assistencia': [disc('2.3', 'Legislação (Assistência à Educação)')],
}

cargos = []
for num, b in blocks.items():
    if not re.match(r'3\.[12]\.\d+$', num):
        continue
    full = b['name']
    if full.startswith('PROFESSOR DE EDUCAÇÃO BÁSICA'):
        group, area = 'Professor de Educação Básica', full.split('–')[-1].strip()
        track = 'magisterio'
    elif full.startswith('PEDAGOGO'):
        group, area = 'Pedagogo', 'Orientador Educacional'
        track = 'magisterio'
    else:
        group, area = 'Gestor em Políticas Públicas e Gestão Educacional', full.split('–')[-1].strip()
        track = 'assistencia'
    area_t = area.title().replace(' E ', ' e ').replace(' De ', ' de ').replace(' Da ', ' da ').replace('Lem/', 'LEM – ').replace('Lingua', 'Língua')
    cargos.append({
        'id': slug(('gestor ' if track == 'assistencia' else '') + area),
        'group': group,
        'name': area_t,
        'cargoCode': (b['cargo'] or '').replace('CARGOS', 'Cargos').replace('CARGO', 'Cargo').replace(' ATÉ ', ' a '),
        'track': track,
        'groupLabel': {'Professor de Educação Básica': 'Professores', 'Pedagogo': 'Pedagogo'}.get(group, 'Gestores'),
        'label': ('Pedagogo – ' + area_t) if group == 'Pedagogo' else (('Professor de ' if track == 'magisterio' else 'Gestor em ') + area_t),
        'specific': [
            {'name': (ti if ti and len(b['sections']) > 1 else f'Conhecimentos Específicos – {area_t}'), 'topics': tp}
            if not (ti is None and len(b['sections']) > 1) else {'name': f'Conhecimentos Específicos – {area_t}', 'topics': tp}
            for ti, tp in b['sections']
        ],
    })

problems = []
for c in cargos:
    if sum(len(d['topics']) for d in c['specific']) < 3:
        problems.append((c['id'], len(c['specific'])))
for k, v in shared.items():
    for d in v:
        if len(d['topics']) < 1:
            problems.append((k, d['name'], 0))

catalog = {
    'id': 'seedf-2022',
    'area': 'Educação',
    'title': 'SEEDF – Último edital',
    'shortName': 'SEEDF 2022',
    'organization': 'SEEDF',
    'description': 'Secretaria de Estado de Educação do Distrito Federal · Edital nº 31/2022. Conteúdo programático oficial, separado por cargo.',
    'shared': shared,
    'cargos': cargos,
}
os.makedirs(OUT, exist_ok=True)
json.dump(catalog, open(OUT_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(cargos), 'cargos; problemas:', problems)
if problems:
    sys.exit(1)
print('salvo em', OUT_FILE)
