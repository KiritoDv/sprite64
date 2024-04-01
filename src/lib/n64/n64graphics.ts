export enum N64Codec {
  RGBA16,
  RGBA32,
  IA16,
  IA8,
  IA4,
  I8,
  I4,
  CI8,
  CI4,
  ONEBPP,
}

export enum N64IMode {
  AlphaCopyIntensity,
  AlphaBinary,
  AlphaOne,
}

export class Bitmap {
  public Width: number;
  public Height: number;
  private Pixels: Color[];

  constructor(width: number, height: number) {
    this.Width = width;
    this.Height = height;
    this.Pixels = new Array<Color>(width * height);
  }

  public SetPixel(x: number, y: number, color: Color) {
    this.Pixels[y * this.Width + x] = color;
  }

  public GetPixel(x: number, y: number): Color {
    return this.Pixels[y * this.Width + x];
  }
}

export class Color {
  public A: number;
  public R: number;
  public G: number;
  public B: number;

  constructor(a: number, r: number, g: number, b: number) {
    this.A = a;
    this.R = r;
    this.G = g;
    this.B = b;
  }

  public static FromArgb(a: number, r: number, g: number, b: number): Color {
    return new Color(a, r, g, b);
  }

  public static FromArgbInt(argb: number): Color {
    let a = (argb >> 24) & 0xff;
    let r = (argb >> 16) & 0xff;
    let g = (argb >> 8) & 0xff;
    let b = argb & 0xff;
    return new Color(a, r, g, b);
  }

  public static FromHexString(hex: string): Color {
    let a = 0xff;
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    return new Color(a, r, g, b);
  }

  public ToArgb(): number {
    return (this.A << 24) | (this.R << 16) | (this.G << 8) | this.B;
  }

  public ToInt(): number {
    return (this.A << 24) | (this.R << 16) | (this.G << 8) | this.B;
  }

  public ToHexString(): string {
    return `#${this.R.toString(16).padStart(2, '0')}${this.G.toString(16).padStart(2, '0')}${this.B.toString(16).padStart(2, '0')}`;
  }

  public ToString(): string {
    return `A: ${this.A}, R: ${this.R}, G: ${this.G}, B: ${this.B}`;
  }
}

export default class N64Graphics {
  private static SCALE_5_8(val: number): number {
    return (val * 0xff) / 0x1f;
  }

  private static SCALE_8_5(val: number): number {
    return ((val + 4) * 0x1f) / 0xff;
  }

  private static SCALE_8_4(val: number): number {
    return val / 0x11;
  }

  private static SCALE_3_8(val: number): number {
    return (val * 0xff) / 0x7;
  }

  private static SCALE_8_3(val: number): number {
    return val / 0x24;
  }

  public static RGBA16Color(c0: number, c1: number): Color {
    let r = N64Graphics.SCALE_5_8((c0 & 0xf8) >> 3);
    let g = N64Graphics.SCALE_5_8(((c0 & 0x07) << 2) | ((c1 & 0xc0) >> 6));
    let b = N64Graphics.SCALE_5_8((c1 & 0x3e) >> 1);
    let a = (c1 & 0x1) > 0 ? 255 : 0;
    return Color.FromArgb(a, r, g, b);
  }

  public static RGBA16ColorArray(data: Uint8Array, pixOffset: number): Color {
    let c0 = data[pixOffset];
    let c1 = data[pixOffset + 1];
    return N64Graphics.RGBA16Color(c0, c1);
  }

  public static RGBA32Color(data: Uint8Array, pixOffset: number): Color {
    let r = data[pixOffset + 0];
    let g = data[pixOffset + 1];
    let b = data[pixOffset + 2];
    let a = data[pixOffset + 3];
    return Color.FromArgb(a, r, g, b);
  }

  public static IA16Color(data: Uint8Array, pixOffset: number): Color {
    let i = data[pixOffset];
    let a = data[pixOffset + 1];
    return Color.FromArgb(a, i, i, i);
  }

  public static IA8Color(data: Uint8Array, pixOffset: number): Color {
    let i, a;
    let c = data[pixOffset];
    i = (c >> 4) * 0x11;
    a = (c & 0xF) * 0x11;
    return Color.FromArgb(a, i, i, i);
  }

  public static IA4Color(
    data: Uint8Array,
    pixOffset: number,
    nibble: number
  ): Color {
    let shift = (1 - nibble) * 4;
    let i, a;
    let val = (data[pixOffset] >> shift) & 0xf;
    i = N64Graphics.SCALE_3_8(val >> 1);
    a = (val & 0x1) > 0 ? 0xff : 0x00;
    return Color.FromArgb(a, i, i, i);
  }

