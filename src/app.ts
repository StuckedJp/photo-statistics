import fs from 'fs';
import path from 'path';
import { exiftool } from 'exiftool-vendored';

export class App {
  private readonly IMAGE_EXTENSIONS = ['.cr2', '.cr3'];

  async run() {
    try {
      const targetDirs = process.argv.slice(2);
      const header = [
        'ファイル',
        'カメラ',
        'レンズ',
        '焦点距離[mm]',
        'ISO 感度',
        'シャッタースピード[s]',
        '絞り',
      ];
      console.log(header.join(','));

      await Promise.all(targetDirs.map((d) => this.scanDirectoryRecursive(d)));
    } finally {
      exiftool.end();
    }
  }

  private async scanDirectoryRecursive(dirPath: string) {
    await this.findImageFiles(dirPath);
  }

  private async readPhotoInfo(filePath: string) {
    const tags = await exiftool.read(filePath);
    const camera = tags?.Model || '-';
    const lens = tags?.LensModel || tags?.LensInfo || '-';
    const focalLength = tags?.FocalLength || '-';
    const iso = tags?.ISO || '-';
    const shutterSpeed = tags?.ShutterSpeed || '-';
    const aperture = tags?.Aperture || '-';
    // const focalLength35mm = tags?.FocalLengthIn35mmFormat
    //   ? `${tags.FocalLengthIn35mmFormat}mm`
    //   : null;

    const row = [
      `"${filePath}"`,
      `"${camera}"`,
      `"${lens}"`,
      `"${focalLength}"`,
      `"${iso}"`,
      `"${shutterSpeed}"`,
      `"${aperture}"`,
    ];
    console.log(row.join(','));
  }

  /**
   * サブフォルダを含めて画像ファイルを再帰検索
   */
  private async findImageFiles(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 再帰的に探索
        await this.findImageFiles(fullPath);
        continue;
      }

      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();

        if (this.IMAGE_EXTENSIONS.includes(ext)) {
          await this.readPhotoInfo(fullPath);
        }
      }
    }
  }
}
