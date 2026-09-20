(function attachDocxScreenshots() {
  // The Word guide embeds 408 original in-game screenshots.  They are grouped
  // by the same 26 phases used by the app, so the UI can show the relevant
  // screenshots beside each execution step without losing the source order.
  const ranges = {
    u1: [1, 61],
    k1: [62, 86],
    j1: [87, 122],
    h1: [123, 177],
    s1: [178, 218],
    k2: [219, 228],
    j2: [229, 234],
    u2: [235, 239],
    j3: [240, 253],
    s2: [254, 261],
    u3: [262, 264],
    h2: [265, 278],
    u4: [279, 286],
    j4: [287, 300],
    s3: [301, 308],
    k3: [309, 323],
    h3: [324, 341],
    j5: [342, 349],
    k4: [350, 353],
    s4: [354, 368],
    k5: [369, 369],
    j6: [370, 380],
    u5: [381, 388],
    h4: [389, 395],
    s5: [396, 400],
    k6: [401, 408]
  };

  const filesForRange = ([start, end]) => Array.from(
    { length: end - start + 1 },
    (_, offset) => `assets/docx/image${start + offset}.png`
  );

  window.guideData.docxScreenshots = Object.fromEntries(
    Object.entries(ranges).map(([phaseId, range]) => [phaseId, filesForRange(range)])
  );
  window.guideData.docxScreenshotTotal = 408;
})();
