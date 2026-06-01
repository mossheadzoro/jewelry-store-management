// Standard Code128 bar/space width patterns (values 0–106)
const CODE128_PATTERNS = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
  "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
  "114131","311141","411131","211412","211214","211232","2331112"
];

/**
 * Generates a Code128B barcode as an SVG string.
 */
export function generateBarcodeSVG(text: string, barHeight = 40): string {
  if (!text) return "";

  const START_B = 104;
  const STOP = 106;

  // Encode character values
  const values: number[] = [START_B];
  for (const ch of text) {
    const val = ch.charCodeAt(0) - 32;
    if (val >= 0 && val <= 94) values.push(val);
  }

  // Calculate check digit
  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += i * values[i];
  }
  values.push(checksum % 103);
  values.push(STOP);

  // Convert to binary modules (bar = true, space = false)
  const modules: boolean[] = [];
  for (const val of values) {
    const pattern = CODE128_PATTERNS[val];
    if (!pattern) continue;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j]);
      const isBar = j % 2 === 0;
      for (let k = 0; k < width; k++) {
        modules.push(isBar);
      }
    }
  }

  const moduleWidth = 1.5;
  const quietZone = 15;
  const totalWidth = modules.length * moduleWidth + quietZone * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${barHeight}" viewBox="0 0 ${totalWidth} ${barHeight}">`;
  svg += `<rect x="0" y="0" width="${totalWidth}" height="${barHeight}" fill="white"/>`;
  for (let i = 0; i < modules.length; i++) {
    if (modules[i]) {
      svg += `<rect x="${quietZone + i * moduleWidth}" y="0" width="${moduleWidth}" height="${barHeight}" fill="black"/>`;
    }
  }
  svg += "</svg>";
  return svg;
}

/**
 * Centrally prints multiple or single barcode labels.
 */
export function printBarcodes(products: any[], defaultSubCategoryName?: string) {
  const labels = products
    .map((product) => {
      const barcodeSvg = generateBarcodeSVG(product.barcode || product.productCode);
      const subCategoryName = product.subCategoryName || product.subCategory?.name || defaultSubCategoryName || "—";
      return `
      <div class="print-label-item">
        <div class="barcode-side">
          ${barcodeSvg}
          <span class="barcode-text">${product.barcode || ""}</span>
        </div>
        <div class="details-side">
          <div class="detail-row">
            <span class="label-key">NT WT</span>
            <span class="label-value">${product.ntWeight || "0"}g</span>
          </div>
          <div class="detail-row">
            <span class="label-key">TYPE</span>
            <span class="label-value">${subCategoryName}</span>
          </div>
          <div class="detail-row">
            <span class="label-key">PURITY</span>
            <span class="label-value">${product.purity || "—"}</span>
          </div>
          <div class="detail-row">
            <span class="label-key">HUID</span>
            <span class="label-value">${product.huidNumber || "—"}</span>
          </div>
        </div>
      </div>`;
    })
    .join("");

  // Create style element for print styles
  const styleEl = document.createElement("style");
  styleEl.id = "print-labels-style";
  styleEl.innerHTML = `
    @media print {
      body > *:not(#print-labels-container) {
        display: none !important;
      }
      #print-labels-container {
        display: block !important;
        background: white !important;
        color: black !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .print-labels-wrapper {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 12px !important;
        justify-content: flex-start !important;
      }
      .print-label-item {
        display: flex !important;
        border: 1.5px solid #000 !important;
        width: 300px !important;
        height: 90px !important;
        background: white !important;
        border-radius: 4px !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        color: black !important;
      }
      .barcode-side {
        flex: 1.2 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 6px !important;
        border-right: 1px dashed #999 !important;
      }
      .barcode-side svg { max-width: 100% !important; height: 40px !important; }
      .barcode-text {
        font-size: 7px !important;
        font-family: 'Courier New', monospace !important;
        margin-top: 3px !important;
        letter-spacing: 1px !important;
        color: black !important;
      }
      .details-side {
        flex: 1 !important;
        padding: 8px 10px !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        gap: 3px !important;
      }
      .detail-row {
        display: flex !important;
        justify-content: space-between !important;
        font-size: 8px !important;
        line-height: 1.5 !important;
      }
      .label-key {
        font-weight: 700 !important;
        color: #555 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
      }
      .label-value {
        font-weight: 600 !important;
        color: #000 !important;
        text-align: right !important;
        max-width: 60% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        color: black !important;
      }
    }
    #print-labels-container {
      display: none;
    }
  `;
  document.head.appendChild(styleEl);

  // Create container element
  const containerEl = document.createElement("div");
  containerEl.id = "print-labels-container";
  containerEl.innerHTML = `<div class="print-labels-wrapper">${labels}</div>`;
  document.body.appendChild(containerEl);

  // Trigger print
  window.print();

  // Cleanup
  const cleanup = () => {
    styleEl.remove();
    containerEl.remove();
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  // Fallback cleanup
  setTimeout(cleanup, 2000);
}
