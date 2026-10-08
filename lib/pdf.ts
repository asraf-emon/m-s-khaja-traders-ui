import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export type PdfBlock =
  | { kind: 'title'; text: string }
  | { kind: 'lines'; lines: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] };

function style(node: HTMLElement, rules: Partial<CSSStyleDeclaration>) {
  Object.assign(node.style, rules);
}

function text(tag: string, value: string, rules: Partial<CSSStyleDeclaration>) {
  const node = document.createElement(tag);
  node.textContent = value;
  style(node, rules);
  return node;
}

export async function downloadPdf(filename: string, blocks: PdfBlock[]) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  style(host, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '794px',
    padding: '28px',
    background: '#ffffff',
    color: '#122017',
    zIndex: '-1',
    pointerEvents: 'none',
    fontFamily: getComputedStyle(document.body).fontFamily,
  });

  const logo = document.createElement('img');
  logo.src = '/logo.png';
  logo.alt = '';
  style(logo, { width: '240px', height: 'auto', display: 'block', marginBottom: '16px' });
  host.appendChild(logo);

  for (const block of blocks) {
    if (block.kind === 'title') {
      host.appendChild(text('h1', block.text, { fontSize: '22px', lineHeight: '1.3', margin: '0 0 12px', fontWeight: '700' }));
    } else if (block.kind === 'lines') {
      for (const line of block.lines) {
        host.appendChild(text('p', line, { fontSize: '14px', lineHeight: '1.45', margin: '0 0 6px', whiteSpace: 'pre-wrap' }));
      }
    } else {
      const table = document.createElement('table');
      style(table, { width: '100%', borderCollapse: 'collapse', margin: '8px 0 16px', fontSize: '12px' });
      const head = document.createElement('tr');
      for (const header of block.headers) {
        const cell = text('th', header, { textAlign: 'left', padding: '8px', borderBottom: '2px solid #17632f', background: '#f3faf5' });
        head.appendChild(cell);
      }
      table.appendChild(head);
      const body = document.createElement('tbody');
      const rows = block.rows.length ? block.rows : [block.headers.map(() => '—')];
      for (const row of rows) {
        const tr = document.createElement('tr');
        for (const value of row) {
          tr.appendChild(text('td', value, {
            textAlign: 'left',
            padding: '7px 8px',
            borderBottom: '1px solid #d7e5db',
            verticalAlign: 'top',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }));
        }
        body.appendChild(tr);
      }
      table.appendChild(body);
      host.appendChild(table);
    }
  }

  host.appendChild(text('p', `© ${new Date().getFullYear()} M/S Khaja Traders. All Rights Reserved.`, {
    marginTop: '18px',
    fontSize: '11px',
    color: '#4b6356',
  }));

  document.body.appendChild(host);
  if (!logo.complete) {
    await new Promise<void>((resolve) => {
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
    });
  }
  await document.fonts.ready;

  try {
    const canvas = await html2canvas(host, { scale: 2, backgroundColor: '#ffffff', width: 794, windowWidth: 794 });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const image = canvas.toDataURL('image/jpeg', 0.92);
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imageHeight;
    let position = 0;
    pdf.addImage(image, 'JPEG', 0, position, pageWidth, imageHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 1) {
      position = heightLeft - imageHeight;
      pdf.addPage();
      pdf.addImage(image, 'JPEG', 0, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } finally {
    host.remove();
  }
}
