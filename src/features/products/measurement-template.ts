const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1500;
const BACKGROUND_COLOR = "#fbfaf4";
const LINE_COLOR = "#3a2416";
const TEXT_COLOR = "#3b2a20";
const LABEL_FILL = "#eee4d4";
const LOGO_URL = "/brand/retro-campus-logo.png";

type ProductMeasurementTemplateInput = {
  heightCm: string;
  widthCm: string;
};

export async function createProductMeasurementTemplateFile({
  heightCm,
  widthCm,
}: ProductMeasurementTemplateInput) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo preparar la plantilla de medidas.");
  }

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  drawBackground(context);
  await drawLogo(context);
  drawTShirt(context);
  drawMeasurementLines(context);
  drawMeasurementTable(context, {
    heightCm,
    widthCm,
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.92);
  });

  if (!blob) {
    throw new Error("No se pudo generar la plantilla de medidas.");
  }

  return new File([blob], "plantilla-medidas.webp", {
    type: "image/webp",
  });
}

function drawBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

async function drawLogo(context: CanvasRenderingContext2D) {
  try {
    const logo = await loadImage(LOGO_URL);
    const logoWidth = 160;
    const logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth);

    context.drawImage(logo, 910, 58, logoWidth, logoHeight);
  } catch {
    // The template remains usable even if the decorative brand mark cannot load.
  }
}

function drawTShirt(context: CanvasRenderingContext2D) {
  context.save();
  context.strokeStyle = LINE_COLOR;
  context.lineWidth = 3;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(480, 230);
  context.quadraticCurveTo(600, 282, 720, 230);
  context.lineTo(940, 330);
  context.lineTo(1050, 560);
  context.lineTo(920, 650);
  context.lineTo(850, 560);
  context.lineTo(850, 1060);
  context.quadraticCurveTo(600, 1086, 350, 1060);
  context.lineTo(350, 560);
  context.lineTo(280, 650);
  context.lineTo(150, 560);
  context.lineTo(260, 330);
  context.closePath();
  context.stroke();

  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(260, 330);
  context.quadraticCurveTo(330, 420, 350, 560);
  context.moveTo(940, 330);
  context.quadraticCurveTo(870, 420, 850, 560);
  context.stroke();

  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(600, 235, 86, 56, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  context.stroke();

  context.lineWidth = 2;
  context.setLineDash([9, 9]);
  context.beginPath();
  context.ellipse(600, 245, 112, 72, 0, 0.08 * Math.PI, 0.92 * Math.PI);
  context.moveTo(174, 548);
  context.quadraticCurveTo(230, 604, 300, 630);
  context.moveTo(1026, 548);
  context.quadraticCurveTo(970, 604, 900, 630);
  context.moveTo(350, 1038);
  context.quadraticCurveTo(600, 1062, 850, 1038);
  context.stroke();
  context.restore();
}

function drawMeasurementLines(context: CanvasRenderingContext2D) {
  context.save();
  context.strokeStyle = LINE_COLOR;
  context.fillStyle = LINE_COLOR;
  context.lineWidth = 2.6;
  context.lineCap = "round";

  drawLineWithDots(context, 475, 255, 475, 1060);
  drawLineWithDots(context, 350, 560, 850, 560);
  drawLabel(context, "A", 475, 750);
  drawLabel(context, "B", 640, 560);
  context.restore();
}

function drawMeasurementTable(
  context: CanvasRenderingContext2D,
  measurements: ProductMeasurementTemplateInput,
) {
  const x = 190;
  const y = 1110;
  const width = 820;
  const headerHeight = 98;
  const rowHeight = 88;
  const height = headerHeight + rowHeight * 2;
  const firstColumnWidth = 135;
  const secondColumnWidth = 370;

  context.save();
  context.strokeStyle = LINE_COLOR;
  context.fillStyle = TEXT_COLOR;
  context.lineWidth = 2.4;

  context.strokeRect(x, y, width, height);
  drawLine(context, x, y + headerHeight, x + width, y + headerHeight);
  drawLine(context, x, y + headerHeight + rowHeight, x + width, y + headerHeight + rowHeight);
  drawLine(context, x + firstColumnWidth, y + headerHeight, x + firstColumnWidth, y + height);
  drawLine(
    context,
    x + firstColumnWidth + secondColumnWidth,
    y + headerHeight,
    x + firstColumnWidth + secondColumnWidth,
    y + height,
  );

  context.font = "500 42px Georgia, serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("Medidas de la prenda", x + width / 2, y + headerHeight / 2);

  context.font = "500 42px Arial, sans-serif";
  context.fillText("A", x + firstColumnWidth / 2, y + headerHeight + rowHeight / 2);
  context.fillText("B", x + firstColumnWidth / 2, y + headerHeight + rowHeight * 1.5);

  context.font = "400 38px Arial, sans-serif";
  context.textAlign = "left";
  context.fillText("Alto", x + firstColumnWidth + 54, y + headerHeight + rowHeight / 2);
  context.fillText("Ancho", x + firstColumnWidth + 54, y + headerHeight + rowHeight * 1.5);

  context.textAlign = "center";
  context.fillText(
    `${measurements.heightCm} cm`,
    x + firstColumnWidth + secondColumnWidth + (width - firstColumnWidth - secondColumnWidth) / 2,
    y + headerHeight + rowHeight / 2,
  );
  context.fillText(
    `${measurements.widthCm} cm`,
    x + firstColumnWidth + secondColumnWidth + (width - firstColumnWidth - secondColumnWidth) / 2,
    y + headerHeight + rowHeight * 1.5,
  );

  context.restore();
}

function drawLineWithDots(
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  drawLine(context, startX, startY, endX, endY);
  drawDot(context, startX, startY);
  drawDot(context, endX, endY);
}

function drawLine(
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
}

function drawDot(context: CanvasRenderingContext2D, x: number, y: number) {
  context.beginPath();
  context.arc(x, y, 7, 0, Math.PI * 2);
  context.fill();
}

function drawLabel(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
) {
  context.save();
  context.fillStyle = LABEL_FILL;
  context.strokeStyle = LINE_COLOR;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(x, y, 35, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = TEXT_COLOR;
  context.font = "500 42px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x, y + 1);
  context.restore();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar el logo."));
    image.src = src;
  });
}
