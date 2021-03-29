import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

import { AppConfig } from 'src/core/app-config';


/**
 * Service wrapper for file-server library.
 *
 * **Dependencies**
 *
 * ```bash
 * npm install --save file-saver
 * # Additional typescript definitions
 * npm install @types/file-saver --save-dev
 * ```
 *
 * **Usage**
 *
 * ```typescript
 * import { SaveAsService } from 'src/core/util/ts-utils';
 *
 * export class MyComponent {
 *   constructor(
 *   ) {
 *     public saveAs: SaveAsService,
 *   }
 *
 *   printInvoices() {
 *     this.api.get('print_invoices').subscribe(response => {
 *       this.saveAs.file(response);
 *     });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SaveAsService {
  private debug = true && AppConfig.debugEnabled;

  constructor(
  ) {
  }

  // ---------------------------------------------------------------------------------------------------
  //  fileFromServer
  // ---------------------------------------------------------------------------------------------------

  file(data: any): void {
    if (data && (data.blob || data.base64)) {
      const fileType = data.fileType || 'pdf';
      const fileName = data.fileName || 'Document.' + fileType;
      const contentType = data.contentType || this.getMimeType(fileType);
      const base64 = this.base64toBlob(data.blob || data.base64, contentType);
      saveAs(base64, fileName); // FileSaver.js
    }
  }

  private base64toBlob(b64Data: string, contentType: string, sliceSize: number = 2048): Blob {
    contentType = contentType || '';
    sliceSize = sliceSize || 1024 * 2;
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) { byteNumbers[i] = slice.charCodeAt(i); }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, {type: contentType});
  }

  private getMimeType(fileType: string): string {
    switch (fileType) {
      case 'xls':
      case 'xlsx':
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';
      default: return `application/${fileType};charset=utf-8`;
    }
  }

}