  public static I8Color(
    data: Uint8Array,
    pixOffset: number,
    mode: N64IMode = N64IMode.AlphaCopyIntensity
  ): Color {
    let i = data[pixOffset];
    let a = i;
    switch (mode) {
      case N64IMode.AlphaBinary:
        a = i == 0 ? 0 : 0xff;
        break;
      case N64IMode.AlphaCopyIntensity:
        a = i;
        break;
      case N64IMode.AlphaOne:
        a = 0xff;
        break;
    }
    return Color.FromArgb(a, i, i, i);
  }

  public static I4Color(
    data: Uint8Array,
    pixOffset: number,
    nibble: number,
    mode: N64IMode = N64IMode.AlphaCopyIntensity
  ): Color {
    let shift = (1 - nibble) * 4;
    let i = (data[pixOffset] >> shift) & 0xf;
    i *= 0x11;
    let a = i;
    switch (mode) {
      case N64IMode.AlphaBinary:
        a = i == 0 ? 0 : 0xff;
        break;
      case N64IMode.AlphaCopyIntensity:
        a = i;
        break;
      case N64IMode.AlphaOne:
        a = 0xff;
        break;
    }
    return Color.FromArgb(a, i, i, i);
  }

  public static CI8Color(
    data: Uint8Array,
    palette: Uint8Array,
    pixOffset: number
  ): Color {
    let c0, c1;
    let palOffset = 2 * data[pixOffset];
    c0 = palette[palOffset];
    c1 = palette[palOffset + 1];

    return N64Graphics.RGBA16Color(c0, c1);
  }

  public static CI4Color(
    data: Uint8Array,
    palette: Uint8Array,
    pixOffset: number,
    nibble: number
  ): Color {
    let c0, c1;
    let shift = (1 - nibble) * 4;
    let palOffset = 2 * ((data[pixOffset] >> shift) & 0xf);
    c0 = palette[palOffset];
    c1 = palette[palOffset + 1];

    return N64Graphics.RGBA16Color(c0, c1);
  }

  public static BPPColor(
    data: Uint8Array,
    pixOffset: number,
    bit: number
  ): Color {
    let i, a;
    let val = (data[pixOffset] >> (7 - bit)) & 0x1;
    i = a = val == 0 ? 0x00 : 0xff;
    return Color.FromArgb(a, i, i, i);
  }

  public static PixelsToBytes(codec: N64Codec, numPixels: number): number {
    switch (codec) {
      case N64Codec.RGBA16:
        return numPixels * 2;
      case N64Codec.RGBA32:
        return numPixels * 4;
      case N64Codec.IA16:
        return numPixels * 2;
      case N64Codec.IA8:
        return numPixels;
      case N64Codec.IA4:
        return numPixels / ~2;
      case N64Codec.I8:
        return numPixels;
      case N64Codec.I4:
        return numPixels / ~2;
      case N64Codec.CI8:
        return numPixels;
      case N64Codec.CI4:
        return numPixels / ~2;
      case N64Codec.ONEBPP:
        return numPixels / ~8;
    }

    throw new Error("Invalid N64Codec");
  }

  public static Codecs(): N64Codec[] {
    return [
      N64Codec.RGBA16,
      N64Codec.RGBA32,
      N64Codec.IA16,
      N64Codec.IA8,
      N64Codec.IA4,
      N64Codec.I8,
      N64Codec.I4,
      N64Codec.CI8,
      N64Codec.CI4,
      N64Codec.ONEBPP,
    ];
  }

  public static CodecString(codec: N64Codec): string {
    switch (codec) {
      case N64Codec.RGBA16:
        return "RGBA16";
      case N64Codec.RGBA32:
        return "RGBA32";
      case N64Codec.IA16:
        return "IA16";
      case N64Codec.IA8:
        return "IA8";
      case N64Codec.IA4:
        return "IA4";
      case N64Codec.I8:
        return "I8";
      case N64Codec.I4:
        return "I4";
      case N64Codec.CI8:
        return "CI8";
      case N64Codec.CI4:
        return "CI4";
      case N64Codec.ONEBPP:
        return "1BPP";
    }

    throw new Error("Invalid N64Codec");
  }

  public static Modes(): N64IMode[] {
    return [
      N64IMode.AlphaCopyIntensity,
      N64IMode.AlphaBinary,
      N64IMode.AlphaOne,
    ];
  }

  public static ModeString(mode: N64IMode): string {
    switch (mode) {
      case N64IMode.AlphaCopyIntensity:
        return "Intensity";
      case N64IMode.AlphaBinary:
        return "Binary";
      case N64IMode.AlphaOne:
        return "Full";
    }

    throw new Error("Invalid N64IMode");
  }

