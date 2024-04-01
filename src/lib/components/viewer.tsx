import { Attributes, Ref } from "preact";
import { useEffect, useRef } from "preact/hooks";
import Provider from "../listener";
import GlobalState from "../state";
import N64Graphics from "../n64/n64graphics";

interface GraphicsViewerProps extends Attributes {
    width: number;
    height: number;
    canvasId: string;
    scale: number;
    hideSize?: boolean;
}

function draw(props: GraphicsViewerProps, canvas: HTMLCanvasElement){
    let ctx = canvas.getContext('2d');

    ctx.fillStyle = `${GlobalState.background.ToHexString()}`
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if(GlobalState.buffer.length < 1) return;

    let { buffer, offset, codec, mode } = GlobalState;

    ctx.save();
    ctx.scale(props.scale, props.scale);
    N64Graphics.RenderTexture(ctx, buffer, new Uint8Array(0), offset, canvas.width / props.scale, canvas.height / props.scale, 1, codec, mode);
    ctx.restore();
}

function pushFrame(props: GraphicsViewerProps, canvas: HTMLCanvasElement){
    window.requestAnimationFrame(() => {
        draw(props, canvas);
    });
}

export function GraphicsViewer(props: GraphicsViewerProps) {
    const canvasRef = useRef(null);

    useEffect(() => {
        pushFrame(props, canvasRef.current);
        Provider.addListener(() => {
            pushFrame(props, canvasRef.current);
        });
    }, [canvasRef]);

    return (
        <div className="viewer" style={{width: props.width * props.scale, height: props.height * props.scale}}>
            { !(props.hideSize ?? false) ? <span>{props.width}x{props.height}</span> : null }
            <canvas ref={canvasRef} id={props.canvasId} width={props.width * props.scale} height={props.height * props.scale}></canvas>
        </div>
    )
}