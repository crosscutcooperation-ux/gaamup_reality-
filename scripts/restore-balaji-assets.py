"""Restore exact supplied apartment GLBs from the lossless release package."""
from pathlib import Path
import argparse, hashlib, json, re, tarfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('archive', type=Path)
parser.add_argument('--data-dir', type=Path, default=root / 'backend/data')
args = parser.parse_args()
index = json.loads((root / 'public/scenes/balaji-classica/assets/apartments/index.json').read_text())
models = [*index['units'].values(), *index['alternatives']]
expected = {Path(model['url']).name: model for model in models}
target = args.data_dir / 'scene-assets/balaji-apartments'
target.mkdir(parents=True, exist_ok=True)
with tarfile.open(args.archive) as package:
    files = json.load(package.extractfile('files.json'))
    if set(files) != set(expected):
        raise ValueError('The package must contain exactly the 41 indexed Balaji models.')
    for name, keys in files.items():
        if Path(name).name != name or any(not re.fullmatch('[a-f0-9]{64}', key) for key in keys):
            raise ValueError('Invalid package entry.')
        model = expected[name]
        content = b''.join(package.extractfile('chunks/' + key).read() for key in keys)
        if len(content) != model['bytes'] or hashlib.sha256(content).hexdigest() != model['sha256']:
            raise ValueError('Apartment checksum mismatch: ' + name)
        temporary = target / (name + '.partial')
        temporary.write_bytes(content)
        temporary.replace(target / name)
print('Restored and verified 41 unchanged furnished apartment GLBs.')