  public static MakeColor(
    data: Uint8Array,
    palette: Uint8Array,
    offset: number,
    select: number,
    codec: N64Codec,
    mode: N64IMode
  ): Color {
    let color: Color;
    switch (codec) {
      case N64Codec.RGBA16:
        color = N64Graphics.RGBA16ColorArray(data, offset);
        break;
      case N64Codec.RGBA32:
        color = N64Graphics.RGBA32Color(data, offset);
        break;
      case N64Codec.IA16:
        color = N64Graphics.IA16Color(data, offset);
        break;
      case N64Codec.IA8:
        color = N64Graphics.IA8Color(data, offset);
        break;
      case N64Codec.IA4:
        color = N64Graphics.IA4Color(data, offset, select);
        break;
      case N64Codec.I8:
        color = N64Graphics.I8Color(data, offset, mode);
        break;
      case N64Codec.I4:
        color = N64Graphics.I4Color(data, offset, select, mode);
        break;
      case N64Codec.CI8:
        color = N64Graphics.CI8Color(data, palette, offset);
        break;
      case N64Codec.CI4:
        color = N64Graphics.CI4Color(data, palette, offset, select);
        break;
      case N64Codec.ONEBPP:
        color = N64Graphics.BPPColor(data, offset, select);
        break;
      default:
        color = N64Graphics.RGBA16ColorArray(data, offset);
        break;
    }
    return color;
  }

