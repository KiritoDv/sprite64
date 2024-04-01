import Provider from "./listener";
import { Color, N64Codec, N64IMode } from "./n64/n64graphics";

export default class GlobalState {
    public static scale = 5;
    public static background = Color.FromArgb(255, 255, 255, 255);
    public static codec = N64Codec.IA8;
    public static mode = N64IMode.AlphaCopyIntensity;
    public static buffer: Uint8Array = new Uint8Array(0);
    public static offset: number = 0;

    public static setBuffer(buffer: Uint8Array) {
        GlobalState.buffer = buffer;
        GlobalState.offset = 0;
        Provider.notify();
    }

    public static setOffset(offset: number) {
        GlobalState.offset = offset;
        Provider.notify();
    }

    public static setScale(scale: number) {
        GlobalState.scale = scale;
        Provider.notify();
    }

    public static setCodec(codec: N64Codec) {
        GlobalState.codec = codec;
        Provider.notify();
    }

    public static setMode(mode: N64IMode) {
        GlobalState.mode = mode;
        Provider.notify();
    }

    public static setBackground(color: Color) {
        GlobalState.background = color;
        Provider.notify();
    }
}