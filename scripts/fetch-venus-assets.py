"""Fetch selected public files from the two user-supplied Venus Drive folders.

Run with PYTHONPATH pointing at a local gdown install. Imported source files stay
under output/imports; only curated web assets are copied into public separately.
"""
from pathlib import Path
import sys

from gdown.download import _get_session, download
from gdown.download_folder import _parse_google_drive_file

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'output/imports/venus-drive'
SESSION = _get_session(proxy=None, use_cookies=False, user_agent=None)
FOLDERS = {
    'latest-dist': '1PBtM0hSHLq1fUpMVNNyBL9ZNmZld-1iM',
    'latest-assets': '16wSCYtpOGdYMXXcMjGbS9fh8weZomhaS',
    'model': '1LksoyYe6NW03jwxJuQSojJVeXmY3b04z',
    'source': '1bYAjdESLSg3ql7peGCXEuFnO1cVuiBFY',
}
MUST_ASSETS = {'venus-detailed-facades.glb', 'venus-landscape-source.glb',
               'venus-skky-city.glb', 'venus-tower-placement.json'}


def items(folder_id):
    url = f'https://drive.google.com/drive/folders/{folder_id}?hl=en'
    response = SESSION.get(url, timeout=45)
    response.raise_for_status()
    return _parse_google_drive_file(url, response.text)[1]


def get(file_id, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and destination.stat().st_size:
        return True
    try:
        result = download(id=file_id, output=str(destination), quiet=True, resume=True,
                          use_cookies=False)
        if result:
            print('OK', destination.relative_to(DEST), destination.stat().st_size, flush=True)
            return True
    except Exception as error:
        print('ERROR', destination.relative_to(DEST), str(error)[:170], flush=True)
    return False


def main():
    source = FOLDERS['source']
    for file_id, name, kind in items(source):
        if name in MUST_ASSETS:
            get(file_id, DEST / 'source' / name)
    for file_id, name, kind in items(FOLDERS['model']):
        if name.endswith('.glb'):
            get(file_id, DEST / 'source' / name)
    for file_id, name, kind in items(FOLDERS['latest-dist']):
        if kind != 'application/vnd.google-apps.folder':
            get(file_id, DEST / 'latest' / name)
    for file_id, name, kind in items(FOLDERS['latest-assets']):
        if kind != 'application/vnd.google-apps.folder' and not name.startswith('apartment-'):
            get(file_id, DEST / 'latest' / 'assets' / name)


if __name__ == '__main__':
    main()