  public static RenderTexture(
    g: CanvasRenderingContext2D,
    data: Uint8Array,
    palette: Uint8Array,
    offset: number,
    width: number,
    height: number,
    scale: number,
    codec: N64Codec,
    mode: N64IMode
  ) {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        let pixOffset = h * width + w;
        let bytesPerPix = 1;
        let select = 0;
        switch (codec) {
          case N64Codec.RGBA16:
            bytesPerPix = 2;
            pixOffset *= bytesPerPix;
            break;
          case N64Codec.RGBA32:
            bytesPerPix = 4;
            pixOffset *= bytesPerPix;
            break;
          case N64Codec.IA16:
            bytesPerPix = 2;
            pixOffset *= bytesPerPix;
            break;
          case N64Codec.IA8:
            break;
          case N64Codec.IA4:
            select = pixOffset & 0x1;
            pixOffset /= 2;
            break;
          case N64Codec.I8:
            break;
          case N64Codec.I4:
          case N64Codec.CI4:
            select = pixOffset & 0x1;
            pixOffset /= 2;
            break;
          case N64Codec.CI8:
            break;
          case N64Codec.ONEBPP:
            select = pixOffset & 0x7;
            pixOffset /= 8;
            break;
        }
        pixOffset += offset;
        if (data.length > pixOffset + bytesPerPix - 1) {
          let color = N64Graphics.MakeColor(
            data,
            palette,
            pixOffset,
            select,
            codec,
            mode
          );
          g.save();
          g.fillStyle = `rgb(${color.R}, ${color.G}, ${color.B})`;
          g.globalAlpha = color.A / 255;
          g.fillRect(w * scale, h * scale, scale, scale);
          g.restore();
        }
      }
    }
  }

  // return palette index of matching c0/c1 16-bit dataset, or -1 if not found
  private static PaletteIndex(
    pal: Uint8Array,
    palCount: number,
    c0: number,
    c1: number
  ): number {
    for (let i = 0; i < palCount; i++) {
      if (pal[2 * i] == c0 && pal[2 * i + 1] == c1) {
        return i;
      }
    }
    return -1;
  }

  public static Convert(
    imageData: Uint8Array,
    paletteData: Uint8Array,
    codec: N64Codec,
    bm: Bitmap
  ) {
    let numPixels = bm.Width * bm.Height;
    imageData = new Uint8Array(N64Graphics.PixelsToBytes(codec, numPixels));
    let palCount = 0;
    switch (codec) {
      case N64Codec.RGBA16:
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let r, g, b;
            r = N64Graphics.SCALE_8_5(col.R);
            g = N64Graphics.SCALE_8_5(col.G);
            b = N64Graphics.SCALE_8_5(col.B);
            let c0 = (r << 3) | (g >> 2);
            let c1 = ((g & 0x3) << 6) | (b << 1) | (col.A > 0 ? 1 : 0);
            let idx = 2 * (y * bm.Width + x);
            imageData[idx + 0] = c0;
            imageData[idx + 1] = c1;
          }
        }
        break;
      case N64Codec.RGBA32:
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let idx = 4 * (y * bm.Width + x);
            imageData[idx + 0] = col.R;
            imageData[idx + 1] = col.G;
            imageData[idx + 2] = col.B;
            imageData[idx + 3] = col.A;
          }
        }
        break;
      case N64Codec.IA16:
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let sum = col.R + col.G + col.B;
            let intensity = sum / 3;
            let alpha = col.A;
            let idx = 2 * (y * bm.Width + x);
            imageData[idx + 0] = intensity;
            imageData[idx + 1] = alpha;
          }
        }
        break;
      case N64Codec.IA8:
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let sum = col.R + col.G + col.B;
            let intensity = N64Graphics.SCALE_8_4(sum / 3);
            let alpha = N64Graphics.SCALE_8_4(col.A);
            let idx = y * bm.Width + x;
            imageData[idx] = (intensity << 4) | alpha;
          }
        }
        break;
      case N64Codec.IA4:
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let sum = col.R + col.G + col.B;
            let intensity = N64Graphics.SCALE_8_3(sum / 3);
            let alpha = col.A > 0 ? 1 : 0;
            let idx = y * bm.Width + x;
            let old = imageData[idx / 2];
            if (idx % 2 > 0) {
              imageData[idx / 2] = (old & 0xf0) | (intensity << 1) | alpha;
            } else {
              imageData[idx / 2] =
                (old & 0x0f) | (((intensity << 1) | alpha) << 4);
            }
          }
        }
        break;
      case N64Codec.I8:
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let sum = col.R + col.G + col.B;
            let intensity = sum / 3;
            let idx = y * bm.Width + x;
            imageData[idx] = intensity;
          }
        }
        break;
      case N64Codec.I4:
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let sum = col.R + col.G + col.B;
            let intensity = N64Graphics.SCALE_8_4(sum / 3);
            let idx = y * bm.Width + x;
            let old = imageData[idx / 2];
            if (idx % 2 > 0) {
              imageData[idx / 2] = (old & 0xf0) | intensity;
            } else {
              imageData[idx / 2] = (old & 0x0f) | (intensity << 4);
            }
          }
        }
        break;
      case N64Codec.CI4:
        paletteData = new Uint8Array(16 * 2);
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let r, g, b;
            r = N64Graphics.SCALE_8_5(col.R);
            g = N64Graphics.SCALE_8_5(col.G);
            b = N64Graphics.SCALE_8_5(col.B);
            let c0 = (r << 3) | (g >> 2);
            let c1 = ((g & 0x3) << 6) | (b << 1) | (col.A > 0 ? 1 : 0);
            let idx = y * bm.Width + x;
            let palIdx = N64Graphics.PaletteIndex(
              paletteData,
              palCount,
              c0,
              c1
            );
            if (palIdx < 0) {
              if (palCount < paletteData.length / 2) {
                palIdx = palCount;
                paletteData[2 * palCount] = c0;
                paletteData[2 * palCount + 1] = c1;
                palCount++;
              } else {
                palIdx = 0;
                // TODO: out of palette entries. error or pick closest?
              }
            }
            let old = imageData[idx / 2];
            if (idx % 2 > 0) {
              imageData[idx / 2] = (old & 0xf0) | palIdx;
            } else {
              imageData[idx / 2] = (old & 0x0f) | (palIdx << 4);
            }
          }
        }
        break;
      case N64Codec.CI8:
        paletteData = new Uint8Array(256 * 2);
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let r, g, b;
            r = N64Graphics.SCALE_8_5(col.R);
            g = N64Graphics.SCALE_8_5(col.G);
            b = N64Graphics.SCALE_8_5(col.B);
            let c0 = (r << 3) | (g >> 2);
            let c1 = ((g & 0x3) << 6) | (b << 1) | (col.A > 0 ? 1 : 0);
            let idx = y * bm.Width + x;
            let palIdx = N64Graphics.PaletteIndex(
              paletteData,
              palCount,
              c0,
              c1
            );
            if (palIdx < 0) {
              if (palCount < paletteData.length / 2) {
                palIdx = palCount;
                paletteData[2 * palCount] = c0;
                paletteData[2 * palCount + 1] = c1;
                palCount++;
              } else {
                palIdx = 0;
                // TODO: out of palette entries. error or pick closest?
              }
            }
            imageData[idx] = palIdx;
          }
        }
        break;
      case N64Codec.ONEBPP:
        for (let y = 0; y < bm.Height; y++) {
          for (let x = 0; x < bm.Width; x++) {
            let col = bm.GetPixel(x, y);
            let sum = col.R + col.G + col.B;
            let intensity = sum > 0 ? 1 : 0;
            let idx = y * bm.Width + x;
            let old = imageData[idx / 8];
            let bit = idx % 8;
            let mask = ~(1 << bit);
            imageData[idx / 8] = (old & mask) | (intensity << bit);
          }
        }
        break;
    }
  }
}
